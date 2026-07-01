/* PARTY TALES — live chat widget.
   Floating button -> chat window. Visitor messages go to the backend, which
   notifies a manager in Telegram. The manager replies from Telegram and the
   answers appear here via polling. */
(function () {
  'use strict';

  var BACKEND = (typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : 'http://localhost:5000');
  var SEND_URL = BACKEND + '/api/chat/send';
  var POLL_URL = BACKEND + '/api/chat/poll';
  var HISTORY_URL = BACKEND + '/api/chat/history';

  var POLL_OPEN_MS = 3000;     // while window is open
  var POLL_IDLE_MS = 10000;    // while closed (keeps unread badge + history fresh)
  var TEASER_DELAY_MS = 15000; // proactive greeting after this much time on the page

  // How long the "typing…" dots stay up before a reply is revealed, so answers
  // never pop in instantly. Scales with reply length, within these bounds.
  var TYPING_MIN_MS = 1400;
  var TYPING_PER_CHAR_MS = 15;
  var TYPING_MAX_MS = 3500;

  var AVATAR = 'images/about-natalia.webp';

  // ---- localStorage state ----
  var LS_VISITOR = 'pt_chat_visitor';
  var LS_SESSION = 'pt_chat_session';
  var LS_LAST = 'pt_chat_last';
  var LS_SEEN = 'pt_chat_seen';
  var LS_NAME = 'pt_chat_name';
  var LS_HISTORY = 'pt_chat_history'; // persisted conversation so it survives reloads
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
  var restoring = false; // true while replaying saved history (so we don't re-save it)

  // ---- conversation history (persisted, so the chat survives a page reload) ----
  function loadHistory() {
    try {
      var arr = JSON.parse(lsGet(LS_HISTORY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  var history = loadHistory();

  function saveHistory() {
    try {
      if (history.length > 200) history = history.slice(-200); // keep storage bounded
      lsSet(LS_HISTORY, JSON.stringify(history));
    } catch (e) {}
  }
  function record(kind, sender, text) {
    if (restoring) return;
    history.push({ kind: kind, sender: sender, text: text });
    saveHistory();
  }
  var isOpen = false;
  var pollTimer = null;
  var greetingShown = false;
  var teaserTimer = null;

  // ---- i18n ----
  var STRINGS = {
    de: {
      title: 'Schreiben Sie uns',
      subOnline: 'Natalia ist online',
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
      subOnline: 'Наталия на связи',
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
      subOnline: 'Natalia is online',
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
            '<span class="pt-chat-title">' + t('agentName') + '</span>' +
            '<span class="pt-chat-status is-online"><i class="pt-chat-dot"></i><span class="pt-chat-status-text">' + t('subOnline') + '</span></span>' +
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
    // Shown once per browser tab. A past session does not suppress it — a
    // returning visitor still gets the gentle nudge (unless the panel is open).
    if (isOpen || ssGet(SS_TEASER)) return;
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
    if (ssGet(SS_TEASER)) return;
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

  // Pin the view to the newest message. Deferred a frame so it works right after
  // the panel is un-hidden (a hidden panel has no scrollHeight to measure).
  function scrollToBottom() {
    requestAnimationFrame(function () {
      if (els.body) els.body.scrollTop = els.body.scrollHeight;
    });
  }

  function appendBubble(sender, text) {
    var wrap = document.createElement('div');
    wrap.className = 'pt-msg pt-msg-' + sender;
    wrap.innerHTML = '<span class="pt-msg-text">' + escapeHtml(text).replace(/\n/g, '<br>') + '</span>';
    els.body.appendChild(wrap);
    els.body.scrollTop = els.body.scrollHeight;
    record('bubble', sender, text);
  }

  // "Typing…" indicator — three shimmering dots shown while we wait for a reply.
  // Ephemeral: never recorded in history, always the last node in the body.
  var typingTimer = null;
  var typingStart = 0;
  function showTyping() {
    hideTyping();
    var wrap = document.createElement('div');
    wrap.className = 'pt-msg pt-msg-manager pt-typing';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<i></i><i></i><i></i>';
    els.body.appendChild(wrap);
    els.typing = wrap;
    typingStart = Date.now();
    els.body.scrollTop = els.body.scrollHeight;
    // Don't leave the dots spinning forever if a reply is slow (e.g. a human
    // manager who hasn't answered yet).
    typingTimer = setTimeout(hideTyping, 20000);
  }

  // How long the dots should still linger before revealing a reply of `text`,
  // given they've already been visible since `typingStart`.
  function remainingTypingDelay(text) {
    var want = Math.min(TYPING_MIN_MS + (text ? text.length : 0) * TYPING_PER_CHAR_MS, TYPING_MAX_MS);
    return Math.max(0, want - (Date.now() - typingStart));
  }
  function hideTyping() {
    if (typingTimer) { clearTimeout(typingTimer); typingTimer = null; }
    if (els.typing && els.typing.parentNode) {
      els.typing.parentNode.removeChild(els.typing);
    }
    els.typing = null;
  }

  // `ephemeral` system notices (e.g. send errors) are shown but not persisted.
  function appendSystem(text, ephemeral) {
    var wrap = document.createElement('div');
    wrap.className = 'pt-msg-system';
    wrap.textContent = text;
    els.body.appendChild(wrap);
    els.body.scrollTop = els.body.scrollHeight;
    if (!ephemeral) record('system', null, text);
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
    record('greeting', null, text);
  }

  // Replay the saved conversation into the panel (DOM only — no re-saving).
  function restoreHistory() {
    if (!history.length) return;
    restoring = true;
    history.forEach(function (m) {
      if (m.kind === 'greeting') appendAgentGreeting(m.text);
      else if (m.kind === 'system') appendSystem(m.text);
      else appendBubble(m.sender, m.text);
    });
    restoring = false;
    greetingShown = true; // a conversation already exists; don't inject a fresh greeting
  }

  // Map the server's flat message list into our history records. The first
  // manager message is shown as the personal "greeting" bubble (avatar + name).
  function serverToHistory(msgs) {
    var out = [];
    var firstManagerSeen = false;
    msgs.forEach(function (m) {
      if (m.sender === 'system') {
        // Hide handoff markers on reload too, so the illusion survives a refresh.
        if (m.text === '__manager_joined__' || m.text === '__manager_left__') return;
        out.push({ kind: 'system', sender: null, text: systemText(m.text) });
      } else if (m.sender === 'visitor') {
        out.push({ kind: 'bubble', sender: 'visitor', text: m.text });
      } else { // manager (real reply or AI assistant)
        if (!firstManagerSeen) {
          out.push({ kind: 'greeting', sender: null, text: m.text });
          firstManagerSeen = true;
        } else {
          out.push({ kind: 'bubble', sender: 'manager', text: m.text });
        }
      }
    });
    return out;
  }

  // The server is the source of truth. On load we pull the full conversation so
  // the visitor's view always matches what the manager has — even if this
  // browser's local copy was cleared. Falls back to the local copy if offline.
  function hydrateFromServer(cb) {
    var prevLast = lastId;
    var url = HISTORY_URL + '?session_id=' + encodeURIComponent(sessionId) +
              '&visitor_id=' + encodeURIComponent(visitorId);
    fetch(url).then(function (r) {
      return r.ok ? r.json() : Promise.reject(r.status);
    }).then(function (data) {
      if (data.manager_joined !== undefined) setManagerJoined(data.manager_joined);
      var msgs = data.messages || [];
      els.body.innerHTML = '';
      history = serverToHistory(msgs);
      saveHistory();
      restoreHistory(); // replay the reconciled history into the panel
      var unread = 0;
      msgs.forEach(function (m) {
        if (m.id > lastId) lastId = m.id;
        // Manager replies that arrived since this browser last looked = unread.
        if (m.id > prevLast && m.sender === 'manager') unread++;
      });
      lsSet(LS_LAST, lastId);
      if (unread && !isOpen) bumpBadge(unread);
      if (cb) cb(true);
    }).catch(function () {
      if (cb) cb(false);
    });
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
    // Tracked internally (for the join cue), but the header always reads "online":
    // the visitor should feel Natalia is right there, whether the assistant or a
    // human is answering.
    managerJoined = joined;
    els.status.classList.add('is-online');
    els.statusText.textContent = t('subOnline');
  }

  // ---- network ----
  function onSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    var text = els.text.value.trim();
    if (!text) return;

    appendBubble('visitor', text);
    els.text.value = '';
    autoGrow();
    showTyping();

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
      if (data.message_id) {
        // Trust the id of the message we just created. If it's lower than what we
        // had stored, the server DB was reset — snapping lastId back here resyncs
        // us so the reply is polled in, instead of polling past it forever.
        lastId = data.message_id;
        lsSet(LS_LAST, lastId);
      }
      if (first) { updateNameField(); }
      poll();
    }).catch(function () {
      hideTyping();
      appendSystem(t('error'), true);
    });
  }

  var revealTimer = null;
  var playing = false;
  var playQueue = [];
  // Ids we've already shown/queued, so two overlapping polls (e.g. the explicit
  // poll after sending + an interval tick) can never render the same reply twice.
  var seenIds = {};

  // Append one polled message. Handoff markers ("manager joined/left") stay
  // invisible so the visitor believes it's Natalia throughout.
  function appendPolled(m) {
    if (m.sender === 'system') {
      if (m.text === '__manager_joined__' || m.text === '__manager_left__') return;
      appendSystem(systemText(m.text));
    } else {
      appendBubble('manager', m.text);
    }
  }

  function batchFlags(msgs) {
    var joined = false, hasText = false;
    msgs.forEach(function (m) {
      if (m.sender === 'system') { if (m.text === '__manager_joined__') joined = true; }
      else hasText = true;
    });
    return { joined: joined, hasText: hasText };
  }

  // Paint a batch at once — used when the panel is closed (nobody's watching the
  // dots, so just make sure the messages and unread badge are up to date).
  function renderNow(msgs) {
    var unread = 0;
    msgs.forEach(function (m) { appendPolled(m); if (m.sender !== 'system') unread++; });
    if (unread && !isOpen) bumpBadge(unread);
    var f = batchFlags(msgs);
    if (f.joined && !f.hasText) showTyping();
  }

  // Reveal a batch one bubble at a time, dots up before each, so a multi-part
  // answer reads like Natalia sending a few quick messages in a row.
  function playMessages(msgs, done) {
    var f = batchFlags(msgs);
    var idx = 0;
    function finish() {
      hideTyping();
      // Just joined and nothing typed yet — leave the cue up; she's about to write.
      if (f.joined && !f.hasText) showTyping();
      if (done) done();
    }
    function step(freshDots) {
      if (idx >= msgs.length) { finish(); return; }
      var m = msgs[idx];
      if (m.sender === 'system') { // notices appear instantly, no typing act
        hideTyping();
        appendPolled(m);
        idx++;
        step(true);
        return;
      }
      if (freshDots || !els.typing) showTyping();
      clearTimeout(revealTimer);
      revealTimer = setTimeout(function () {
        try {
          hideTyping();
          appendPolled(m);
          if (!isOpen) bumpBadge(1);
        } catch (e) { /* never let one bubble freeze the rest */ }
        idx++;
        step(true);
      }, remainingTypingDelay(m.text));
    }
    step(false); // first bubble reuses the dots already up since the visitor sent
  }

  // Serialise playback so a poll landing mid-animation never clobbers the timer.
  function drainQueue() {
    if (!playQueue.length) { playing = false; return; }
    var batch = playQueue; playQueue = [];
    try {
      playMessages(batch, drainQueue);
    } catch (e) {
      // Fall back to an instant render so playback can never get stuck.
      renderNow(batch);
      drainQueue();
    }
  }
  function enqueuePlay(msgs) {
    playQueue = playQueue.concat(msgs);
    if (playing) return;
    playing = true;
    drainQueue();
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
      var msgs = data.messages || [];
      if (!msgs.length) return;
      // Drop anything already seen and advance the cursor now, so a concurrent
      // poll (the after-send poll racing an interval tick) can't render the same
      // reply twice while it's still pending behind the typing dots.
      var fresh = [];
      msgs.forEach(function (m) {
        if (seenIds[m.id]) return;
        seenIds[m.id] = true;
        if (m.id > lastId) lastId = m.id;
        fresh.push(m);
      });
      if (!fresh.length) return;
      lsSet(LS_LAST, lastId);
      if (isOpen) enqueuePlay(fresh);
      else renderNow(fresh);
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
    scrollToBottom(); // land at the latest message, not the top of the history
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
    els.title.textContent = t('agentName');
    els.statusText.textContent = t('subOnline');
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
    // Catch up instantly when the visitor returns to the tab, instead of waiting
    // for the next poll tick.
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && sessionId) poll();
    });
    window.addEventListener('focus', function () { if (sessionId) poll(); });
    if (sessionId) {
      // The server holds the authoritative conversation. Pull it so the visitor
      // sees exactly what the manager sees, then keep the unread badge fresh.
      // If the server is unreachable, fall back to the locally saved copy.
      hydrateFromServer(function (ok) {
        if (!ok) restoreHistory();
        startPolling(POLL_IDLE_MS);
      });
    } else {
      // No session yet — replay any locally saved conversation so it survives reloads.
      restoreHistory();
    }
    // Proactive greeting, shown once per tab regardless of any past session.
    scheduleTeaser();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
