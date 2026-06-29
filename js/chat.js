/* PARTY TALES — live chat widget.
   Floating button -> chat window. Visitor messages go to the backend, which
   notifies a manager in Telegram. The manager replies from Telegram and the
   answers appear here via polling. */
(function () {
  'use strict';

  var BACKEND = (typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : 'http://localhost:5000');
  var SEND_URL = BACKEND + '/api/chat/send';
  var POLL_URL = BACKEND + '/api/chat/poll';

  var POLL_OPEN_MS = 4000;     // while window is open
  var POLL_IDLE_MS = 25000;    // while closed (just to refresh the unread badge)
  var TEASER_DELAY_MS = 15000; // proactive greeting after this much time on the page

  var AVATAR = 'images/about-natalia.webp';

  // ---- localStorage state ----
  var LS_VISITOR = 'pt_chat_visitor';
  var LS_SESSION = 'pt_chat_session';
  var LS_LAST = 'pt_chat_last';
  var LS_SEEN = 'pt_chat_seen';
  var LS_NAME = 'pt_chat_name';
  var SS_TEASER = 'pt_chat_teaser_shown'; // sessionStorage: show proactive teaser once per tab

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function getVisitorId() {
    var v = lsGet(LS_VISITOR);
    if (!v) {
      v = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      lsSet(LS_VISITOR, v);
    }
    return v;
  }

  var visitorId = getVisitorId();
  var sessionId = parseInt(lsGet(LS_SESSION), 10) || null;
  var lastId = parseInt(lsGet(LS_LAST), 10) || 0;
  var managerJoined = false;
  var isOpen = false;
  var pollTimer = null;
  var greetingShown = false;
  var teaserTimer = null;

  // ---- i18n ----
  var STRINGS = {
    de: {
      title: 'Schreiben Sie uns',
      subOnline: 'Manager ist online',
      subOffline: 'Wir antworten gleich',
      placeholder: 'Nachricht eingeben…',
      send: 'Senden',
      open: 'Chat öffnen',
      close: 'Schliessen',
      greeting: 'Hallo! 👋 Wie können wir Ihnen bei Ihrem Fest helfen? Schreiben Sie uns — wir antworten so schnell wie möglich.',
      sent: 'Nachricht gesendet. Ein Manager antwortet in Kürze.',
      joined: 'Ein Manager hat sich verbunden ✨',
      left: 'Der Manager hat den Chat verlassen. Sie können trotzdem schreiben.',
      error: 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut.',
      agentName: 'Natalia',
      agentRole: 'PARTY TALES',
      namePlaceholder: 'Ihr Name (optional)',
      proDefault: 'Hallo! 👋 Ich bin Natalia von PARTY TALES. Kann ich Ihnen helfen, die perfekte Dekoration für Ihr Fest zu finden?',
      proServices: 'Fragen zu unseren Paketen? 🎈 Ich helfe Ihnen gern, das Passende zu finden.',
      proGallery: 'Gefällt Ihnen, was Sie sehen? ✨ Gern erzähle ich mehr zu jedem Projekt.',
      proContacts: 'Soll ich Sie zurückrufen? 📞 Schreiben Sie mir einfach hier.',
      proAbout: 'Schön, dass Sie mehr über uns erfahren möchten! 💕 Haben Sie eine Frage?'
    },
    ru: {
      title: 'Напишите нам',
      subOnline: 'Менеджер на связи',
      subOffline: 'Ответим в ближайшее время',
      placeholder: 'Введите сообщение…',
      send: 'Отправить',
      open: 'Открыть чат',
      close: 'Закрыть',
      greeting: 'Здравствуйте! 👋 Чем можем помочь с вашим праздником? Напишите нам — ответим как можно быстрее.',
      sent: 'Сообщение отправлено. Менеджер скоро ответит.',
      joined: 'Менеджер подключился ✨',
      left: 'Менеджер вышел из чата. Вы всё равно можете написать.',
      error: 'Не удалось отправить. Попробуйте ещё раз.',
      agentName: 'Наталия',
      agentRole: 'PARTY TALES',
      namePlaceholder: 'Ваше имя (необязательно)',
      proDefault: 'Здравствуйте! 👋 Меня зовут Наталия, студия PARTY TALES. Помочь подобрать оформление для вашего праздника?',
      proServices: 'Есть вопросы по нашим пакетам? 🎈 С радостью помогу выбрать подходящий.',
      proGallery: 'Нравится то, что видите? ✨ Расскажу подробнее о любом проекте.',
      proContacts: 'Хотите, перезвоним вам? 📞 Просто напишите мне здесь.',
      proAbout: 'Рады, что вы хотите узнать о нас больше! 💕 Есть вопрос?'
    },
    en: {
      title: 'Chat with us',
      subOnline: 'Manager is online',
      subOffline: 'We reply shortly',
      placeholder: 'Type a message…',
      send: 'Send',
      open: 'Open chat',
      close: 'Close',
      greeting: 'Hi! 👋 How can we help with your celebration? Drop us a message — we reply as fast as we can.',
      sent: 'Message sent. A manager will reply soon.',
      joined: 'A manager has joined ✨',
      left: 'The manager left the chat. You can still write.',
      error: 'Could not send. Please try again.',
      agentName: 'Natalia',
      agentRole: 'PARTY TALES',
      namePlaceholder: 'Your name (optional)',
      proDefault: "Hi! 👋 I'm Natalia from PARTY TALES. Can I help you find the perfect decor for your celebration?",
      proServices: 'Questions about our packages? 🎈 Happy to help you pick the right one.',
      proGallery: 'Like what you see? ✨ I can tell you more about any project.',
      proContacts: 'Want us to call you back? 📞 Just drop me a message here.',
      proAbout: 'Glad you want to know more about us! 💕 Any questions?'
    }
  };

  function lang() {
    var l = (typeof currentLang !== 'undefined') ? currentLang : (lsGet('partyTalesLang') || 'de');
    return STRINGS[l] ? l : 'de';
  }
  function t(key) { return STRINGS[lang()][key]; }

  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  // Context-aware proactive greeting, picked from the current page.
  function getProactive() {
    var p = location.pathname.toLowerCase();
    if (p.indexOf('services') !== -1) return t('proServices');
    if (p.indexOf('gallery') !== -1) return t('proGallery');
    if (p.indexOf('contact') !== -1) return t('proContacts');
    if (p.indexOf('about') !== -1) return t('proAbout');
    return t('proDefault');
  }

  // ---- DOM ----
  var els = {};

  function svgIcon() {
    return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  }
  function svgClose() {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  }
  function svgSend() {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
  }

  function build() {
    var root = document.createElement('div');
    root.className = 'pt-chat';
    root.innerHTML =
      '<div class="pt-chat-teaser" hidden>' +
        '<button class="pt-chat-teaser-close" type="button" aria-label="' + t('close') + '">' + svgClose() + '</button>' +
        '<img class="pt-chat-teaser-ava" src="' + AVATAR + '" alt="" loading="lazy">' +
        '<div class="pt-chat-teaser-body">' +
          '<span class="pt-chat-teaser-name"></span>' +
          '<span class="pt-chat-teaser-text"></span>' +
        '</div>' +
      '</div>' +
      '<button class="pt-chat-fab" type="button" aria-label="' + t('open') + '">' +
        svgIcon() +
        '<span class="pt-chat-badge" hidden>1</span>' +
      '</button>' +
      '<div class="pt-chat-panel" role="dialog" aria-modal="false" hidden>' +
        '<div class="pt-chat-head">' +
          '<img class="pt-chat-head-ava" src="' + AVATAR + '" alt="" loading="lazy">' +
          '<div class="pt-chat-head-info">' +
            '<span class="pt-chat-title">' + t('title') + '</span>' +
            '<span class="pt-chat-status"><i class="pt-chat-dot"></i><span class="pt-chat-status-text">' + t('subOffline') + '</span></span>' +
          '</div>' +
          '<button class="pt-chat-close" type="button" aria-label="' + t('close') + '">' + svgClose() + '</button>' +
        '</div>' +
        '<div class="pt-chat-body" aria-live="polite"></div>' +
        '<form class="pt-chat-input">' +
          '<input class="pt-chat-name" type="text" placeholder="' + t('namePlaceholder') + '" maxlength="100" hidden>' +
          '<div class="pt-chat-input-row">' +
            '<textarea class="pt-chat-text" rows="1" placeholder="' + t('placeholder') + '" maxlength="2000"></textarea>' +
            '<button class="pt-chat-send" type="submit" aria-label="' + t('send') + '">' + svgSend() + '</button>' +
          '</div>' +
        '</form>' +
      '</div>';
    document.body.appendChild(root);

    els.root = root;
    els.teaser = root.querySelector('.pt-chat-teaser');
    els.teaserName = root.querySelector('.pt-chat-teaser-name');
    els.teaserText = root.querySelector('.pt-chat-teaser-text');
    els.teaserClose = root.querySelector('.pt-chat-teaser-close');
    els.fab = root.querySelector('.pt-chat-fab');
    els.badge = root.querySelector('.pt-chat-badge');
    els.panel = root.querySelector('.pt-chat-panel');
    els.title = root.querySelector('.pt-chat-title');
    els.statusText = root.querySelector('.pt-chat-status-text');
    els.status = root.querySelector('.pt-chat-status');
    els.close = root.querySelector('.pt-chat-close');
    els.body = root.querySelector('.pt-chat-body');
    els.form = root.querySelector('.pt-chat-input');
    els.name = root.querySelector('.pt-chat-name');
    els.text = root.querySelector('.pt-chat-text');
    els.send = root.querySelector('.pt-chat-send');

    var savedName = lsGet(LS_NAME);
    if (savedName) els.name.value = savedName;

    els.fab.addEventListener('click', toggle);
    els.close.addEventListener('click', closePanel);
    els.form.addEventListener('submit', onSubmit);
    els.text.addEventListener('input', autoGrow);
    els.text.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSubmit(e);
      }
    });
    els.teaser.addEventListener('click', function () { hideTeaser(); openPanel(); });
    els.teaserClose.addEventListener('click', function (e) {
      e.stopPropagation();
      hideTeaser();
    });
  }

  function showTeaser() {
    if (isOpen || sessionId || ssGet(SS_TEASER)) return;
    ssSet(SS_TEASER, '1');
    els.teaserName.textContent = t('agentName');
    els.teaserText.textContent = getProactive();
    els.teaser.hidden = false;
    els.root.classList.add('has-teaser');
    requestAnimationFrame(function () { els.teaser.classList.add('is-in'); });
  }

  function hideTeaser() {
    if (teaserTimer) { clearTimeout(teaserTimer); teaserTimer = null; }
    els.teaser.classList.remove('is-in');
    els.root.classList.remove('has-teaser');
    els.teaser.hidden = true;
  }

  function scheduleTeaser() {
    if (sessionId || ssGet(SS_TEASER)) return;
    teaserTimer = setTimeout(showTeaser, TEASER_DELAY_MS);
  }

  function autoGrow() {
    els.text.style.height = 'auto';
    els.text.style.height = Math.min(els.text.scrollHeight, 120) + 'px';
  }

  // ---- rendering ----
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function appendBubble(sender, text) {
    var wrap = document.createElement('div');
    wrap.className = 'pt-msg pt-msg-' + sender;
    wrap.innerHTML = '<span class="pt-msg-text">' + escapeHtml(text).replace(/\n/g, '<br>') + '</span>';
    els.body.appendChild(wrap);
    els.body.scrollTop = els.body.scrollHeight;
  }

  function appendSystem(text) {
    var wrap = document.createElement('div');
    wrap.className = 'pt-msg-system';
    wrap.textContent = text;
    els.body.appendChild(wrap);
    els.body.scrollTop = els.body.scrollHeight;
  }

  function systemText(token) {
    if (token === '__manager_joined__') return t('joined');
    if (token === '__manager_left__') return t('left');
    return token;
  }

  // First message looks like it comes from a real person (avatar + name).
  function appendAgentGreeting(text) {
    var wrap = document.createElement('div');
    wrap.className = 'pt-msg-greeting';
    wrap.innerHTML =
      '<img class="pt-msg-ava" src="' + AVATAR + '" alt="" loading="lazy">' +
      '<div class="pt-msg-greeting-body">' +
        '<span class="pt-msg-greeting-name">' + escapeHtml(t('agentName')) + ' · ' + escapeHtml(t('agentRole')) + '</span>' +
        '<span class="pt-msg pt-msg-manager"><span class="pt-msg-text">' + escapeHtml(text).replace(/\n/g, '<br>') + '</span></span>' +
      '</div>';
    els.body.appendChild(wrap);
    els.body.scrollTop = els.body.scrollHeight;
  }

  function showGreeting() {
    if (greetingShown) return;
    if (els.body.children.length === 0) appendAgentGreeting(getProactive());
    greetingShown = true;
  }

  function updateNameField() {
    // Ask for a name only before a conversation exists.
    els.name.hidden = !!sessionId;
  }

  function setManagerJoined(joined) {
    managerJoined = joined;
    els.status.classList.toggle('is-online', joined);
    els.statusText.textContent = joined ? t('subOnline') : t('subOffline');
  }

  // ---- network ----
  function onSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    var text = els.text.value.trim();
    if (!text) return;

    appendBubble('visitor', text);
    els.text.value = '';
    autoGrow();

    var name = els.name.value.trim();
    if (name) lsSet(LS_NAME, name);

    var payload = {
      visitor_id: visitorId,
      session_id: sessionId,
      text: text,
      name: name,
      language: (typeof currentLang !== 'undefined') ? currentLang : 'de',
      page_url: location.pathname + location.search
    };

    fetch(SEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.ok ? r.json() : Promise.reject(r.status);
    }).then(function (data) {
      var first = !sessionId;
      sessionId = data.session_id;
      lsSet(LS_SESSION, sessionId);
      if (data.message_id && data.message_id > lastId) {
        lastId = data.message_id;
        lsSet(LS_LAST, lastId);
      }
      if (first) { appendSystem(t('sent')); updateNameField(); }
      poll();
    }).catch(function () {
      appendSystem(t('error'));
    });
  }

  function poll() {
    if (!sessionId) return;
    var url = POLL_URL + '?session_id=' + encodeURIComponent(sessionId) +
              '&visitor_id=' + encodeURIComponent(visitorId) +
              '&after=' + encodeURIComponent(lastId);
    fetch(url).then(function (r) {
      return r.ok ? r.json() : Promise.reject(r.status);
    }).then(function (data) {
      if (data.manager_joined !== undefined) setManagerJoined(data.manager_joined);
      var unread = 0;
      (data.messages || []).forEach(function (m) {
        if (m.id > lastId) { lastId = m.id; }
        if (m.sender === 'system') {
          appendSystem(systemText(m.text));
        } else {
          appendBubble('manager', m.text);
          unread++;
        }
      });
      lsSet(LS_LAST, lastId);
      if (unread && !isOpen) bumpBadge(unread);
    }).catch(function () { /* network hiccup — keep polling */ });
  }

  function bumpBadge(n) {
    var seen = parseInt(lsGet(LS_SEEN), 10) || 0;
    var total = seen + n;
    lsSet(LS_SEEN, total);
    els.badge.textContent = total > 9 ? '9+' : String(total);
    els.badge.hidden = false;
  }

  function clearBadge() {
    lsSet(LS_SEEN, 0);
    els.badge.hidden = true;
  }

  function startPolling(interval) {
    stopPolling();
    pollTimer = setInterval(poll, interval);
  }
  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  // ---- open/close ----
  function openPanel() {
    isOpen = true;
    hideTeaser();
    els.panel.hidden = false;
    els.root.classList.add('is-open');
    clearBadge();
    updateNameField();
    showGreeting();
    setTimeout(function () { els.text.focus(); }, 50);
    poll();
    startPolling(POLL_OPEN_MS);
  }
  function closePanel() {
    isOpen = false;
    els.panel.hidden = true;
    els.root.classList.remove('is-open');
    if (sessionId) startPolling(POLL_IDLE_MS); else stopPolling();
  }
  function toggle() { isOpen ? closePanel() : openPanel(); }

  // ---- language refresh ----
  function applyChatLang() {
    if (!els.title) return;
    els.title.textContent = t('title');
    els.statusText.textContent = managerJoined ? t('subOnline') : t('subOffline');
    els.text.placeholder = t('placeholder');
    els.name.placeholder = t('namePlaceholder');
    els.fab.setAttribute('aria-label', t('open'));
    els.close.setAttribute('aria-label', t('close'));
    els.send.setAttribute('aria-label', t('send'));
    if (els.teaser && !els.teaser.hidden) {
      els.teaserName.textContent = t('agentName');
      els.teaserText.textContent = getProactive();
    }
  }

  function hookLanguage() {
    if (typeof window.applyLanguage === 'function' && !window.applyLanguage.__ptChat) {
      var orig = window.applyLanguage;
      var wrapped = function (l) { orig(l); applyChatLang(); };
      wrapped.__ptChat = true;
      window.applyLanguage = wrapped;
    }
  }

  function init() {
    build();
    applyChatLang();
    hookLanguage();
    // If there is an existing session, do a background poll for the unread badge.
    if (sessionId) {
      poll();
      startPolling(POLL_IDLE_MS);
    } else {
      scheduleTeaser();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
