document.addEventListener('DOMContentLoaded', function() {
  function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  var revealObserver = null;
  // Lightbox
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxCaption = document.getElementById('lightboxCaption');
  var currentIndex = 0;
  var lightboxLastFocus = null;

  // Generic focus trap for overlay dialogs (lightbox + modals)
  function trapFocus(container, e) {
    if (e.key !== 'Tab') return;
    var focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    var visible = Array.prototype.filter.call(focusable, function(el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
    if (!visible.length) return;
    var first = visible[0], last = visible[visible.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  var lightboxVideo = document.getElementById('lightboxVideo');

  function stopLightboxVideo() {
    if (lightboxVideo && !lightboxVideo.paused) lightboxVideo.pause();
  }

  function openLightboxNow(index) {
    // Единый список медиа: фото и видео — каждый .gallery-item несёт ровно
    // одно из двух, индексы совпадают с порядком в DOM.
    var items = document.querySelectorAll('.gallery-item');
    var item = items[index];
    if (!item) return;
    if (!lightbox.classList.contains('open')) {
      lightboxLastFocus = document.activeElement;
    }
    var videoSrc = item.getAttribute('data-video');
    if (videoSrc && lightboxVideo) {
      lightbox.classList.add('is-video');
      if (lightboxVideo.getAttribute('src') !== videoSrc) {
        lightboxVideo.setAttribute('src', videoSrc);
      }
      lightboxVideo.play().catch(function() {});
      lightboxCaption.textContent = '';
    } else {
      stopLightboxVideo();
      lightbox.classList.remove('is-video');
      var img = item.querySelector('img');
      if (!img) return;
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || 'Foto';
      lightboxCaption.textContent = img.alt || 'Foto';
    }
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    var closeBtn = lightbox.querySelector('.lightbox-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeLightboxNow() {
    stopLightboxVideo();
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    if (lightboxLastFocus && typeof lightboxLastFocus.focus === 'function') {
      lightboxLastFocus.focus();
      lightboxLastFocus = null;
    }
  }

  // Фото «вылетает» из сетки на весь экран и возвращается обратно
  // (View Transitions API; без поддержки — обычное открытие).
  var lbReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lbThumb = null;
  function lbCanMorph() { return !!document.startViewTransition && !lbReduce; }
  function lbMorph(update, done) {
    var root = document.documentElement;
    root.classList.add('lb-vt');
    lightbox.classList.add('lb-instant');
    var t = document.startViewTransition(update);
    t.ready.catch(function() {});
    t.finished.then(cleanup, cleanup);
    function cleanup() {
      root.classList.remove('lb-vt');
      lightbox.classList.remove('lb-instant');
      if (done) done();
    }
  }
  function openLightbox(index) {
    var items = document.querySelectorAll('.gallery-item');
    var item = items[index];
    var thumb = item && !item.getAttribute('data-video') ? item.querySelector('img') : null;
    if (!thumb || lightbox.classList.contains('open') || !lbCanMorph()) { openLightboxNow(index); return; }
    lbThumb = thumb;
    thumb.style.viewTransitionName = 'pt-photo';
    lbMorph(function() {
      thumb.style.viewTransitionName = '';
      openLightboxNow(index);
      lightboxImg.style.viewTransitionName = 'pt-photo';
      return lightboxImg.decode ? lightboxImg.decode().catch(function() {}) : null;
    }, function() { lightboxImg.style.viewTransitionName = ''; });
  }
  function closeLightbox() {
    var items = document.querySelectorAll('.gallery-item');
    var item = items[currentIndex];
    var thumb = item && !item.classList.contains('hidden') && !lightbox.classList.contains('is-video') ? item.querySelector('img') : null;
    if (!thumb || !lightbox.classList.contains('open') || !lbCanMorph()) { closeLightboxNow(); return; }
    // если пролистали стрелками — сперва подкручиваем сетку к этому фото
    var r = item.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) item.scrollIntoView({ block: 'center' });
    lightboxImg.style.viewTransitionName = 'pt-photo';
    lbMorph(function() {
      lightboxImg.style.viewTransitionName = '';
      thumb.style.viewTransitionName = 'pt-photo';
      closeLightboxNow();
    }, function() { thumb.style.viewTransitionName = ''; });
  }

  function changeImage(dir) {
    var items = document.querySelectorAll('.gallery-item');
    if (!items.length) return;
    // Листаем только фото выбранного фильтра — скрытые пропускаем
    for (var step = 0; step < items.length; step++) {
      currentIndex = (currentIndex + dir + items.length) % items.length;
      if (!items[currentIndex].classList.contains('hidden')) break;
    }
    openLightbox(currentIndex);
  }

  if (lightbox) {
    var closeBtn = lightbox.querySelector('.lightbox-close');
    var prevBtn = lightbox.querySelector('.lightbox-prev');
    var nextBtn = lightbox.querySelector('.lightbox-next');
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', function() { changeImage(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function() { changeImage(1); });
    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function(e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') changeImage(-1);
      else if (e.key === 'ArrowRight') changeImage(1);
      else if (e.key === 'Tab') trapFocus(lightbox, e);
    });
  }

  // Loaded class and lightbox handlers for hardcoded gallery images (homepage)
  document.querySelectorAll('.gallery-item > img').forEach(function(img, idx) {
    if (img.complete) { img.classList.add('loaded'); }
    else { img.addEventListener('load', function() { this.classList.add('loaded'); }); }
    if (lightbox) {
      var item = img.closest('.gallery-item');
      if (item) {
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        var label = item.querySelector('.gallery-item-label');
        item.setAttribute('aria-label', (label ? label.textContent + ' — ' : '') + 'open image');
        var open = function() { currentIndex = idx; openLightbox(idx); };
        item.addEventListener('click', open);
        item.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
        });
      } else {
        img.addEventListener('click', function() { currentIndex = idx; openLightbox(idx); });
      }
    }
  });

  // Gallery — load photos
  var galleryGrid = document.getElementById('galleryGrid');
  var galleryFilters = document.getElementById('galleryFilters');
  var galleryCat = {
  'ny-ba15b865-f12d-46cc-a1fe-ffc3fbe46173.webp': 'newyear',
  'ny-img_4770.webp': 'newyear',
  'ny-img_5360.webp': 'newyear',
  'ny-img_5843.webp': 'newyear',
  'ny-img_5859.webp': 'newyear',
  'ny-img_7339.webp': 'newyear',
  'ny-img_7346.webp': 'newyear',
  'ny-img_7357.webp': 'newyear',
  'ny-img_7364.webp': 'newyear',
  'ny-img_7387.webp': 'newyear',
  'ny-img_7392.webp': 'newyear',
  'ny-img_7487.webp': 'newyear',
  'ny-img_7492.webp': 'newyear',
  'ny-img_7512.webp': 'newyear',
  'ny-img_7542.webp': 'newyear',
  'ny-img_7585.webp': 'newyear',
  'ny-img_7590.webp': 'newyear',
  'ny-img_7616.webp': 'newyear',
  'ny-img_7662.webp': 'newyear',
  'ny-img_7678.webp': 'newyear',
  'ny-img_7801.webp': 'newyear',
  'ny-img_7822.webp': 'newyear',
  'ny-img_7832.webp': 'newyear',
  'ny-img_7942.webp': 'newyear',
  'ny-img_7955.webp': 'newyear',
  'ny-img_7972.webp': 'newyear',
  'ny-img_7994.webp': 'newyear',
  'ny-img_8011.webp': 'newyear',
  'ny-img_8026.webp': 'newyear',
  'ny-img_8034.webp': 'newyear',
  'ny-img_8197.webp': 'newyear',
  'ny-img_8208.webp': 'newyear',
  'fz-20260605_231713.webp': 'photozone',
  'fz-20260619_230811.webp': 'photozone',
  'fz-20260606_184226.webp': 'photozone',
  '0523BDD4-D1CF-4375-8A27-1834ED5CAF10.webp': 'boys',
  '0744315C-D24A-4CD5-A0E8-C6AB50BDE2DF.webp': 'love',
  '0E76160B-8854-42E9-8C8C-C932ED7D3C13.webp': 'girls',
  '0EBCCFE4-A374-4A86-A12B-D27AB0D7AB25.webp': 'love',
  '0EEFBED7-9C4C-42AD-9929-FBDDA1B4E922.webp': 'love',
  '10683988-A7C2-4015-8159-FF938A2B340D.webp': 'him',
  '16BAD5C4-CE91-4D71-A394-E6C71FB17CD6.webp': 'teens',
  '1D000A45-A36B-4782-B98B-05DE6AFB8DE3.webp': 'girls',
  '1E27F947-3ACE-4AED-95F1-0F79F644C986.webp': 'boys',
  '1E3726E7-10B3-4F9C-9257-937441014F1A.webp': 'boys',
  '208F1AD7-58E0-49C3-B35F-AF49FC3F0CDE.webp': 'teens',
  '21465F3E-B8DF-4ACA-A46F-EF060191EE85.webp': 'boys',
  '24863E95-84B8-40DA-A0A6-3CB066178DD8.webp': 'love ceiling',
  '282E51EC-F8E9-4A37-BCF6-3132C52C6751.webp': 'love',
  '29FA9E86-1BCF-4735-BF99-2AA5FFF63101.webp': 'love ceiling',
  '2B52658A-34D4-4417-A05D-F83E408AB928.webp': 'girls boys',
  '2B6D9516-8D01-4752-9111-9462F5E79D5D.webp': 'boys',
  '2FFB3D60-CBD3-4BD8-A61B-E8768BE4FED2.webp': 'girls boys',
  '30A56E4A-C85C-45FA-87DD-B559A675CD9E.webp': 'girls kitty',
  '33C3260E-B226-4CBF-9FB0-89D8FF178DD2.webp': 'boys',
  '34CBEE1B-8ED4-42F2-A0E9-E3FFAF9B80DA.webp': 'love',
  '37E8A320-6067-4E0C-AFF3-595C9450B5E0.webp': 'girls',
  '3821E836-1B0D-4E1F-9D6D-063025C4A66A.webp': 'boys',
  '399CCB98-0581-49EB-A7DD-A7FE165723B1.webp': 'teens',
  '39C517C5-6E19-43AA-8E4D-E81EDE40F6C8.webp': 'girls',
  '3A39B971-451C-4384-9353-C0F2F0AC7C7B.webp': 'him',
  '3D4F81B9-B847-4A72-BE04-AD67736F24F6.webp': 'boys',
  '3DDE2D6F-5FA3-43C8-91D0-27C34C5CDA67.webp': 'girls boys',
  '40AC94F3-CAD7-426E-BA70-4D1D0B722816.webp': 'boys',
  '415713E8-4066-408C-8EC5-8E84C971979F.webp': 'girls',
  '432B792D-F136-40C8-8BEB-1EBD7789CD54.webp': 'love',
  '44E7BF22-6F3B-4A30-BA4B-FD6E3C157391.webp': 'him',
  '470600E3-4507-4559-95A7-33D06D4F678B.webp': 'boys',
  '49078041-1180-4016-A797-9E0214568883.webp': 'love',
  '4ABFCC78-00B7-41CB-9252-FF730B000661.webp': 'love',
  '4DFA88B4-C603-4602-AD60-60E44F8973F1.webp': 'him',
  '5128310E-B59A-4B19-BEB9-3244302D5484.webp': 'love ceiling',
  '57B7DF0F-2E0E-4CCE-B98B-23BA73EDBCBA.webp': 'love',
  '62BF8D5F-8ED9-43F7-8129-024B8521CE21.webp': 'him',
  '6585A8CF-33E7-4921-BE9D-0DFBF36226AB.webp': 'boys',
  '66152DB4-1C74-44A0-87D7-0CC4A5BC44F8.webp': 'boys',
  '66E98D96-3E08-4E61-8BA2-1D0DA3902FA2.webp': 'girls surprisebox',
  '6789E071-B745-451E-A49F-99DDE287E6AB.webp': 'love',
  '68C9400B-36B8-43DF-91A3-E641E7B0F204.webp': 'girls',
  '705A64C3-5D03-47EE-A85D-0C0FFEB8A57B.webp': 'him',
  '70B3D870-844F-41C9-A46D-CF9E30828E13.webp': 'boys',
  '72C46CE7-649C-4CEB-8B3D-CEFA354FEF2F.webp': 'girls boys',
  '731DF57B-C138-49B3-8BAD-0132EEA9AB9B.webp': 'boys',
  '73758C5E-6743-4ADB-ABC0-314E4A79272B.webp': 'love ceiling',
  '747EFCA5-6C42-48E5-9FBE-13A7CEA9B9F6.webp': 'love ceiling',
  '777D44CF-EA4C-4150-85C1-71B348DB9047.webp': 'teens',
  '78FEB6E2-9B9E-492D-9AEF-184E808A633D.webp': 'boys',
  '7A45C820-B917-499E-B508-0C30F75B5BDA.webp': 'boys',
  '7A592DEC-ADCB-4D9E-92CF-418A17C63396.webp': 'teens',
  '7AF28D08-2EA4-4C12-9197-EC1882526869.webp': 'girls',
  '7D6B9EF6-0430-4858-AD99-F813E4EFAFEB.webp': 'love ceiling',
  '7FA6641E-D8BC-4EED-A4DB-5ED5B55386EE.webp': 'boys',
  '816E6CD6-116E-45EF-ACBC-549943122F11.webp': 'teens',
  '8424640A-0452-49B0-8FDF-0C0DF825D766.webp': 'boys',
  '8502B469-B1E0-4812-8EA2-1048C6B90876.webp': 'teens',
  '870D9268-FDAD-4A6A-81DB-657438266334.webp': 'love',
  '87111272-3F8D-4E5C-B2C3-66C3C9529206.webp': 'teens',
  '87ABDD10-B02F-4A47-8A7D-143C88016055.webp': 'teens',
  '89FCB87D-D0E9-4531-A725-0AE88F4D2B57.webp': 'him teens',
  '8AD140B4-3256-4A54-BA15-81B4DC048BAF.webp': 'girls photozone',
  '8DC9E238-B8C1-45CC-A7E3-7BBB0B9B421E.webp': 'boys',
  '9080B576-6EDF-45E9-833B-AE65672CE867.webp': 'girls',
  '943A21B1-75DF-43C1-88F2-DDC317DD98A4.webp': 'girls',
  '9583779D-08C4-439A-9895-2E4E7C3F4118.webp': 'him teens',
  '95C17BB3-C25A-48C9-8308-520407A81C8E.webp': 'love ceiling',
  '96DC5D75-13BE-41C2-AFE0-7154F55A189D.webp': 'teens',
  '9AC9DEEB-DEB5-4657-8600-870814BD5532.webp': 'teens',
  '9AEC9186-6A3D-42C7-B9E9-BD9A4FC474A2.webp': 'teens',
  '9C72CDCE-7539-4146-8CF4-78E1D57C8BB7.webp': 'girls',
  'A1E09A60-71C6-41E3-A140-185DB389ECAB.webp': 'girls boys',
  'A48F492F-05CF-41C9-857F-A4F6E4CF2900.webp': 'teens',
  'A615A628-87E2-4DB3-8695-D671143AAB5B.webp': 'photozone',
  'A9F4A531-555F-4F3C-B7FD-A138D7A3E68A.webp': 'him',
  'ADB9946F-4C64-4E07-9412-BB7D6F5DF771.webp': 'love',
  'AFF24DCE-0F03-4787-A994-8B2909493E46.webp': 'boys',
  'B3C6BD75-EE64-43B5-B47B-573CA52F2DC5.webp': 'girls',
  'B4050052-25B0-4C39-9F7A-0363BE33FF80.webp': 'him teens',
  'B4A38432-2F7E-4DF6-AC0F-5E7D8EE4E209.webp': 'girls photozone',
  'B653CCC5-03EB-4C3A-87F9-A67C078B5305.webp': 'boys',
  'B68A2450-01A9-4BE2-84A4-94FAB323571F.webp': 'boys photozone',
  'BA38C595-CE4F-413D-8932-31DA5374A8DD.webp': 'boys',
  'BA7016B8-221D-4EE4-A591-D195F5D27371.webp': 'him',
  'BAB84F60-816B-46D0-A686-C20F111D2EAD.webp': 'girls kitty',
  'BAE95F70-8C93-4258-878B-C8F1072EE61A.webp': 'love ceiling',
  'BED69D2C-0886-40BA-9922-6C0B8BB0BB2A.webp': 'boys',
  'C0B278E7-363B-44C8-956B-7AFA8D83C92E.webp': 'boys',
  'C371B279-0A54-408A-887C-77001683EFEF.webp': 'boys',
  'C6C0A571-CFCB-4AAF-9BC7-7CD64BE93D85.webp': 'boys',
  'CCB0EAAB-ED03-4DB0-8F00-5DF015C4227A.webp': 'love',
  'CD11B737-A774-4BF8-B0BD-EB017CB846B6.webp': 'girls boys',
  'CD81C696-3876-433E-8079-5D06ED8D79B2.webp': 'love',
  'D636A909-CC68-47D1-8738-F9C546E9331A.webp': 'boys',
  'D7995E94-06DA-45F9-A185-7EAD31B79211.webp': 'boys',
  'D7B796D5-00BA-42FF-B7A5-FD1C754F8E2B.webp': 'girls',
  'D93468E2-1A8E-4907-B931-0C3B923B2F4C.webp': 'him teens',
  'D9EEE7A0-3F9D-41A5-AB81-672435C00B2D.webp': 'love ceiling',
  'DBD3F050-36EE-4238-953F-3D503D05ABB0.webp': 'love ceiling',
  'DC905D7D-0149-401D-88DA-99CC86DF9C02.webp': 'boys',
  'E2C2E93C-4D46-47DA-98C9-DFA993BF509A.webp': 'love',
  'EFA518AA-681F-483B-A183-DE89DAF6C0F6.webp': 'girls boys',
  'F22A27C0-1D33-457A-8E37-F50C8212BA99.webp': 'boys',
  'F30CD089-7B50-4246-9365-C4E786A420DE.webp': 'love ceiling',
  'F3895621-0E25-4DA6-971E-6A272D76543B.webp': 'boys photozone',
  'F8E883ED-8304-4847-9F56-2C8AA7F38F78.webp': 'boys photozone',
  'F909B614-1094-45E2-BD5E-5B2205C28EBC.webp': 'love',
  'FBB21DED-0E2C-4C5A-8558-4FFD599010D2.webp': 'teens',
  'image.webp': 'girls photozone',
  'IMG_0312.webp': 'boys photozone',
  'IMG_1255.webp': 'boys photozone',
  'IMG_4208.webp': 'girls photozone',
  'IMG_7201.webp': 'girls photozone',
  'IMG_7225.webp': 'girls photozone',
  'IMG_R_0034.webp': 'boys photozone'
  };
  var galleryFiles = [
  'ny-ba15b865-f12d-46cc-a1fe-ffc3fbe46173.webp',
  'ny-img_4770.webp',
  'ny-img_5360.webp',
  'ny-img_5843.webp',
  'ny-img_5859.webp',
  'ny-img_7339.webp',
  'ny-img_7346.webp',
  'ny-img_7357.webp',
  'ny-img_7364.webp',
  'ny-img_7387.webp',
  'ny-img_7392.webp',
  'ny-img_7487.webp',
  'ny-img_7492.webp',
  'ny-img_7512.webp',
  'ny-img_7542.webp',
  'ny-img_7585.webp',
  'ny-img_7590.webp',
  'ny-img_7616.webp',
  'ny-img_7662.webp',
  'ny-img_7678.webp',
  'ny-img_7801.webp',
  'ny-img_7822.webp',
  'ny-img_7832.webp',
  'ny-img_7942.webp',
  'ny-img_7955.webp',
  'ny-img_7972.webp',
  'ny-img_7994.webp',
  'ny-img_8011.webp',
  'ny-img_8026.webp',
  'ny-img_8034.webp',
  'ny-img_8197.webp',
  'ny-img_8208.webp',
  'fz-20260605_231713.webp',
  'fz-20260619_230811.webp',
  'fz-20260606_184226.webp',
  '0523BDD4-D1CF-4375-8A27-1834ED5CAF10.webp',
  '0744315C-D24A-4CD5-A0E8-C6AB50BDE2DF.webp',
  '0E76160B-8854-42E9-8C8C-C932ED7D3C13.webp',
  '0EBCCFE4-A374-4A86-A12B-D27AB0D7AB25.webp',
  '0EEFBED7-9C4C-42AD-9929-FBDDA1B4E922.webp',
  '10683988-A7C2-4015-8159-FF938A2B340D.webp',
  '16BAD5C4-CE91-4D71-A394-E6C71FB17CD6.webp',
  '1D000A45-A36B-4782-B98B-05DE6AFB8DE3.webp',
  '1E27F947-3ACE-4AED-95F1-0F79F644C986.webp',
  '1E3726E7-10B3-4F9C-9257-937441014F1A.webp',
  '208F1AD7-58E0-49C3-B35F-AF49FC3F0CDE.webp',
  '21465F3E-B8DF-4ACA-A46F-EF060191EE85.webp',
  '24863E95-84B8-40DA-A0A6-3CB066178DD8.webp',
  '282E51EC-F8E9-4A37-BCF6-3132C52C6751.webp',
  '29FA9E86-1BCF-4735-BF99-2AA5FFF63101.webp',
  '2B52658A-34D4-4417-A05D-F83E408AB928.webp',
  '2B6D9516-8D01-4752-9111-9462F5E79D5D.webp',
  '2FFB3D60-CBD3-4BD8-A61B-E8768BE4FED2.webp',
  '30A56E4A-C85C-45FA-87DD-B559A675CD9E.webp',
  '33C3260E-B226-4CBF-9FB0-89D8FF178DD2.webp',
  '34CBEE1B-8ED4-42F2-A0E9-E3FFAF9B80DA.webp',
  '37E8A320-6067-4E0C-AFF3-595C9450B5E0.webp',
  '3821E836-1B0D-4E1F-9D6D-063025C4A66A.webp',
  '399CCB98-0581-49EB-A7DD-A7FE165723B1.webp',
  '39C517C5-6E19-43AA-8E4D-E81EDE40F6C8.webp',
  '3A39B971-451C-4384-9353-C0F2F0AC7C7B.webp',
  '3D4F81B9-B847-4A72-BE04-AD67736F24F6.webp',
  '3DDE2D6F-5FA3-43C8-91D0-27C34C5CDA67.webp',
  '40AC94F3-CAD7-426E-BA70-4D1D0B722816.webp',
  '415713E8-4066-408C-8EC5-8E84C971979F.webp',
  '432B792D-F136-40C8-8BEB-1EBD7789CD54.webp',
  '44E7BF22-6F3B-4A30-BA4B-FD6E3C157391.webp',
  '470600E3-4507-4559-95A7-33D06D4F678B.webp',
  '49078041-1180-4016-A797-9E0214568883.webp',
  '4ABFCC78-00B7-41CB-9252-FF730B000661.webp',
  '4DFA88B4-C603-4602-AD60-60E44F8973F1.webp',
  '5128310E-B59A-4B19-BEB9-3244302D5484.webp',
  '57B7DF0F-2E0E-4CCE-B98B-23BA73EDBCBA.webp',
  '62BF8D5F-8ED9-43F7-8129-024B8521CE21.webp',
  '6585A8CF-33E7-4921-BE9D-0DFBF36226AB.webp',
  '66152DB4-1C74-44A0-87D7-0CC4A5BC44F8.webp',
  '66E98D96-3E08-4E61-8BA2-1D0DA3902FA2.webp',
  '6789E071-B745-451E-A49F-99DDE287E6AB.webp',
  '68C9400B-36B8-43DF-91A3-E641E7B0F204.webp',
  '705A64C3-5D03-47EE-A85D-0C0FFEB8A57B.webp',
  '70B3D870-844F-41C9-A46D-CF9E30828E13.webp',
  '72C46CE7-649C-4CEB-8B3D-CEFA354FEF2F.webp',
  '731DF57B-C138-49B3-8BAD-0132EEA9AB9B.webp',
  '73758C5E-6743-4ADB-ABC0-314E4A79272B.webp',
  '747EFCA5-6C42-48E5-9FBE-13A7CEA9B9F6.webp',
  '777D44CF-EA4C-4150-85C1-71B348DB9047.webp',
  '78FEB6E2-9B9E-492D-9AEF-184E808A633D.webp',
  '7A45C820-B917-499E-B508-0C30F75B5BDA.webp',
  '7A592DEC-ADCB-4D9E-92CF-418A17C63396.webp',
  '7AF28D08-2EA4-4C12-9197-EC1882526869.webp',
  '7D6B9EF6-0430-4858-AD99-F813E4EFAFEB.webp',
  '7FA6641E-D8BC-4EED-A4DB-5ED5B55386EE.webp',
  '816E6CD6-116E-45EF-ACBC-549943122F11.webp',
  '8424640A-0452-49B0-8FDF-0C0DF825D766.webp',
  '8502B469-B1E0-4812-8EA2-1048C6B90876.webp',
  '870D9268-FDAD-4A6A-81DB-657438266334.webp',
  '87111272-3F8D-4E5C-B2C3-66C3C9529206.webp',
  '87ABDD10-B02F-4A47-8A7D-143C88016055.webp',
  '89FCB87D-D0E9-4531-A725-0AE88F4D2B57.webp',
  '8AD140B4-3256-4A54-BA15-81B4DC048BAF.webp',
  '8DC9E238-B8C1-45CC-A7E3-7BBB0B9B421E.webp',
  '9080B576-6EDF-45E9-833B-AE65672CE867.webp',
  '943A21B1-75DF-43C1-88F2-DDC317DD98A4.webp',
  '9583779D-08C4-439A-9895-2E4E7C3F4118.webp',
  '95C17BB3-C25A-48C9-8308-520407A81C8E.webp',
  '96DC5D75-13BE-41C2-AFE0-7154F55A189D.webp',
  '9AC9DEEB-DEB5-4657-8600-870814BD5532.webp',
  '9AEC9186-6A3D-42C7-B9E9-BD9A4FC474A2.webp',
  '9C72CDCE-7539-4146-8CF4-78E1D57C8BB7.webp',
  'A1E09A60-71C6-41E3-A140-185DB389ECAB.webp',
  'A48F492F-05CF-41C9-857F-A4F6E4CF2900.webp',
  'A615A628-87E2-4DB3-8695-D671143AAB5B.webp',
  'A9F4A531-555F-4F3C-B7FD-A138D7A3E68A.webp',
  'ADB9946F-4C64-4E07-9412-BB7D6F5DF771.webp',
  'AFF24DCE-0F03-4787-A994-8B2909493E46.webp',
  'B3C6BD75-EE64-43B5-B47B-573CA52F2DC5.webp',
  'B4050052-25B0-4C39-9F7A-0363BE33FF80.webp',
  'B4A38432-2F7E-4DF6-AC0F-5E7D8EE4E209.webp',
  'B653CCC5-03EB-4C3A-87F9-A67C078B5305.webp',
  'B68A2450-01A9-4BE2-84A4-94FAB323571F.webp',
  'BA38C595-CE4F-413D-8932-31DA5374A8DD.webp',
  'BA7016B8-221D-4EE4-A591-D195F5D27371.webp',
  'BAB84F60-816B-46D0-A686-C20F111D2EAD.webp',
  'BAE95F70-8C93-4258-878B-C8F1072EE61A.webp',
  'BED69D2C-0886-40BA-9922-6C0B8BB0BB2A.webp',
  'C0B278E7-363B-44C8-956B-7AFA8D83C92E.webp',
  'C371B279-0A54-408A-887C-77001683EFEF.webp',
  'C6C0A571-CFCB-4AAF-9BC7-7CD64BE93D85.webp',
  'CCB0EAAB-ED03-4DB0-8F00-5DF015C4227A.webp',
  'CD11B737-A774-4BF8-B0BD-EB017CB846B6.webp',
  'CD81C696-3876-433E-8079-5D06ED8D79B2.webp',
  'D636A909-CC68-47D1-8738-F9C546E9331A.webp',
  'D7995E94-06DA-45F9-A185-7EAD31B79211.webp',
  'D7B796D5-00BA-42FF-B7A5-FD1C754F8E2B.webp',
  'D93468E2-1A8E-4907-B931-0C3B923B2F4C.webp',
  'D9EEE7A0-3F9D-41A5-AB81-672435C00B2D.webp',
  'DBD3F050-36EE-4238-953F-3D503D05ABB0.webp',
  'DC905D7D-0149-401D-88DA-99CC86DF9C02.webp',
  'E2C2E93C-4D46-47DA-98C9-DFA993BF509A.webp',
  'EFA518AA-681F-483B-A183-DE89DAF6C0F6.webp',
  'F22A27C0-1D33-457A-8E37-F50C8212BA99.webp',
  'F30CD089-7B50-4246-9365-C4E786A420DE.webp',
  'F3895621-0E25-4DA6-971E-6A272D76543B.webp',
  'F8E883ED-8304-4847-9F56-2C8AA7F38F78.webp',
  'F909B614-1094-45E2-BD5E-5B2205C28EBC.webp',
  'FBB21DED-0E2C-4C5A-8558-4FFD599010D2.webp',
  'image.webp',
  'IMG_0312.webp',
  'IMG_1255.webp',
  'IMG_4208.webp',
  'IMG_7201.webp',
  'IMG_7225.webp',
  'IMG_R_0034.webp'
  ];
  // Общий список роликов: фон хиро на главной (в галерее с 11.2026 только фото).
  // update-videos.sh регенерирует его по содержимому images/videos/.
  var videoFiles = [
      '21648386-BF0B-4BC9-9121-B91E654D624B.mp4',
      '3C66D7B5-A73C-4F7F-94BD-9D1E2C2F4E15.mp4',
      '48097ACB-A510-486B-A904-FC138491F799.mp4',
      '4EEB4351-22FD-416A-9497-C2C4C504C607.mp4',
      '6B035B18-C131-40DB-816B-2572424A8183.mp4',
      '79A4AB79-D2F1-4541-8FB8-D9FAE94621FE.mp4',
      '83B1BC35-5A64-44F1-BCCF-DE8DAE8135CD.mp4',
      'AF3E489C-A6DF-449D-B7B0-4FE0E8F57FBE.mp4',
      'IMG_8595.mp4',
      'IMG_8824.mp4',
      'IMG_9015.mp4',
      'video-12-04-23-07-25-3.mp4',
      'video-12-04-23-07-29-3.mp4',
      'video-12-04-23-07-55.mp4',
      'video-12-04-23-08-22.mp4'
    ];
  // Размеры фото (ширина, высота) — чтобы сетка не прыгала, пока фото грузятся.
  // При добавлении фото дописать сюда (иначе размер подхватится после загрузки).
  var galleryDims = {
    'ny-ba15b865-f12d-46cc-a1fe-ffc3fbe46173.webp': [960, 1200],
    'ny-img_4770.webp': [978, 1200],
    'ny-img_5360.webp': [900, 1200],
    'ny-img_5843.webp': [900, 1200],
    'ny-img_5859.webp': [900, 1200],
    'ny-img_7339.webp': [900, 1200],
    'ny-img_7346.webp': [900, 1200],
    'ny-img_7357.webp': [900, 1200],
    'ny-img_7364.webp': [900, 1200],
    'ny-img_7387.webp': [900, 1200],
    'ny-img_7392.webp': [900, 1200],
    'ny-img_7487.webp': [900, 1200],
    'ny-img_7492.webp': [900, 1200],
    'ny-img_7512.webp': [900, 1200],
    'ny-img_7542.webp': [900, 1200],
    'ny-img_7585.webp': [900, 1200],
    'ny-img_7590.webp': [900, 1200],
    'ny-img_7616.webp': [900, 1200],
    'ny-img_7662.webp': [900, 1200],
    'ny-img_7678.webp': [900, 1200],
    'ny-img_7801.webp': [900, 1200],
    'ny-img_7822.webp': [900, 1200],
    'ny-img_7832.webp': [900, 1200],
    'ny-img_7942.webp': [900, 1200],
    'ny-img_7955.webp': [900, 1200],
    'ny-img_7972.webp': [900, 1200],
    'ny-img_7994.webp': [900, 1200],
    'ny-img_8011.webp': [900, 1200],
    'ny-img_8026.webp': [900, 1200],
    'ny-img_8034.webp': [900, 1200],
    'ny-img_8197.webp': [900, 1200],
    'ny-img_8208.webp': [900, 1200],
    'fz-20260605_231713.webp': [900, 1200],
    'fz-20260619_230811.webp': [900, 1200],
    'fz-20260606_184226.webp': [900, 1200],
    '0523BDD4-D1CF-4375-8A27-1834ED5CAF10.webp': [900, 1200],
    '0744315C-D24A-4CD5-A0E8-C6AB50BDE2DF.webp': [900, 1200],
    '0E76160B-8854-42E9-8C8C-C932ED7D3C13.webp': [900, 1200],
    '0EBCCFE4-A374-4A86-A12B-D27AB0D7AB25.webp': [899, 1200],
    '0EEFBED7-9C4C-42AD-9929-FBDDA1B4E922.webp': [900, 1200],
    '10683988-A7C2-4015-8159-FF938A2B340D.webp': [900, 1200],
    '16BAD5C4-CE91-4D71-A394-E6C71FB17CD6.webp': [900, 1200],
    '1D000A45-A36B-4782-B98B-05DE6AFB8DE3.webp': [900, 1200],
    '1E27F947-3ACE-4AED-95F1-0F79F644C986.webp': [899, 1200],
    '1E3726E7-10B3-4F9C-9257-937441014F1A.webp': [900, 1200],
    '208F1AD7-58E0-49C3-B35F-AF49FC3F0CDE.webp': [900, 1200],
    '21465F3E-B8DF-4ACA-A46F-EF060191EE85.webp': [900, 1200],
    '24863E95-84B8-40DA-A0A6-3CB066178DD8.webp': [900, 1200],
    '282E51EC-F8E9-4A37-BCF6-3132C52C6751.webp': [900, 1200],
    '29FA9E86-1BCF-4735-BF99-2AA5FFF63101.webp': [674, 1200],
    '2B52658A-34D4-4417-A05D-F83E408AB928.webp': [900, 1200],
    '2B6D9516-8D01-4752-9111-9462F5E79D5D.webp': [899, 1200],
    '2FFB3D60-CBD3-4BD8-A61B-E8768BE4FED2.webp': [900, 1200],
    '30A56E4A-C85C-45FA-87DD-B559A675CD9E.webp': [900, 1200],
    '33C3260E-B226-4CBF-9FB0-89D8FF178DD2.webp': [900, 1200],
    '34CBEE1B-8ED4-42F2-A0E9-E3FFAF9B80DA.webp': [900, 1200],
    '37E8A320-6067-4E0C-AFF3-595C9450B5E0.webp': [884, 1200],
    '3821E836-1B0D-4E1F-9D6D-063025C4A66A.webp': [900, 1200],
    '399CCB98-0581-49EB-A7DD-A7FE165723B1.webp': [899, 1200],
    '39C517C5-6E19-43AA-8E4D-E81EDE40F6C8.webp': [900, 1200],
    '3A39B971-451C-4384-9353-C0F2F0AC7C7B.webp': [900, 1200],
    '3D4F81B9-B847-4A72-BE04-AD67736F24F6.webp': [899, 1200],
    '3DDE2D6F-5FA3-43C8-91D0-27C34C5CDA67.webp': [900, 1200],
    '40AC94F3-CAD7-426E-BA70-4D1D0B722816.webp': [900, 1200],
    '415713E8-4066-408C-8EC5-8E84C971979F.webp': [900, 1200],
    '432B792D-F136-40C8-8BEB-1EBD7789CD54.webp': [899, 1200],
    '44E7BF22-6F3B-4A30-BA4B-FD6E3C157391.webp': [899, 1200],
    '470600E3-4507-4559-95A7-33D06D4F678B.webp': [900, 1200],
    '49078041-1180-4016-A797-9E0214568883.webp': [900, 1200],
    '4ABFCC78-00B7-41CB-9252-FF730B000661.webp': [899, 1200],
    '4DFA88B4-C603-4602-AD60-60E44F8973F1.webp': [900, 1200],
    '5128310E-B59A-4B19-BEB9-3244302D5484.webp': [900, 1200],
    '57B7DF0F-2E0E-4CCE-B98B-23BA73EDBCBA.webp': [900, 1200],
    '62BF8D5F-8ED9-43F7-8129-024B8521CE21.webp': [900, 1200],
    '6585A8CF-33E7-4921-BE9D-0DFBF36226AB.webp': [900, 1200],
    '66152DB4-1C74-44A0-87D7-0CC4A5BC44F8.webp': [900, 1200],
    '66E98D96-3E08-4E61-8BA2-1D0DA3902FA2.webp': [900, 1200],
    '6789E071-B745-451E-A49F-99DDE287E6AB.webp': [899, 1200],
    '68C9400B-36B8-43DF-91A3-E641E7B0F204.webp': [900, 1200],
    '705A64C3-5D03-47EE-A85D-0C0FFEB8A57B.webp': [900, 1200],
    '70B3D870-844F-41C9-A46D-CF9E30828E13.webp': [900, 1200],
    '72C46CE7-649C-4CEB-8B3D-CEFA354FEF2F.webp': [900, 1200],
    '731DF57B-C138-49B3-8BAD-0132EEA9AB9B.webp': [899, 1200],
    '73758C5E-6743-4ADB-ABC0-314E4A79272B.webp': [900, 1200],
    '747EFCA5-6C42-48E5-9FBE-13A7CEA9B9F6.webp': [899, 1200],
    '777D44CF-EA4C-4150-85C1-71B348DB9047.webp': [900, 1200],
    '78FEB6E2-9B9E-492D-9AEF-184E808A633D.webp': [900, 1200],
    '7A45C820-B917-499E-B508-0C30F75B5BDA.webp': [900, 1200],
    '7A592DEC-ADCB-4D9E-92CF-418A17C63396.webp': [900, 1200],
    '7AF28D08-2EA4-4C12-9197-EC1882526869.webp': [900, 1200],
    '7D6B9EF6-0430-4858-AD99-F813E4EFAFEB.webp': [900, 1200],
    '7FA6641E-D8BC-4EED-A4DB-5ED5B55386EE.webp': [900, 1200],
    '816E6CD6-116E-45EF-ACBC-549943122F11.webp': [900, 1200],
    '8424640A-0452-49B0-8FDF-0C0DF825D766.webp': [899, 1200],
    '8502B469-B1E0-4812-8EA2-1048C6B90876.webp': [900, 1200],
    '870D9268-FDAD-4A6A-81DB-657438266334.webp': [900, 1200],
    '87111272-3F8D-4E5C-B2C3-66C3C9529206.webp': [900, 1200],
    '87ABDD10-B02F-4A47-8A7D-143C88016055.webp': [900, 1200],
    '89FCB87D-D0E9-4531-A725-0AE88F4D2B57.webp': [900, 1200],
    '8AD140B4-3256-4A54-BA15-81B4DC048BAF.webp': [997, 1200],
    '8DC9E238-B8C1-45CC-A7E3-7BBB0B9B421E.webp': [899, 1200],
    '9080B576-6EDF-45E9-833B-AE65672CE867.webp': [900, 1200],
    '943A21B1-75DF-43C1-88F2-DDC317DD98A4.webp': [900, 1200],
    '9583779D-08C4-439A-9895-2E4E7C3F4118.webp': [900, 1200],
    '95C17BB3-C25A-48C9-8308-520407A81C8E.webp': [899, 1200],
    '96DC5D75-13BE-41C2-AFE0-7154F55A189D.webp': [900, 1200],
    '9AC9DEEB-DEB5-4657-8600-870814BD5532.webp': [900, 1200],
    '9AEC9186-6A3D-42C7-B9E9-BD9A4FC474A2.webp': [900, 1200],
    '9C72CDCE-7539-4146-8CF4-78E1D57C8BB7.webp': [900, 1200],
    'A1E09A60-71C6-41E3-A140-185DB389ECAB.webp': [900, 1200],
    'A48F492F-05CF-41C9-857F-A4F6E4CF2900.webp': [900, 1200],
    'A615A628-87E2-4DB3-8695-D671143AAB5B.webp': [900, 1200],
    'A9F4A531-555F-4F3C-B7FD-A138D7A3E68A.webp': [900, 1200],
    'ADB9946F-4C64-4E07-9412-BB7D6F5DF771.webp': [899, 1200],
    'AFF24DCE-0F03-4787-A994-8B2909493E46.webp': [900, 1200],
    'B3C6BD75-EE64-43B5-B47B-573CA52F2DC5.webp': [900, 1200],
    'B4050052-25B0-4C39-9F7A-0363BE33FF80.webp': [900, 1200],
    'B4A38432-2F7E-4DF6-AC0F-5E7D8EE4E209.webp': [900, 1200],
    'B653CCC5-03EB-4C3A-87F9-A67C078B5305.webp': [899, 1200],
    'B68A2450-01A9-4BE2-84A4-94FAB323571F.webp': [960, 1200],
    'BA38C595-CE4F-413D-8932-31DA5374A8DD.webp': [900, 1200],
    'BA7016B8-221D-4EE4-A591-D195F5D27371.webp': [899, 1200],
    'BAB84F60-816B-46D0-A686-C20F111D2EAD.webp': [900, 1200],
    'BAE95F70-8C93-4258-878B-C8F1072EE61A.webp': [900, 1200],
    'BED69D2C-0886-40BA-9922-6C0B8BB0BB2A.webp': [899, 1200],
    'C0B278E7-363B-44C8-956B-7AFA8D83C92E.webp': [900, 1200],
    'C371B279-0A54-408A-887C-77001683EFEF.webp': [900, 1200],
    'C6C0A571-CFCB-4AAF-9BC7-7CD64BE93D85.webp': [905, 1200],
    'CCB0EAAB-ED03-4DB0-8F00-5DF015C4227A.webp': [900, 1200],
    'CD11B737-A774-4BF8-B0BD-EB017CB846B6.webp': [900, 1200],
    'CD81C696-3876-433E-8079-5D06ED8D79B2.webp': [900, 1200],
    'D636A909-CC68-47D1-8738-F9C546E9331A.webp': [900, 1200],
    'D7995E94-06DA-45F9-A185-7EAD31B79211.webp': [900, 1200],
    'D7B796D5-00BA-42FF-B7A5-FD1C754F8E2B.webp': [900, 1200],
    'D93468E2-1A8E-4907-B931-0C3B923B2F4C.webp': [899, 1200],
    'D9EEE7A0-3F9D-41A5-AB81-672435C00B2D.webp': [899, 1200],
    'DBD3F050-36EE-4238-953F-3D503D05ABB0.webp': [900, 1200],
    'DC905D7D-0149-401D-88DA-99CC86DF9C02.webp': [900, 1200],
    'E2C2E93C-4D46-47DA-98C9-DFA993BF509A.webp': [900, 1200],
    'EFA518AA-681F-483B-A183-DE89DAF6C0F6.webp': [900, 1200],
    'F22A27C0-1D33-457A-8E37-F50C8212BA99.webp': [900, 1200],
    'F30CD089-7B50-4246-9365-C4E786A420DE.webp': [899, 1200],
    'F3895621-0E25-4DA6-971E-6A272D76543B.webp': [960, 1200],
    'F8E883ED-8304-4847-9F56-2C8AA7F38F78.webp': [900, 1200],
    'F909B614-1094-45E2-BD5E-5B2205C28EBC.webp': [900, 1200],
    'FBB21DED-0E2C-4C5A-8558-4FFD599010D2.webp': [900, 1200],
    'image.webp': [900, 1200],
    'IMG_0312.webp': [900, 1200],
    'IMG_1255.webp': [900, 1200],
    'IMG_4208.webp': [1039, 1200],
    'IMG_7201.webp': [967, 1200],
    'IMG_7225.webp': [942, 1200],
    'IMG_R_0034.webp': [900, 1200]
  };
  if (galleryGrid) {
    galleryGrid.innerHTML = '';
    // Плавное появление: карточка показывается только когда фото полностью
    // загружено и раскодировано, соседние — с небольшой лесенкой.
    var readyBatchAt = 0, readyBatchN = 0;
    function markReady(item) {
      if (item.classList.contains('ready')) return;
      var now = Date.now();
      readyBatchN = (now - readyBatchAt < 120) ? readyBatchN + 1 : 0;
      readyBatchAt = now;
      var delay = Math.min(readyBatchN, 6) * 70;
      item.style.transitionDelay = delay + 'ms';
      item.classList.add('ready');
      setTimeout(function() { item.style.transitionDelay = ''; }, delay + 900);
    }

    function createGalleryItem(file, idx) {
      var item = document.createElement('div');
      item.className = 'gallery-item reveal';
      var cat = galleryCat[file];
      if (cat) item.setAttribute('data-category', cat);

      var img = document.createElement('img');
      img.src = 'images/gallery/' + file;
      img.alt = 'Ballon Dekoration Ansicht';
      img.loading = 'lazy';
      img.setAttribute('data-i18n-aria', 'gallery.img.alt');

      // Фото грузятся лениво (при прокрутке), поэтому таймаута «не загрузилось»
      // нет: ошибку показываем только при настоящей ошибке загрузки.
      var dim = galleryDims[file];
      if (dim) {
        img.width = dim[0]; img.height = dim[1];
        item.style.aspectRatio = dim[0] + ' / ' + dim[1];
      }
      img.decoding = 'async';
      var shown = false;
      var show = function() {
        if (shown) return; shown = true;
        img.classList.add('loaded');
        markReady(item);
      };
      img.onload = function() {
        item.classList.remove('gallery-error');
        if (!dim && this.naturalWidth && this.naturalHeight) {
          item.style.aspectRatio = this.naturalWidth + ' / ' + this.naturalHeight;
        }
        // decode() — чтобы фото появлялось целиком, а не прорисовывалось по кускам
        if (img.decode) img.decode().then(show, show); else show();
      };
      img.onerror = function() {
        item.classList.add('gallery-error');
        show();
      };
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', 'Open image');
      (function(itemEl, idxEl) {
        var open = function() { currentIndex = idxEl; openLightbox(idxEl); };
        itemEl.addEventListener('click', function(e) {
          if (e.target.closest('a')) return;
          open();
        });
        itemEl.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
        });
      })(item, idx);

      item.innerHTML = '<div class="gallery-error-msg">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24">' +
        '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h0" stroke-linecap="round"/></svg>' +
        '<span data-i18n="gallery.img.error">Foto nicht geladen</span></div>' +
        '<div class="gallery-overlay"><span class="gallery-overlay-label" data-i18n="gallery.img.label">View</span><span class="gallery-overlay-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>';
      item.insertBefore(img, item.firstChild);
      return item;
    }

    function createVideoItem(file, idx) {
      var item = document.createElement('div');
      item.className = 'gallery-item gallery-video reveal';
      item.setAttribute('data-category', 'video');
      item.setAttribute('data-video', 'images/videos/' + file);
      // Вертикальные ролики с телефона — до прихода metadata держим 9:16,
      // чтобы колонки не прыгали.
      item.style.aspectRatio = '9 / 16';

      var vid = document.createElement('video');
      vid.src = 'images/videos/' + file;
      vid.muted = true;
      vid.playsInline = true;
      vid.preload = 'metadata';
      vid.setAttribute('aria-hidden', 'true');
      vid.tabIndex = -1;
      vid.addEventListener('loadedmetadata', function() {
        if (vid.videoWidth && vid.videoHeight) {
          item.style.aspectRatio = vid.videoWidth / vid.videoHeight;
        }
      });
      item.appendChild(vid);

      var badge = document.createElement('span');
      badge.className = 'gallery-video-badge';
      badge.setAttribute('aria-hidden', 'true');
      badge.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
      item.appendChild(badge);

      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', 'Video');
      item.setAttribute('data-i18n-aria', 'gallery.video.alt');
      var open = function() { currentIndex = idx; openLightbox(idx); };
      item.addEventListener('click', open);
      item.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
      return item;
    }

    var fragment = document.createDocumentFragment();
    var totalGalleryItems = galleryFiles.length;
    for (var i = 0; i < galleryFiles.length; i++) {
      fragment.appendChild(createGalleryItem(galleryFiles[i], i));
    }
    // В галерее только фото (ноябрь 2026): ролики остаются фоном хиро на главной.
    galleryGrid.appendChild(fragment);

    // Force hide any ongoing loader after max timeout
    setTimeout(function() {
      galleryGrid.querySelectorAll('.gallery-item img').forEach(function(img) {
        if (!img.classList.contains('loaded')) {
          img.classList.add('loaded');
          var parent = img.closest('.gallery-item');
          if (parent) { parent.classList.add('gallery-error'); markReady(parent); }
        }
      });
    }, 15000);

    if (typeof revealObserver !== 'undefined' && revealObserver) {
      galleryGrid.querySelectorAll('.gallery-item.reveal:not(.visible)').forEach(function(el) {
        revealObserver.observe(el);
      });
    }
  }

  // Фильтр галереи: у фото может быть несколько категорий через пробел.
  // Карточки услуг ведут сюда как gallery.html?filter=boys
  function applyGalleryFilter(filter) {
    if (!galleryGrid || !galleryFilters) return;
    var btn = galleryFilters.querySelector('.filter-btn[data-filter="' + filter + '"]');
    if (!btn) { filter = 'all'; btn = galleryFilters.querySelector('.filter-btn[data-filter="all"]'); }
    galleryFilters.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    galleryGrid.querySelectorAll('.gallery-item').forEach(function(item) {
      var cats = (item.getAttribute('data-category') || '').split(' ');
      item.classList.toggle('hidden', !(filter === 'all' || cats.indexOf(filter) !== -1));
    });
  }

  if (galleryFilters && galleryGrid) {
    var urlFilter = null;
    try { urlFilter = new URLSearchParams(window.location.search).get('filter'); } catch (e) {}
    if (urlFilter) applyGalleryFilter(urlFilter);
    galleryFilters.addEventListener('click', function(e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;
      var filter = btn.getAttribute('data-filter');
      applyGalleryFilter(filter);
      try {
        var url = new URL(window.location.href);
        if (filter === 'all') url.searchParams.delete('filter'); else url.searchParams.set('filter', filter);
        history.replaceState(null, '', url.toString());
      } catch (err) {}
    });
  }

  // Form inputs — scroll into view on focus (iOS keyboard fix)
  document.addEventListener('focusin', function(e) {
    var tag = e.target && e.target.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') return;
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      setTimeout(function() {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  });

  // Input focus → курсор в конец (кроме повторных кликов внутри поля)
  document.addEventListener('mousedown', function(e) {
    var tag = e.target && e.target.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
    var el = e.target;
    // setSelectionRange не применим к date/number и т.п. — бросает исключение
    if (tag === 'INPUT' && !/^(text|search|tel|url|password)$/.test(el.type)) return;
    if (!el.value) return;
    if (document.activeElement === el) return;
    el.dataset.focusEnd = '1';
  });
  document.addEventListener('mouseup', function(e) {
    var tag = e.target && e.target.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
    var el = e.target;
    if (!el.dataset.focusEnd) return;
    delete el.dataset.focusEnd;
    if (el.setSelectionRange) el.setSelectionRange(el.value.length, el.value.length);
  });
  // Per-image click handler already attached in createGalleryItem
  if (typeof applyLanguage === 'function') applyLanguage(currentLang);

  // Hero video background — dual-buffered, мгновенное переключение
  var heroVideoBg = document.getElementById('heroVideoBg');
  var heroVideoSingle = document.getElementById('heroVideoSingle');
  var heroVideo0 = document.getElementById('heroVideo0');
  var heroVideo1 = document.getElementById('heroVideo1');
  var heroVideo2 = document.getElementById('heroVideo2');

  // Пока стоит новогодняя заставка (#heroNewYear), видео в hero не грузим.
  if (document.getElementById('heroNewYear') && heroVideoBg) heroVideoBg.style.display = 'none';
  else if (heroVideoBg && (heroVideoSingle || heroVideo0)) {
    var currentMode = '';
    var singleSlot = null;
    var slots = [];
    var initObserver = null;

    function pickNext(current, used) {
      if (currentMode === 'single') return (current + 1) % videoFiles.length;
      var n = (current + 3) % videoFiles.length;
      var tries = 0;
      while (used.indexOf(n) !== -1 && tries < videoFiles.length) {
        n = (n + 1) % videoFiles.length;
        tries++;
      }
      return n;
    }

    // Старт перехода за это время до конца клипа — следующее видео
    // успевает начать играть скрытым и плавно проявиться без рывка.
    var PREROLL = 0.6;   // сек
    var FADE_MS = 600;   // длительность кроссфейда

    function createSlot(container, existingEl, initialIdx) {
      var baseCss = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;' +
                    'transition:opacity ' + FADE_MS + 'ms ease;will-change:opacity;backface-visibility:hidden';

      existingEl.muted = true;
      existingEl.playsInline = true;
      existingEl.preload = 'auto';
      existingEl.style.cssText = baseCss + ';opacity:1;z-index:1';

      var buffer = document.createElement('video');
      buffer.muted = true;
      buffer.playsInline = true;
      buffer.preload = 'auto';
      buffer.style.cssText = baseCss + ';opacity:0;z-index:0;pointer-events:none';

      container.appendChild(existingEl);
      container.appendChild(buffer);

      var slot = { active: existingEl, buffer: buffer, idx: initialIdx, nextIdx: -1, transitioning: false };

      function retryPlay(el) {
        if (!el.paused) return;
        el.play().catch(function() {
          setTimeout(function() { retryPlay(el); }, 400);
        });
      }

      function preloadNext() {
        var nextIdx = pickNext(slot.idx, slots.map(function(s) { return s.idx; }));
        slot.nextIdx = nextIdx;
        if (slot.buffer.src.indexOf(videoFiles[nextIdx]) === -1) {
          slot.buffer.src = 'images/videos/' + videoFiles[nextIdx];
          slot.buffer.load();
        }
      }

      function advanceBuffer() {
        // текущий клип в буфере не пошёл — берём следующий и пробуем позже
        var n = pickNext(slot.idx, slots.map(function(s) { return s.idx; }));
        if (n === slot.nextIdx) n = (n + 1) % videoFiles.length;
        slot.nextIdx = n;
        slot.buffer.src = 'images/videos/' + videoFiles[n];
        slot.buffer.load();
      }

      function beginCrossfade() {
        if (slot.transitioning) return;
        slot.transitioning = true;

        var a = slot.active, b = slot.buffer;
        var done = false, fadeTimer = null, giveUp = null;

        var cleanup = function() {
          b.removeEventListener('playing', onPlaying);
          b.removeEventListener('error', onError);
          clearTimeout(giveUp);
        };

        // Буфер так и не пошёл (ошибка/долгая загрузка) — НЕ прячем текущий клип,
        // оставляем его играть и берём в буфер другой ролик.
        var abort = function() {
          if (done) return;
          done = true;
          cleanup();
          slot.transitioning = false;
          if (a.paused) a.play().catch(function() {});
          advanceBuffer();
        };

        // Новый клип реально пошёл (есть кадры) — только теперь проявляем поверх.
        var commit = function() {
          if (done) return;
          done = true;
          cleanup();
          b.style.zIndex = '2';
          a.style.zIndex = '1';
          b.style.opacity = '1';
          fadeTimer = setTimeout(function() {
            a.style.opacity = '0';
            a.pause();
            if (slot.nextIdx >= 0) slot.idx = slot.nextIdx;
            slot.active = b;
            slot.buffer = a;
            slot.transitioning = false;
            preloadNext();
          }, FADE_MS + 50);
        };

        var onPlaying = function() { commit(); };
        var onError = function() { abort(); };

        b.addEventListener('playing', onPlaying);
        b.addEventListener('error', onError);

        try { b.currentTime = 0; } catch (e) {}
        var p = b.play();
        if (p && p.catch) p.catch(function() {});

        // подстраховка: буфер уже готов и идёт, но событие могло не прийти
        setTimeout(function() {
          if (!done && !b.paused && b.readyState >= 3 && b.currentTime > 0) commit();
        }, 250);
        // совсем не пошёл за разумное время — откатываемся
        giveUp = setTimeout(abort, 4000);
      }

      slot.begin = beginCrossfade;

      function attach(el) {
        el._ptSlot = slot;            // всегда указываем на актуальный слот
        if (el._ptAttached) return;   // слушатели вешаем один раз на элемент
        el._ptAttached = true;

        el.addEventListener('timeupdate', function() {
          var s = el._ptSlot;
          if (el !== s.active || s.transitioning) return;
          var d = el.duration;
          if (d && isFinite(d) && d - el.currentTime <= PREROLL) s.begin();
        });
        el.addEventListener('ended', function() {
          var s = el._ptSlot;
          if (el !== s.active) return;
          // всегда перезапускаем — кадр не должен замирать (в т.ч. во время фейда)
          el.currentTime = 0;
          el.play().catch(function() {});
          if (!s.transitioning) s.begin();
        });
        el.addEventListener('error', function() {
          var s = el._ptSlot;
          if (el === s.active && !s.transitioning) s.begin();
        });
        el.addEventListener('waiting', function() {
          var s = el._ptSlot;
          if (el !== s.active) return;
          setTimeout(function() { retryPlay(el); }, 250);
        });
      }

      attach(existingEl);
      attach(buffer);

      // даём наружу хелперы для синхронного запуска всех роликов
      slot.preloadNext = preloadNext;
      slot.retry = retryPlay;

      // только грузим — воспроизведение запустит startSlots() для всех сразу
      existingEl.src = 'images/videos/' + videoFiles[initialIdx];
      existingEl.load();

      return slot;
    }

    // Запускаем все ролики в один момент — чтобы ни один не оставался тёмным,
    // пока другие уже играют.
    function startSlots(list) {
      var actives = list.map(function(s) { return s.active; });
      var launched = false;
      var fallback;

      var go = function() {
        if (launched) return;
        launched = true;
        clearTimeout(fallback);
        list.forEach(function(s) {
          try { s.active.currentTime = 0; } catch (e) {}
        });
        // play() в одном тике для всех
        list.forEach(function(s) {
          s.active.play().catch(function() { s.retry(s.active); });
          s.active.addEventListener('playing', function() { s.preloadNext(); }, { once: true });
        });
        heroVideoBg.style.opacity = '1';
      };

      var pending = actives.length;
      var oneReady = function() { if (--pending <= 0) go(); };
      actives.forEach(function(el) {
        if (el.readyState >= 3) { oneReady(); return; }
        var onReady = function() {
          el.removeEventListener('canplay', onReady);
          el.removeEventListener('error', onReady);
          oneReady();
        };
        el.addEventListener('canplay', onReady, { once: true });
        el.addEventListener('error', onReady, { once: true });
      });
      // если что-то долго грузится — не ждём вечно
      fallback = setTimeout(go, 2500);
    }

    function cleanupSlots() {
      if (singleSlot) {
        singleSlot.active.pause();
        singleSlot.active.src = '';
        singleSlot.active.removeAttribute('style');
        singleSlot.active.removeAttribute('class');
        singleSlot.active.className = 'hero-video-single';
        singleSlot.active.id = 'heroVideoSingle';
        singleSlot.buffer.pause();
        singleSlot.buffer.src = '';
        var p = singleSlot.container.parentNode;
        if (p) p.replaceChild(singleSlot.active, singleSlot.container);
      }
      slots.forEach(function(slot) {
        slot.active.pause();
        slot.active.src = '';
        slot.active.removeAttribute('style');
        slot.active.removeAttribute('class');
        slot.active.className = 'hero-video';
        slot.buffer.pause();
        slot.buffer.src = '';
        var p = slot.container.parentNode;
        if (p) p.replaceChild(slot.active, slot.container);
      });
      singleSlot = null;
      slots = [];
    }

    function initVideoMode() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { currentMode = 'reduced'; return; }
      var newIsMobile = window.innerWidth < 768;
      var newMode = newIsMobile ? 'single' : 'grid';

      if (newMode === currentMode) return;
      currentMode = newMode;
      cleanupSlots();

      if (currentMode === 'single') {
        var wrap = document.createElement('div');
        wrap.style.cssText = 'position:absolute;inset:0;overflow:hidden';
        var parent = heroVideoSingle.parentNode;
        parent.replaceChild(wrap, heroVideoSingle);
        singleSlot = createSlot(wrap, heroVideoSingle, 0);
        singleSlot.container = wrap;
        startSlots([singleSlot]);
      } else {
        [heroVideo0, heroVideo1, heroVideo2].forEach(function(el, i) {
          var wrap = document.createElement('div');
          wrap.style.cssText = 'flex:1;min-width:0;position:relative;overflow:hidden';
          el.parentNode.replaceChild(wrap, el);
          var slot = createSlot(wrap, el, i * 5);
          slot.container = wrap;
          slots.push(slot);
        });
        startSlots(slots);
      }
    }

    var heroObserver = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting) {
        heroObserver.disconnect();
        initVideoMode();

        var resizeTimer;
        window.addEventListener('resize', function() {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(initVideoMode, 200);
        });

        document.addEventListener('click', function() {
          if (currentMode === 'single' && singleSlot && singleSlot.active.paused) {
            singleSlot.active.play().catch(function() {});
          } else {
            slots.forEach(function(slot) {
              if (slot.active.paused) slot.active.play().catch(function() {});
            });
          }
        });

        document.addEventListener('visibilitychange', function() {
          if (document.hidden) return;
          if (currentMode === 'single' && singleSlot && singleSlot.active.paused) {
            singleSlot.active.play().catch(function() {});
          } else {
            slots.forEach(function(slot) {
              if (slot.active.paused) slot.active.play().catch(function() {});
            });
          }
        });
      }
    }, { threshold: 0 });
    heroObserver.observe(heroVideoBg);

    setTimeout(function() {
      heroVideoBg.style.opacity = '1';
    }, 3000);
  }

  // Preloader — hide once page is interactive, not waiting for all images
  var preloaderEl = document.getElementById('preloader');

  function hidePreloader() {
    if (preloaderEl) preloaderEl.classList.add('hidden');
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // Give a brief moment for initial render
    setTimeout(hidePreloader, 100);
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(hidePreloader, 100);
    });
  }
  // Safety timeout — hide preloader after 5s no matter what
  setTimeout(hidePreloader, 5000);

  // Navbar scroll
  var navbar = document.getElementById('navbar');
  var backToTop = document.getElementById('backToTop');
  var scrollCue = document.querySelector('.scroll-cue');
  if (navbar && document.querySelector('.page-hero')) {
    navbar.classList.add('scrolled');
  }
  var lastScrollY = window.scrollY;
  var navStopTimer;
  var NAV_HIDE_THRESHOLD = 80; // keep the bar visible near the very top
  function onScroll() {
    var y = window.scrollY < 0 ? 0 : window.scrollY;
    if (navbar) {
      navbar.classList.toggle('scrolled', y > 60);
      var navLinksEl = document.getElementById('navLinks');
      var menuOpen = navLinksEl && navLinksEl.classList.contains('open');
      if (!menuOpen) {
        if (y > lastScrollY && y > NAV_HIDE_THRESHOLD) {
          navbar.classList.add('nav-hidden');      // scrolling down → hide
        } else if (y < lastScrollY - 4) {
          navbar.classList.remove('nav-hidden');   // scrolling up → show
        }
        // reveal again once scrolling stops
        clearTimeout(navStopTimer);
        navStopTimer = setTimeout(function() { navbar.classList.remove('nav-hidden'); }, 220);
      }
    }
    if (backToTop) backToTop.classList.toggle('show', y > 500);
    if (scrollCue) scrollCue.classList.toggle('cue-hidden', y > 40);
    lastScrollY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // Scroll cue → smooth-scroll to the form
  if (scrollCue) {
    scrollCue.addEventListener('click', function(e) {
      e.preventDefault();
      var target = document.querySelector('.contact-grid') || document.getElementById('contactForm');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Back to top
  if (backToTop) {
    backToTop.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Testimonials — карусель: колесо мыши → влево-вправо
  var testimonialSlider = document.querySelector('.testimonials-slider');
  if (testimonialSlider) {
    var testCards = Array.prototype.slice.call(testimonialSlider.querySelectorAll('.testimonial-card'));
    var testCardCount = testCards.length;
    var testTrack = document.createElement('div');
    testTrack.style.cssText = 'display:flex;gap:2rem;transition:transform .45s cubic-bezier(.25,.46,.45,.94);will-change:transform';
    for (var ti = 0; ti < testCardCount; ti++) {
      testTrack.appendChild(testCards[ti]);
    }
    testimonialSlider.innerHTML = '';
    testimonialSlider.appendChild(testTrack);
    var testCurrentIdx = 0;
    function updateTestTrack() {
      var card = testCards[0];
      if (!card) return;
      var step = card.offsetWidth + 32;
      testCurrentIdx = (testCurrentIdx + testCardCount) % testCardCount;
      testTrack.style.transform = 'translateX(' + (-testCurrentIdx * step) + 'px)';
    }
    function centerSliderPaddings() {
      var card = testCards[0];
      if (!card) return;
      var pad = Math.max(32, (testimonialSlider.clientWidth - card.offsetWidth) / 2);
      testimonialSlider.style.paddingLeft = pad + 'px';
      testimonialSlider.style.paddingRight = pad + 'px';
    }
    function scrollTestimonials(dir) {
      testCurrentIdx += dir;
      updateTestTrack();
    }
    testimonialSlider.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); scrollTestimonials(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); scrollTestimonials(1); }
    });
    centerSliderPaddings();
    updateTestTrack();
    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() { centerSliderPaddings(); updateTestTrack(); }, 150);
    });
    var testWheelTimer;
    testimonialSlider.addEventListener('wheel', function(e) {
      e.preventDefault();
      var dir = e.deltaY > 0 ? 1 : -1;
      clearTimeout(testWheelTimer);
      testWheelTimer = setTimeout(function() { scrollTestimonials(dir); }, 40);
    }, { passive: false });

    // Fetch approved reviews and append to slider
    var reviewXhr = new XMLHttpRequest();
    var backendBase = typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : 'http://localhost:5000';
    reviewXhr.open('GET', backendBase + '/api/reviews', true);
    reviewXhr.timeout = 8000;
    reviewXhr.onload = function() {
      if (reviewXhr.status < 200 || reviewXhr.status >= 300) return;
      var reviews;
      try { reviews = JSON.parse(reviewXhr.responseText); } catch(e) { return; }
      if (!reviews || !reviews.length) return;
      var replyLabels = { de: 'Antwort von Natalia', ru: 'Ответ Наталии', en: 'Reply from Natalia' };
      reviews.forEach(function(r) {
        var card = document.createElement('div');
        card.className = 'testimonial-card';
        var rName = (r.name || '').trim();
        var initial = rName ? rName.charAt(0).toUpperCase() : '★';
        var avatarGradients = [
          'linear-gradient(135deg,#E89BC8,#C05E9A)',
          'linear-gradient(135deg,#D478B0,#A23F7E)',
          'linear-gradient(135deg,#9C8FA8,#6E6370)'
        ];
        var grad = avatarGradients[initial.charCodeAt(0) % avatarGradients.length];

        // Reviews are stored as "Rating: N/5\n\n<text>" — pull the rating out
        // so we can render real stars and show a clean quote.
        var comment = (r.comment || '').trim();
        var rating = 5;
        var rm = comment.match(/^\s*Rating:\s*(\d)\s*\/\s*5\s*/i);
        if (rm) {
          rating = Math.max(1, Math.min(5, parseInt(rm[1], 10)));
          comment = comment.slice(rm[0].length).trim();
        }
        var starStr = '';
        for (var si = 0; si < 5; si++) starStr += (si < rating ? '★' : '☆');

        var lang = typeof currentLang !== 'undefined' ? currentLang : 'de';
        var replyHtml = '';
        var rReply = (r.reply || '').trim();
        if (rReply) {
          replyHtml =
            '<div class="testimonial-reply">' +
              '<span class="testimonial-reply-author">' +
                escapeHtml(replyLabels[lang] || replyLabels.en) +
              '</span>' +
              '<p>' + escapeHtml(rReply) + '</p>' +
            '</div>';
        }

        card.innerHTML =
          '<div class="testimonial-card-top">' +
            '<div class="testimonial-avatar" style="background:' + grad + '" aria-hidden="true">' + escapeHtml(initial) + '</div>' +
            '<div>' +
              '<cite>&mdash; ' + escapeHtml(rName) + '</cite>' +
              '<span class="testimonial-event">Review</span>' +
            '</div>' +
          '</div>' +
          '<div class="testimonial-stars" aria-label="' + rating + '/5">' + starStr + '</div>' +
          '<blockquote>&laquo;' + escapeHtml(comment) + '&raquo;</blockquote>' +
          replyHtml;
        testTrack.appendChild(card);
        testCards.push(card);
        testCardCount++;
      });
      centerSliderPaddings();
      updateTestTrack();
    };
    reviewXhr.onerror = function() { /* silently fail - not critical */ };
    reviewXhr.ontimeout = function() { /* silently fail */ };
    reviewXhr.send();
  }

  // Stats counter animation (once)
  var statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var numEl = entry.target.querySelector('.stat-number');
      if (!numEl || numEl.dataset.animated) return;
      numEl.dataset.animated = '1';
      var text = numEl.textContent;
      var match = text.match(/^([\d.]+)(.*)$/);
      if (!match) return;
      var target = parseFloat(match[1]);
      var suffix = match[2] || '';
      var duration = 1200;
      var start = performance.now();
      function tick(now) {
        var progress = Math.min((now - start) / duration, 1);
        var current = Math.round(target * progress);
        numEl.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      statsObserver.unobserve(entry.target);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-card').forEach(function(c) { statsObserver.observe(c); });

  // Mobile nav
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function() {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
      if (navbar) navbar.classList.remove('nav-hidden');
    });
    navLinks.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  // Scroll reveal — всегда при скролле в любую сторону
  if (typeof IntersectionObserver !== 'undefined') {
    revealObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else {
          entry.target.classList.remove('visible');
        }
      });
    }, { threshold: .15 });
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger').forEach(function(el) {
      revealObserver.observe(el);
    });
  } else {
    // No IntersectionObserver support — show everything immediately.
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger').forEach(function(el) {
      el.classList.add('visible');
    });
  }

  // Toast helper
  var toast = document.getElementById('toast');
  function showToast(msg, isError) {
    if (!toast) return;
    var textEl = toast.querySelector('.toast-text');
    // Строки переводов содержат HTML-сущности (&auml; и т.п.) — раскрываем
    // их через textarea, не подставляя msg в innerHTML напрямую
    if (textEl) {
      var decoder = document.createElement('textarea');
      decoder.innerHTML = msg.replace(/</g, '&lt;');
      textEl.textContent = decoder.value;
    }
    toast.classList.remove('toast-error');
    if (isError) toast.classList.add('toast-error');
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 4000);
  }

  // Contact form
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    var nameInput = document.getElementById('formName');
    var phoneInput = document.getElementById('formPhone');
    var countrySelect = document.getElementById('formCountry');
    var typeSelect = document.getElementById('formType');
    (function() {
      var m = window.location.search.match(/[?&]type=([^&]+)/);
      if (m && typeSelect) {
        var val = decodeURIComponent(m[1]);
        for (var i = 0; i < typeSelect.options.length; i++) {
          if (typeSelect.options[i].value === val) {
            typeSelect.selectedIndex = i;
            break;
          }
        }
      }
    })();
    var commentInput = document.getElementById('formComment');
    var dateInput = document.getElementById('formDate');
    var nameError = document.getElementById('nameError');
    var phoneError = document.getElementById('phoneError');
    var dateError = document.getElementById('dateError');
    var consentInput = document.getElementById('formConsent');
    var consentError = document.getElementById('consentError');
    // ── Поле даты: маска ДД.ММ.ГГГГ + собственный календарь ──
    // Нативный input[type=date] заменён: его посегментная маска с системным
    // выделением неудобна и выглядит по-разному в браузерах и локалях
    var dateToggle = document.getElementById('dateToggle');
    var datePicker = document.getElementById('datePicker');
    var pickerOpen = false;
    var pickerMonth = null;

    // Заказы не бывают в прошлом, а верхняя граница в два года
    // отсекает опечатки в годе; всё в местном времени, не UTC
    var dateNow = new Date();
    var dateMin = new Date(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate());
    var dateMax = new Date(dateMin.getFullYear() + 2, dateMin.getMonth(), dateMin.getDate());

    function parseDMY(str) {
      var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(str);
      if (!m) return null;
      var d = new Date(+m[3], +m[2] - 1, +m[1]);
      var real = d.getDate() === +m[1] && d.getMonth() === +m[2] - 1 && d.getFullYear() === +m[3];
      return real ? d : null;
    }
    function formatDMY(d) {
      var dd = d.getDate(), mm = d.getMonth() + 1;
      return (dd < 10 ? '0' : '') + dd + '.' + (mm < 10 ? '0' : '') + mm + '.' + d.getFullYear();
    }
    function dateToISO(d) {
      var dd = d.getDate(), mm = d.getMonth() + 1;
      return d.getFullYear() + '-' + (mm < 10 ? '0' : '') + mm + '-' + (dd < 10 ? '0' : '') + dd;
    }
    function pickerLocale() {
      var langMap = { de: 'de-CH', ru: 'ru-RU', en: 'en-GB' };
      return langMap[typeof currentLang !== 'undefined' ? currentLang : 'de'] || 'de-CH';
    }

    function buildPicker() {
      if (!datePicker || !pickerMonth) return;
      var sel = parseDMY(dateInput.value);
      var y = pickerMonth.getFullYear(), mo = pickerMonth.getMonth();
      var title;
      try {
        title = pickerMonth.toLocaleDateString(pickerLocale(), { month: 'long', year: 'numeric' });
      } catch (e) {
        title = (mo + 1) + '.' + y;
      }
      var monthIdx = y * 12 + mo;
      var prevOff = monthIdx <= dateMin.getFullYear() * 12 + dateMin.getMonth();
      var nextOff = monthIdx >= dateMax.getFullYear() * 12 + dateMax.getMonth();
      var arrow = function(dir) {
        var points = dir < 0 ? '14 6 8 12 14 18' : '10 6 16 12 10 18';
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="' + points + '"/></svg>';
      };
      var html = '<div class="date-picker-head">' +
        '<button type="button" class="date-picker-nav" data-dir="-1"' + (prevOff ? ' disabled' : '') + '>' + arrow(-1) + '</button>' +
        '<span class="date-picker-title">' + title + '</span>' +
        '<button type="button" class="date-picker-nav" data-dir="1"' + (nextOff ? ' disabled' : '') + '>' + arrow(1) + '</button>' +
        '</div><div class="date-picker-grid">';
      // Шапка дней недели, неделя начинается с понедельника
      for (var w = 0; w < 7; w++) {
        var wd;
        try {
          // 1 января 2024 — понедельник
          wd = new Date(2024, 0, 1 + w).toLocaleDateString(pickerLocale(), { weekday: 'short' }).replace('.', '').slice(0, 2);
        } catch (e) { wd = ''; }
        html += '<span class="dp-wd">' + wd + '</span>';
      }
      var lead = (new Date(y, mo, 1).getDay() + 6) % 7;
      for (var b = 0; b < lead; b++) html += '<span></span>';
      var daysInMonth = new Date(y, mo + 1, 0).getDate();
      for (var dayN = 1; dayN <= daysInMonth; dayN++) {
        var d = new Date(y, mo, dayN);
        var cls = 'dp-day';
        if (d.getTime() === dateMin.getTime()) cls += ' is-today';
        if (sel && d.getTime() === sel.getTime()) cls += ' is-selected';
        var off = d < dateMin || d > dateMax;
        html += '<button type="button" class="' + cls + '" data-date="' + formatDMY(d) + '"' + (off ? ' disabled' : '') + '>' + dayN + '</button>';
      }
      html += '</div>';
      datePicker.innerHTML = html;
    }

    // На мобильных поле часто у нижнего края (над клавиатурой) — если
    // календарю не хватает места снизу, показываем его над полем
    function positionPicker() {
      if (!pickerOpen) return;
      datePicker.classList.remove('is-above');
      var vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      var r = datePicker.getBoundingClientRect();
      if (r.bottom > vh && dateInput.getBoundingClientRect().top > r.height) {
        datePicker.classList.add('is-above');
      }
    }
    if (window.visualViewport && datePicker) {
      // Появление экранной клавиатуры меняет высоту вьюпорта уже после
      // открытия — переоцениваем положение
      window.visualViewport.addEventListener('resize', positionPicker);
    }

    function openPicker() {
      if (pickerOpen || !datePicker) return;
      var base = parseDMY(dateInput.value) || dateMin;
      if (base < dateMin) base = dateMin;
      if (base > dateMax) base = dateMax;
      pickerMonth = new Date(base.getFullYear(), base.getMonth(), 1);
      buildPicker();
      datePicker.hidden = false;
      pickerOpen = true;
      positionPicker();
      if (dateToggle) dateToggle.setAttribute('aria-expanded', 'true');
    }
    function closePicker() {
      if (!pickerOpen) return;
      pickerOpen = false;
      datePicker.hidden = true;
      if (dateToggle) dateToggle.setAttribute('aria-expanded', 'false');
    }

    if (dateInput) {
      // Маска: пользователь набирает только цифры, точки ставятся сами
      dateInput.addEventListener('input', function() {
        var digits = dateInput.value.replace(/\D/g, '').slice(0, 8);
        var out = digits.slice(0, 2);
        if (digits.length > 2) out += '.' + digits.slice(2, 4);
        if (digits.length > 4) out += '.' + digits.slice(4);
        if (out !== dateInput.value) dateInput.value = out;
        dateInput.classList.remove('error');
        if (dateError) dateError.classList.remove('show');
        if (pickerOpen) {
          // Набранная дата сразу подсвечивается в открытом календаре
          var typed = parseDMY(dateInput.value);
          if (typed && typed >= dateMin && typed <= dateMax) {
            pickerMonth = new Date(typed.getFullYear(), typed.getMonth(), 1);
          }
          buildPicker();
        }
      });
      dateInput.addEventListener('focus', openPicker);
      dateInput.addEventListener('click', openPicker);
      dateInput.addEventListener('blur', function() {
        closePicker();
        validateDate();
      });
      dateInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.key === 'Esc') closePicker();
      });
    }
    if (dateToggle && dateInput) {
      // preventDefault на mousedown: фокус не уходит из поля, blur не мигает
      dateToggle.addEventListener('mousedown', function(e) { e.preventDefault(); });
      dateToggle.addEventListener('click', function() {
        if (pickerOpen) {
          closePicker();
        } else {
          dateInput.focus();
          openPicker();
        }
      });
    }
    if (datePicker && dateInput) {
      datePicker.addEventListener('mousedown', function(e) { e.preventDefault(); });
      datePicker.addEventListener('click', function(e) {
        var dayBtn = e.target.closest('.dp-day');
        if (dayBtn && !dayBtn.disabled) {
          dateInput.value = dayBtn.getAttribute('data-date');
          validateDate();
          closePicker();
          return;
        }
        var nav = e.target.closest('.date-picker-nav');
        if (nav && !nav.disabled && pickerMonth) {
          pickerMonth = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + Number(nav.getAttribute('data-dir')), 1);
          buildPicker();
        }
      });
    }
    var backendUrl = (typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : 'http://localhost:5000') + '/api/lead';

    var countries = {
      ch:  { code: '+41', digits: 9, min: 7, pattern: 'XX XXX XX XX' },
      de:  { code: '+49', digits: 11, min: 10, pattern: 'XXXX XXXXXXX' },
      at:  { code: '+43', digits: 10, min: 9, pattern: 'XXXX XXXXXX' },
      fr:  { code: '+33', digits: 9, min: 9, pattern: 'XX XX XX XX X' },
      it:  { code: '+39', digits: 10, min: 9, pattern: 'XXX XXXXXXX' },
      gb:  { code: '+44', digits: 10, min: 10, pattern: 'XXXXX XXXXX' },
      es:  { code: '+34', digits: 9, min: 9, pattern: 'XXX XXX XXX' },
      ru:  { code: '+7', digits: 10, min: 10, pattern: '(XXX) XXX-XX-XX' },
      pl:  { code: '+48', digits: 9, min: 9, pattern: 'XXX XXX XXX' },
      nl:  { code: '+31', digits: 9, min: 9, pattern: 'XX XXXXXXX' },
      be:  { code: '+32', digits: 9, min: 8, pattern: 'XXX XX XX XX' },
      pt:  { code: '+351', digits: 9, min: 9, pattern: 'XXX XXX XXX' },
      se:  { code: '+46', digits: 10, min: 9, pattern: 'XX XXX XX XX' },
      no:  { code: '+47', digits: 8, min: 8, pattern: 'XXX XX XXX' },
      dk:  { code: '+45', digits: 8, min: 8, pattern: 'XX XX XX XX' },
      fi:  { code: '+358', digits: 10, min: 9, pattern: 'XX XXX XXXX' },
      us:  { code: '+1', digits: 10, min: 10, pattern: '(XXX) XXX-XXXX' },
      other: { code: '+', digits: 15, min: 7, pattern: '' },
    };

    function getCountry() {
      return countries[countrySelect.value] || countries.other;
    }

    function formatPhone() {
      var raw = phoneInput.value.replace(/\D/g, '');
      if (!raw) { phoneInput.value = ''; return; }
      var cfg = getCountry();
      var digits = raw.slice(0, cfg.digits);
      var formatted = '';
      var di = 0;
      for (var pi = 0; pi < cfg.pattern.length && di < digits.length; pi++) {
        if (cfg.pattern[pi] === 'X') {
          formatted += digits[di];
          di++;
        } else {
          formatted += cfg.pattern[pi];
        }
      }
      if (formatted !== phoneInput.value) {
        phoneInput.value = formatted;
      }
    }

    function validateDate() {
      // Поле необязательное — ошибка только для мусора и дат вне диапазона
      if (!dateInput || !dateInput.value) {
        if (dateInput) dateInput.classList.remove('error');
        if (dateError) dateError.classList.remove('show');
        return true;
      }
      var d = parseDMY(dateInput.value);
      var valid = !!d && d >= dateMin && d <= dateMax;
      dateInput.classList.toggle('error', !valid);
      if (dateError) dateError.classList.toggle('show', !valid);
      return valid;
    }

    function validateName() {
      var val = nameInput.value.trim();
      if (val.length < 2) {
        nameInput.classList.add('error');
        nameError.classList.add('show');
        return false;
      }
      nameInput.classList.remove('error');
      nameError.classList.remove('show');
      return true;
    }

    function validatePhone() {
      var digits = phoneInput.value.replace(/\D/g, '');
      var cfg = getCountry();
      var valid = digits.length >= cfg.min && digits.length <= cfg.digits;

      if (valid) {
        phoneInput.classList.remove('error');
        countrySelect.classList.remove('error');
        phoneError.classList.remove('show');
        return true;
      }
      phoneInput.classList.add('error');
      countrySelect.classList.add('error');
      phoneError.classList.add('show');
      return false;
    }

    // Согласие на обработку персональных данных — обязательно
    function validateConsent() {
      if (!consentInput) return true;
      var ok = consentInput.checked;
      consentInput.classList.toggle('error', !ok);
      if (consentError) consentError.classList.toggle('show', !ok);
      return ok;
    }
    if (consentInput) {
      consentInput.addEventListener('change', function() {
        if (consentInput.checked) validateConsent();
      });
    }

    nameInput.addEventListener('input', function() {
      nameInput.classList.remove('error');
      nameError.classList.remove('show');
    });

    phoneInput.addEventListener('input', function() {
      phoneInput.classList.remove('error');
      countrySelect.classList.remove('error');
      phoneError.classList.remove('show');
      formatPhone();
    });

    countrySelect.addEventListener('change', function() {
      phoneInput.value = '';
      phoneInput.placeholder = getCountry().pattern || '';
      phoneInput.focus();
    });

    var submitBtn = contactForm.querySelector('.btn[type="submit"]');
    var btnOriginalText = submitBtn ? submitBtn.textContent : '';
    var btnInner = null;
    if (submitBtn && !submitBtn.querySelector('.btn-text')) {
      btnInner = document.createElement('span');
      btnInner.className = 'btn-text';
      btnInner.textContent = btnOriginalText;
      submitBtn.textContent = '';
      submitBtn.appendChild(btnInner);
      var spinner = document.createElement('span');
      spinner.className = 'btn-spinner';
      spinner.setAttribute('aria-hidden', 'true');
      submitBtn.appendChild(spinner);
    } else if (submitBtn) {
      btnInner = submitBtn.querySelector('.btn-text');
    }

    function setButtonLoading(loading) {
      if (!submitBtn || !btnInner) return;
      submitBtn.disabled = loading;
      submitBtn.classList.toggle('is-loading', loading);
      submitBtn.setAttribute('aria-busy', loading ? 'true' : 'false');
      if (!loading) btnInner.textContent = btnOriginalText;
    }

    function setButtonSuccess() {
      if (!submitBtn || !btnInner) return;
      submitBtn.classList.remove('is-loading');
      submitBtn.removeAttribute('aria-busy');
      submitBtn.disabled = true;
      btnInner.textContent = '✓ ' + btnOriginalText;
      setTimeout(function() {
        submitBtn.disabled = false;
        btnInner.textContent = btnOriginalText;
      }, 3000);
    }

    function postLead(data, onSuccess, onError) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', backendUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          onSuccess();
        } else {
          onError();
        }
      };
      xhr.onerror = function() {
        onError();
      };
      xhr.send(JSON.stringify(data));
    }

    function focusFirstError() {
      var fields = [
        { el: nameInput, valid: validateName },
        { el: phoneInput, valid: validatePhone },
        { el: dateInput, valid: validateDate },
        { el: consentInput, valid: validateConsent }
      ];
      for (var i = 0; i < fields.length; i++) {
        var f = fields[i];
        if (f.el && !f.valid()) {
          f.el.focus();
          f.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
    }

    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var isNameValid = validateName();
      var isPhoneValid = validatePhone();
      var isDateValid = validateDate();
      var isConsentValid = validateConsent();
      if (!isNameValid || !isPhoneValid || !isDateValid || !isConsentValid) {
        focusFirstError();
        return;
      }

      var cfg = getCountry();
      var fullPhone = cfg.code + ' ' + phoneInput.value.trim();
      var data = {
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        country: cfg.code,
        event_type: typeSelect.value || typeSelect.options[typeSelect.selectedIndex].text,
        // Backend и Telegram ждут ISO (YYYY-MM-DD)
        event_date: (function() {
          var d = dateInput ? parseDMY(dateInput.value) : null;
          return d ? dateToISO(d) : '';
        })(),
        comment: commentInput.value.trim(),
        consent: !!(consentInput && consentInput.checked),
        page_url: window.location.href,
        language: typeof currentLang !== 'undefined' ? currentLang : 'de'
      };

      setButtonLoading(true);

      postLead(data, function() {
        contactForm.reset();
        if (typeSelect) typeSelect.selectedIndex = 0;
        var t = translations[currentLang];
        var msg = (t && t['toast.thanks']) || 'Спасибо! Мы свяжемся с вами по номеру {phone}';
        showToast(msg.replace('{phone}', fullPhone), false);
        setButtonSuccess();
      }, function() {
        var t = translations[currentLang];
        var msg = (t && t['toast.error']) || 'Ошибка. Попробуйте позже.';
        showToast(msg, true);
        setButtonLoading(false);
      });
    });

  }



  // ── Magnetic buttons (subtle, no layout shift) ──
  document.querySelectorAll('.btn, .filter-btn').forEach(function(btn) {
    btn.addEventListener('mousemove', function(e) {
      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left - rect.width / 2;
      var y = e.clientY - rect.top - rect.height / 2;
      var shadowX = (x * 0.2).toFixed(1);
      var shadowY = (y * 0.2).toFixed(1);
      btn.style.setProperty('--mx', shadowX + 'px');
      btn.style.setProperty('--my', shadowY + 'px');
      btn.style.boxShadow = shadowX + ' ' + shadowY + ' 20px rgba(212,120,176,0.1)';
    });
    btn.addEventListener('mouseleave', function() {
      btn.style.boxShadow = '';
      btn.style.setProperty('--mx', '0px');
      btn.style.setProperty('--my', '0px');
    });
  });

  // ── Review Modal ──
  var reviewBtn = document.getElementById('reviewBtn');
  var reviewModal = document.getElementById('reviewModal');
  var reviewModalClose = document.getElementById('reviewModalClose');
  var reviewForm = document.getElementById('reviewForm');
  var reviewRating = document.getElementById('reviewRating');

  if (reviewBtn && reviewModal) {
    var reviewPlaceholders = {
      de: [
        'Die Dekoration war absolut traumhaft...',
        'Wir haben unseren perfekten Tag gefunden...',
        'Die Ballons haben den ganzen Raum verwandelt...',
        'Jeder Gast war begeistert...'
      ],
      ru: [
        'Оформление было просто сказочным...',
        'Мы нашли идеальное оформление для нашего праздника...',
        'Шары преобразили всё пространство...',
        'Гости были в полном восторге...'
      ],
      en: [
        'The decoration was absolutely stunning...',
        'We found the perfect setup for our celebration...',
        'The balloons transformed the whole room...',
        'Every guest was amazed...'
      ]
    };
    var reviewLastFocus = null;
    function openReviewModal() {
      var lang = typeof currentLang !== 'undefined' ? currentLang : 'de';
      var pool = reviewPlaceholders[lang] || reviewPlaceholders.en;
      reviewModal.querySelector('#reviewText').placeholder = pool[Math.floor(Math.random() * pool.length)];
      reviewRating.value = '5';
      setStars(5);
      reviewLastFocus = document.activeElement;
      reviewModal.classList.add('open');
      document.body.style.overflow = 'hidden';
      var firstField = document.getElementById('reviewName');
      if (firstField) firstField.focus();
    }
    function closeReviewModal() {
      reviewModal.classList.remove('open');
      document.body.style.overflow = '';
      if (reviewLastFocus && typeof reviewLastFocus.focus === 'function') {
        reviewLastFocus.focus();
        reviewLastFocus = null;
      }
    }
    reviewBtn.addEventListener('click', openReviewModal);
    reviewModalClose.addEventListener('click', closeReviewModal);
    reviewModal.addEventListener('click', function(e) {
      if (e.target === reviewModal) closeReviewModal();
    });
    reviewModal.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeReviewModal();
      else if (e.key === 'Tab') trapFocus(reviewModal, e);
    });

    var stars = reviewModal.querySelectorAll('.star');
    function setStars(val) {
      stars.forEach(function(st) {
        st.classList.toggle('is-active', parseInt(st.getAttribute('data-value'), 10) <= val);
      });
    }
    stars.forEach(function(s) {
      s.addEventListener('click', function() {
        var val = parseInt(this.getAttribute('data-value'), 10);
        reviewRating.value = val;
        setStars(val);
        stars.forEach(function(st) { st.classList.remove('is-hover'); });
      });
      s.addEventListener('mouseenter', function() {
        var val = parseInt(this.getAttribute('data-value'), 10);
        stars.forEach(function(st) {
          st.classList.toggle('is-hover', parseInt(st.getAttribute('data-value'), 10) <= val);
        });
      });
      s.addEventListener('mouseleave', function() {
        stars.forEach(function(st) { st.classList.remove('is-hover'); });
      });
    });
    setStars(5);

    document.getElementById('reviewName').addEventListener('input', function() {
      this.classList.remove('error');
    });
    document.getElementById('reviewText').addEventListener('input', function() {
      this.classList.remove('error');
    });
    var reviewConsentEl = document.getElementById('reviewConsent');
    if (reviewConsentEl) reviewConsentEl.addEventListener('change', function() {
      if (!this.checked) return;
      this.classList.remove('error');
      var er = document.getElementById('reviewConsentError');
      if (er) er.classList.remove('show');
    });

    reviewForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var nameInput = document.getElementById('reviewName');
      var textInput = document.getElementById('reviewText');
      var name = nameInput.value.trim();
      var text = textInput.value.trim();
      var rating = reviewRating.value;
      var consentInput = document.getElementById('reviewConsent');
      var consentErr = document.getElementById('reviewConsentError');
      var consentOk = !consentInput || consentInput.checked;
      nameInput.classList.toggle('error', !name);
      textInput.classList.toggle('error', !text);
      if (consentInput) consentInput.classList.toggle('error', !consentOk);
      if (consentErr) consentErr.classList.toggle('show', !consentOk);
      if (!name || !text || !consentOk) return;
      nameInput.classList.remove('error');
      textInput.classList.remove('error');
      var backendUrl = (typeof BACKEND_URL !== 'undefined' ? BACKEND_URL : 'http://localhost:5000') + '/api/lead';
      var xhr = new XMLHttpRequest();
      xhr.open('POST', backendUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      function done(err) {
        reviewForm.reset();
        reviewRating.value = '5';
        setStars(5);
        closeReviewModal();
        var lang = typeof currentLang !== 'undefined' ? currentLang : 'de';
        var t = typeof translations !== 'undefined' ? translations[lang] : null;
        showToast(
          err
            ? ((t && t['toast.error']) || 'Ошибка. Попробуйте позже.')
            : ((t && t['toast.review']) || 'Спасибо! Отзыв отправлен на модерацию.'),
          err
        );
      }
      xhr.onload = function() {
        done(xhr.status < 200 || xhr.status >= 300);
      };
      xhr.onerror = function() { done(true); };
      xhr.send(JSON.stringify({
        name: name,
        phone: '',
        country: '',
        event_type: 'Review',
        comment: 'Rating: ' + rating + '/5\n\n' + text,
        consent: true,
        page_url: window.location.href,
        language: typeof currentLang !== 'undefined' ? currentLang : 'de'
      }));
    });
  }
});