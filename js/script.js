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

  function openLightbox(index) {
    var items = document.querySelectorAll('.gallery-item img');
    if (!items[index]) return;
    lightboxImg.src = items[index].src;
    lightboxImg.alt = items[index].alt || 'Фото';
    lightboxCaption.textContent = items[index].alt || 'Фото';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function changeImage(dir) {
    var items = document.querySelectorAll('.gallery-item img');
    if (!items.length) return;
    currentIndex = (currentIndex + dir + items.length) % items.length;
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
      if (e.key === 'ArrowLeft') changeImage(-1);
      if (e.key === 'ArrowRight') changeImage(1);
    });
  }

  // Loaded class for hardcoded gallery images (homepage)
  document.querySelectorAll('.gallery-item > img').forEach(function(img) {
    if (img.complete) { img.classList.add('loaded'); }
    else { img.addEventListener('load', function() { this.classList.add('loaded'); }); }
  });

  // Gallery — load photos
  var galleryGrid = document.getElementById('galleryGrid');
  var galleryFilters = document.getElementById('galleryFilters');
  var galleryCat = {
  '1E2BE317-DA39-4AF2-9A53-1F473331049B.JPG': 'birthday',
  'C371B279-0A54-408A-887C-77001683EFEF.JPG': 'wedding',
  'CD11B737-A774-4BF8-B0BD-EB017CB846B6.JPG': 'corporate',
  'CCB0EAAB-ED03-4DB0-8F00-5DF015C4227A.JPG': 'babyshower',
  '8DC9E238-B8C1-45CC-A7E3-7BBB0B9B421E.JPG': 'birthday',
  '2B52658A-34D4-4417-A05D-F83E408AB928.JPG': 'wedding',
  '7D6B9EF6-0430-4858-AD99-F813E4EFAFEB.JPG': 'corporate',
  '6FEB105B-AE50-4157-806E-B960E9027B4B.JPG': 'babyshower',
  'D636A909-CC68-47D1-8738-F9C546E9331A.JPG': 'birthday',
  'A48F492F-05CF-41C9-857F-A4F6E4CF2900.JPG': 'wedding',
  '87ABDD10-B02F-4A47-8A7D-143C88016055.JPG': 'corporate',
  '34CBEE1B-8ED4-42F2-A0E9-E3FFAF9B80DA.JPG': 'babyshower',
  '40AC94F3-CAD7-426E-BA70-4D1D0B722816.JPG': 'birthday',
  'AFF24DCE-0F03-4787-A994-8B2909493E46.JPG': 'wedding',
  '432B792D-F136-40C8-8BEB-1EBD7789CD54.JPG': 'corporate',
  '816E6CD6-116E-45EF-ACBC-549943122F11.JPG': 'babyshower',
  '943A21B1-75DF-43C1-88F2-DDC317DD98A4.JPG': 'birthday',
  'IMG_1255.jpg': 'wedding',
  'BAE95F70-8C93-4258-878B-C8F1072EE61A.JPG': 'corporate',
  '7FA6641E-D8BC-4EED-A4DB-5ED5B55386EE.JPG': 'babyshower',
  '7A45C820-B917-499E-B508-0C30F75B5BDA.JPG': 'birthday',
  '0E76160B-8854-42E9-8C8C-C932ED7D3C13.JPG': 'wedding',
  '870D9268-FDAD-4A6A-81DB-657438266334.JPG': 'corporate',
  '9C72CDCE-7539-4146-8CF4-78E1D57C8BB7.JPG': 'babyshower',
  '4ABFCC78-00B7-41CB-9252-FF730B000661.JPG': 'birthday',
  'C6C0A571-CFCB-4AAF-9BC7-7CD64BE93D85.JPG': 'wedding',
  '1D000A45-A36B-4782-B98B-05DE6AFB8DE3.JPG': 'corporate',
  '0744315C-D24A-4CD5-A0E8-C6AB50BDE2DF.JPG': 'babyshower',
  'B3C6BD75-EE64-43B5-B47B-573CA52F2DC5.JPG': 'birthday',
  '73758C5E-6743-4ADB-ABC0-314E4A79272B.JPG': 'wedding',
  '39C517C5-6E19-43AA-8E4D-E81EDE40F6C8.JPG': 'corporate',
  'B653CCC5-03EB-4C3A-87F9-A67C078B5305.JPG': 'babyshower',
  '9583779D-08C4-439A-9895-2E4E7C3F4118.JPG': 'birthday',
  'D7995E94-06DA-45F9-A185-7EAD31B79211.JPG': 'wedding',
  'BAB84F60-816B-46D0-A686-C20F111D2EAD.JPG': 'corporate',
  'F3895621-0E25-4DA6-971E-6A272D76543B.JPG': 'babyshower',
  '5371F14B-4BDA-4B35-9D2C-F982F2BAEAD8.JPG': 'birthday',
  'CD81C696-3876-433E-8079-5D06ED8D79B2.JPG': 'wedding',
  '470600E3-4507-4559-95A7-33D06D4F678B.JPG': 'corporate',
  '72C46CE7-649C-4CEB-8B3D-CEFA354FEF2F.JPG': 'babyshower',
  '5128310E-B59A-4B19-BEB9-3244302D5484.JPG': 'birthday',
  'E2C2E93C-4D46-47DA-98C9-DFA993BF509A.JPG': 'wedding',
  '62BF8D5F-8ED9-43F7-8129-024B8521CE21.JPG': 'corporate',
  'A9F4A531-555F-4F3C-B7FD-A138D7A3E68A.JPG': 'babyshower',
  '9AC9DEEB-DEB5-4657-8600-870814BD5532.JPG': 'birthday',
  '7AFD9CF5-A4EA-4AC4-A217-1AC33D5DC177.JPG': 'wedding',
  '6585A8CF-33E7-4921-BE9D-0DFBF36226AB.JPG': 'corporate',
  'IMG_R_0034.JPG': 'babyshower',
  '3797D487-9F8A-4AFD-BD6B-C7B4CC7489B9.JPG': 'birthday',
  '731DF57B-C138-49B3-8BAD-0132EEA9AB9B.JPG': 'wedding',
  'C0B278E7-363B-44C8-956B-7AFA8D83C92E.JPG': 'corporate',
  '37E8A320-6067-4E0C-AFF3-595C9450B5E0.JPG': 'babyshower',
  '57B7DF0F-2E0E-4CCE-B98B-23BA73EDBCBA.JPG': 'birthday',
  '8424640A-0452-49B0-8FDF-0C0DF825D766.JPG': 'wedding',
  'image.JPG': 'corporate',
  '87111272-3F8D-4E5C-B2C3-66C3C9529206.JPG': 'babyshower',
  '16BAD5C4-CE91-4D71-A394-E6C71FB17CD6.JPG': 'birthday',
  '78FEB6E2-9B9E-492D-9AEF-184E808A633D.JPG': 'wedding',
  'IMG_7225.jpg': 'corporate',
  'B4A38432-2F7E-4DF6-AC0F-5E7D8EE4E209.JPG': 'babyshower',
  'D7B796D5-00BA-42FF-B7A5-FD1C754F8E2B.JPG': 'birthday',
  '2FFB3D60-CBD3-4BD8-A61B-E8768BE4FED2.JPG': 'wedding',
  '70B3D870-844F-41C9-A46D-CF9E30828E13.JPG': 'corporate',
  'D93468E2-1A8E-4907-B931-0C3B923B2F4C.JPG': 'babyshower',
  '95C17BB3-C25A-48C9-8308-520407A81C8E.JPG': 'birthday',
  '1E27F947-3ACE-4AED-95F1-0F79F644C986.JPG': 'wedding',
  '3821E836-1B0D-4E1F-9D6D-063025C4A66A.JPG': 'corporate',
  '68C9400B-36B8-43DF-91A3-E641E7B0F204.JPG': 'babyshower',
  '4DFA88B4-C603-4602-AD60-60E44F8973F1.JPG': 'birthday',
  '1E3726E7-10B3-4F9C-9257-937441014F1A.JPG': 'wedding',
  'A1E09A60-71C6-41E3-A140-185DB389ECAB.JPG': 'corporate',
  '29FA9E86-1BCF-4735-BF99-2AA5FFF63101.JPG': 'babyshower',
  '89FCB87D-D0E9-4531-A725-0AE88F4D2B57.JPG': 'birthday',
  '7AF28D08-2EA4-4C12-9197-EC1882526869.JPG': 'wedding',
  '10683988-A7C2-4015-8159-FF938A2B340D.JPG': 'corporate',
  '44E7BF22-6F3B-4A30-BA4B-FD6E3C157391.JPG': 'babyshower',
  '66E98D96-3E08-4E61-8BA2-1D0DA3902FA2.JPG': 'birthday',
  '6789E071-B745-451E-A49F-99DDE287E6AB.JPG': 'wedding',
  '21465F3E-B8DF-4ACA-A46F-EF060191EE85.JPG': 'corporate',
  '705A64C3-5D03-47EE-A85D-0C0FFEB8A57B.JPG': 'babyshower',
  'DBD3F050-36EE-4238-953F-3D503D05ABB0.JPG': 'birthday',
  'F909B614-1094-45E2-BD5E-5B2205C28EBC.JPG': 'wedding',
  'F8E883ED-8304-4847-9F56-2C8AA7F38F78.jpg': 'corporate',
  'D9EEE7A0-3F9D-41A5-AB81-672435C00B2D.JPG': 'babyshower',
  '30A56E4A-C85C-45FA-87DD-B559A675CD9E.JPG': 'birthday',
  'BA38C595-CE4F-413D-8932-31DA5374A8DD.JPG': 'wedding',
  '66152DB4-1C74-44A0-87D7-0CC4A5BC44F8.JPG': 'corporate',
  'EA2EC6C3-7460-43E4-AB12-F09A7A6A4387.JPG': 'babyshower',
  '33C3260E-B226-4CBF-9FB0-89D8FF178DD2.JPG': 'birthday',
  '0523BDD4-D1CF-4375-8A27-1834ED5CAF10.JPG': 'wedding',
  'IMG_4208.jpg': 'corporate',
  'EFA518AA-681F-483B-A183-DE89DAF6C0F6.JPG': 'babyshower',
  '7A592DEC-ADCB-4D9E-92CF-418A17C63396.JPG': 'birthday',
  'IMG_0312.jpg': 'wedding',
  '747EFCA5-6C42-48E5-9FBE-13A7CEA9B9F6.JPG': 'corporate',
  'F30CD089-7B50-4246-9365-C4E786A420DE.JPG': 'babyshower',
  'B68A2450-01A9-4BE2-84A4-94FAB323571F.JPG': 'birthday',
  'ADB9946F-4C64-4E07-9412-BB7D6F5DF771.JPG': 'wedding',
  'BA7016B8-221D-4EE4-A591-D195F5D27371.JPG': 'corporate',
  '399CCB98-0581-49EB-A7DD-A7FE165723B1.JPG': 'babyshower',
  '9080B576-6EDF-45E9-833B-AE65672CE867.JPG': 'birthday',
  'DC905D7D-0149-401D-88DA-99CC86DF9C02.JPG': 'wedding',
  '9AEC9186-6A3D-42C7-B9E9-BD9A4FC474A2.JPG': 'corporate',
  '8502B469-B1E0-4812-8EA2-1048C6B90876.JPG': 'babyshower',
  '3DDE2D6F-5FA3-43C8-91D0-27C34C5CDA67.JPG': 'birthday',
  '3A39B971-451C-4384-9353-C0F2F0AC7C7B.JPG': 'wedding',
  'F22A27C0-1D33-457A-8E37-F50C8212BA99.JPG': 'corporate',
  'IMG_7215.jpg': 'babyshower',
  '0EEFBED7-9C4C-42AD-9929-FBDDA1B4E922.JPG': 'birthday',
  '777D44CF-EA4C-4150-85C1-71B348DB9047.JPG': 'wedding',
  '96DC5D75-13BE-41C2-AFE0-7154F55A189D.JPG': 'corporate',
  '208F1AD7-58E0-49C3-B35F-AF49FC3F0CDE.JPG': 'babyshower',
  '8AD140B4-3256-4A54-BA15-81B4DC048BAF.JPG': 'birthday',
  'FBB21DED-0E2C-4C5A-8558-4FFD599010D2.JPG': 'wedding',
  'B4050052-25B0-4C39-9F7A-0363BE33FF80.JPG': 'corporate',
  '24863E95-84B8-40DA-A0A6-3CB066178DD8.JPG': 'babyshower',
  'IMG_7201.jpg': 'birthday',
  '2B6D9516-8D01-4752-9111-9462F5E79D5D.JPG': 'wedding',
  '3D4F81B9-B847-4A72-BE04-AD67736F24F6.JPG': 'corporate',
  '415713E8-4066-408C-8EC5-8E84C971979F.JPG': 'babyshower',
  '49078041-1180-4016-A797-9E0214568883.JPG': 'birthday',
  'BED69D2C-0886-40BA-9922-6C0B8BB0BB2A.JPG': 'wedding',
  '0EBCCFE4-A374-4A86-A12B-D27AB0D7AB25.JPG': 'corporate',
  '282E51EC-F8E9-4A37-BCF6-3132C52C6751.JPG': 'babyshower',
  'A615A628-87E2-4DB3-8695-D671143AAB5B.JPG': 'birthday'
  };
  var galleryFiles = [
  '0523BDD4-D1CF-4375-8A27-1834ED5CAF10.JPG', 
  '0744315C-D24A-4CD5-A0E8-C6AB50BDE2DF.JPG', 
  '0E76160B-8854-42E9-8C8C-C932ED7D3C13.JPG', 
  '0EBCCFE4-A374-4A86-A12B-D27AB0D7AB25.JPG', 
  '0EEFBED7-9C4C-42AD-9929-FBDDA1B4E922.JPG', 
  '10683988-A7C2-4015-8159-FF938A2B340D.JPG', 
  '16BAD5C4-CE91-4D71-A394-E6C71FB17CD6.JPG', 
  '1D000A45-A36B-4782-B98B-05DE6AFB8DE3.JPG', 
  '1E27F947-3ACE-4AED-95F1-0F79F644C986.JPG', 
  '1E2BE317-DA39-4AF2-9A53-1F473331049B.JPG', 
  '1E3726E7-10B3-4F9C-9257-937441014F1A.JPG', 
  '208F1AD7-58E0-49C3-B35F-AF49FC3F0CDE.JPG', 
  '21465F3E-B8DF-4ACA-A46F-EF060191EE85.JPG', 
  '24863E95-84B8-40DA-A0A6-3CB066178DD8.JPG', 
  '282E51EC-F8E9-4A37-BCF6-3132C52C6751.JPG', 
  '29FA9E86-1BCF-4735-BF99-2AA5FFF63101.JPG', 
  '2B52658A-34D4-4417-A05D-F83E408AB928.JPG', 
  '2B6D9516-8D01-4752-9111-9462F5E79D5D.JPG', 
  '2FFB3D60-CBD3-4BD8-A61B-E8768BE4FED2.JPG', 
  '30A56E4A-C85C-45FA-87DD-B559A675CD9E.JPG', 
  '33C3260E-B226-4CBF-9FB0-89D8FF178DD2.JPG', 
  '34CBEE1B-8ED4-42F2-A0E9-E3FFAF9B80DA.JPG', 
  '3797D487-9F8A-4AFD-BD6B-C7B4CC7489B9.JPG', 
  '37E8A320-6067-4E0C-AFF3-595C9450B5E0.JPG', 
  '3821E836-1B0D-4E1F-9D6D-063025C4A66A.JPG', 
  '399CCB98-0581-49EB-A7DD-A7FE165723B1.JPG', 
  '39C517C5-6E19-43AA-8E4D-E81EDE40F6C8.JPG', 
  '3A39B971-451C-4384-9353-C0F2F0AC7C7B.JPG', 
  '3D4F81B9-B847-4A72-BE04-AD67736F24F6.JPG', 
  '3DDE2D6F-5FA3-43C8-91D0-27C34C5CDA67.JPG', 
  '40AC94F3-CAD7-426E-BA70-4D1D0B722816.JPG', 
  '415713E8-4066-408C-8EC5-8E84C971979F.JPG', 
  '432B792D-F136-40C8-8BEB-1EBD7789CD54.JPG', 
  '44E7BF22-6F3B-4A30-BA4B-FD6E3C157391.JPG', 
  '470600E3-4507-4559-95A7-33D06D4F678B.JPG', 
  '49078041-1180-4016-A797-9E0214568883.JPG', 
  '4ABFCC78-00B7-41CB-9252-FF730B000661.JPG', 
  '4DFA88B4-C603-4602-AD60-60E44F8973F1.JPG', 
  '5128310E-B59A-4B19-BEB9-3244302D5484.JPG', 
  '5371F14B-4BDA-4B35-9D2C-F982F2BAEAD8.JPG', 
  '57B7DF0F-2E0E-4CCE-B98B-23BA73EDBCBA.JPG', 
  '62BF8D5F-8ED9-43F7-8129-024B8521CE21.JPG', 
  '6585A8CF-33E7-4921-BE9D-0DFBF36226AB.JPG', 
  '66152DB4-1C74-44A0-87D7-0CC4A5BC44F8.JPG', 
  '66E98D96-3E08-4E61-8BA2-1D0DA3902FA2.JPG', 
  '6789E071-B745-451E-A49F-99DDE287E6AB.JPG', 
  '68C9400B-36B8-43DF-91A3-E641E7B0F204.JPG', 
  '6FEB105B-AE50-4157-806E-B960E9027B4B.JPG', 
  '705A64C3-5D03-47EE-A85D-0C0FFEB8A57B.JPG', 
  '70B3D870-844F-41C9-A46D-CF9E30828E13.JPG', 
  '72C46CE7-649C-4CEB-8B3D-CEFA354FEF2F.JPG', 
  '731DF57B-C138-49B3-8BAD-0132EEA9AB9B.JPG', 
  '73758C5E-6743-4ADB-ABC0-314E4A79272B.JPG', 
  '747EFCA5-6C42-48E5-9FBE-13A7CEA9B9F6.JPG', 
  '777D44CF-EA4C-4150-85C1-71B348DB9047.JPG', 
  '78FEB6E2-9B9E-492D-9AEF-184E808A633D.JPG', 
  '7A45C820-B917-499E-B508-0C30F75B5BDA.JPG', 
  '7A592DEC-ADCB-4D9E-92CF-418A17C63396.JPG', 
  '7AF28D08-2EA4-4C12-9197-EC1882526869.JPG', 
  '7AFD9CF5-A4EA-4AC4-A217-1AC33D5DC177.JPG', 
  '7D6B9EF6-0430-4858-AD99-F813E4EFAFEB.JPG', 
  '7FA6641E-D8BC-4EED-A4DB-5ED5B55386EE.JPG', 
  '816E6CD6-116E-45EF-ACBC-549943122F11.JPG', 
  '8424640A-0452-49B0-8FDF-0C0DF825D766.JPG', 
  '8502B469-B1E0-4812-8EA2-1048C6B90876.JPG', 
  '870D9268-FDAD-4A6A-81DB-657438266334.JPG', 
  '87111272-3F8D-4E5C-B2C3-66C3C9529206.JPG', 
  '87ABDD10-B02F-4A47-8A7D-143C88016055.JPG', 
  '89FCB87D-D0E9-4531-A725-0AE88F4D2B57.JPG', 
  '8AD140B4-3256-4A54-BA15-81B4DC048BAF.JPG', 
  '8DC9E238-B8C1-45CC-A7E3-7BBB0B9B421E.JPG', 
  '9080B576-6EDF-45E9-833B-AE65672CE867.JPG', 
  '943A21B1-75DF-43C1-88F2-DDC317DD98A4.JPG', 
  '9583779D-08C4-439A-9895-2E4E7C3F4118.JPG', 
  '95C17BB3-C25A-48C9-8308-520407A81C8E.JPG', 
  '96DC5D75-13BE-41C2-AFE0-7154F55A189D.JPG', 
  '9AC9DEEB-DEB5-4657-8600-870814BD5532.JPG', 
  '9AEC9186-6A3D-42C7-B9E9-BD9A4FC474A2.JPG', 
  '9C72CDCE-7539-4146-8CF4-78E1D57C8BB7.JPG', 
  'A1E09A60-71C6-41E3-A140-185DB389ECAB.JPG', 
  'A48F492F-05CF-41C9-857F-A4F6E4CF2900.JPG', 
  'A615A628-87E2-4DB3-8695-D671143AAB5B.JPG', 
  'A9F4A531-555F-4F3C-B7FD-A138D7A3E68A.JPG', 
  'ADB9946F-4C64-4E07-9412-BB7D6F5DF771.JPG', 
  'AFF24DCE-0F03-4787-A994-8B2909493E46.JPG', 
  'B3C6BD75-EE64-43B5-B47B-573CA52F2DC5.JPG', 
  'B4050052-25B0-4C39-9F7A-0363BE33FF80.JPG', 
  'B4A38432-2F7E-4DF6-AC0F-5E7D8EE4E209.JPG', 
  'B653CCC5-03EB-4C3A-87F9-A67C078B5305.JPG', 
  'B68A2450-01A9-4BE2-84A4-94FAB323571F.JPG', 
  'BA38C595-CE4F-413D-8932-31DA5374A8DD.JPG', 
  'BA7016B8-221D-4EE4-A591-D195F5D27371.JPG', 
  'BAB84F60-816B-46D0-A686-C20F111D2EAD.JPG', 
  'BAE95F70-8C93-4258-878B-C8F1072EE61A.JPG', 
  'BED69D2C-0886-40BA-9922-6C0B8BB0BB2A.JPG', 
  'C0B278E7-363B-44C8-956B-7AFA8D83C92E.JPG', 
  'C371B279-0A54-408A-887C-77001683EFEF.JPG', 
  'C6C0A571-CFCB-4AAF-9BC7-7CD64BE93D85.JPG', 
  'CCB0EAAB-ED03-4DB0-8F00-5DF015C4227A.JPG', 
  'CD11B737-A774-4BF8-B0BD-EB017CB846B6.JPG', 
  'CD81C696-3876-433E-8079-5D06ED8D79B2.JPG', 
  'D636A909-CC68-47D1-8738-F9C546E9331A.JPG', 
  'D7995E94-06DA-45F9-A185-7EAD31B79211.JPG', 
  'D7B796D5-00BA-42FF-B7A5-FD1C754F8E2B.JPG', 
  'D93468E2-1A8E-4907-B931-0C3B923B2F4C.JPG', 
  'D9EEE7A0-3F9D-41A5-AB81-672435C00B2D.JPG', 
  'DBD3F050-36EE-4238-953F-3D503D05ABB0.JPG', 
  'DC905D7D-0149-401D-88DA-99CC86DF9C02.JPG', 
  'E2C2E93C-4D46-47DA-98C9-DFA993BF509A.JPG', 
  'EA2EC6C3-7460-43E4-AB12-F09A7A6A4387.JPG', 
  'EFA518AA-681F-483B-A183-DE89DAF6C0F6.JPG', 
  'F22A27C0-1D33-457A-8E37-F50C8212BA99.JPG', 
  'F30CD089-7B50-4246-9365-C4E786A420DE.JPG', 
  'F3895621-0E25-4DA6-971E-6A272D76543B.JPG', 
  'F8E883ED-8304-4847-9F56-2C8AA7F38F78.jpg', 
  'F909B614-1094-45E2-BD5E-5B2205C28EBC.JPG', 
  'FBB21DED-0E2C-4C5A-8558-4FFD599010D2.JPG', 
  'image.JPG', 
  'IMG_0312.jpg', 
  'IMG_1255.jpg', 
  'IMG_4208.jpg', 
  'IMG_7201.jpg', 
  'IMG_7215.jpg', 
  'IMG_7225.jpg', 
  'IMG_R_0034.JPG'
  ];
  if (galleryGrid) {
    galleryGrid.innerHTML = '';

    function createGalleryItem(file, idx) {
      var item = document.createElement('div');
      item.className = 'gallery-item reveal';
      var cat = galleryCat[file];
      if (cat) item.setAttribute('data-category', cat);

      var toWebP = function(f) { return f.replace(/\.(jpg|jpeg|JPG|JPEG)$/, '.webp'); };
      var webpFile = toWebP(file);

      var picture = document.createElement('picture');
      var source = document.createElement('source');
      source.srcset = 'images/gallery/' + webpFile;
      source.type = 'image/webp';
      picture.appendChild(source);

      var img = document.createElement('img');
      img.src = 'images/gallery/' + file;
      img.alt = 'Фото';
      img.loading = 'lazy';
      img.setAttribute('data-i18n-aria', 'gallery.img.alt');
      img.onload = function() { this.classList.add('loaded'); };
      if (img.complete) img.classList.add('loaded');
      (function(imgEl, idxEl) {
        imgEl.addEventListener('click', function() {
          currentIndex = idxEl;
          openLightbox(idxEl);
        });
      })(img, idx);
      picture.appendChild(img);

      item.innerHTML = '<div class="gallery-overlay"><span class="gallery-overlay-label" data-i18n="gallery.img.label">View</span><span class="gallery-overlay-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>';
      item.insertBefore(picture, item.firstChild);
      return item;
    }

    var fragment = document.createDocumentFragment();
    for (var i = 0; i < galleryFiles.length; i++) {
      fragment.appendChild(createGalleryItem(galleryFiles[i], i));
    }
    galleryGrid.appendChild(fragment);

    if (typeof revealObserver !== 'undefined' && revealObserver) {
      galleryGrid.querySelectorAll('.gallery-item.reveal:not(.visible)').forEach(function(el) {
        revealObserver.observe(el);
      });
    }

    // Apply active filter to initial items
    if (galleryFilters) {
      var activeBtn = galleryFilters.querySelector('.filter-btn.active');
      if (activeBtn) {
        var activeFilter = activeBtn.getAttribute('data-filter');
        if (activeFilter && activeFilter !== 'all') {
          galleryGrid.querySelectorAll('.gallery-item').forEach(function(item) {
            if (item.getAttribute('data-category') !== activeFilter) {
              item.classList.add('hidden');
            }
  // Input focus → курсор в конец (кроме повторных кликов внутри поля)
  document.addEventListener('mousedown', function(e) {
    var tag = e.target && e.target.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
    var el = e.target;
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
        });
      }
    }
  }
  // Lightbox already attached per-image in createGalleryItem
  if (galleryFilters) {
    galleryFilters.addEventListener('click', function(e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;
      var filter = btn.getAttribute('data-filter');
      galleryFilters.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      galleryGrid.querySelectorAll('.gallery-item').forEach(function(item) {
        if (filter === 'all' || item.getAttribute('data-category') === filter) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    });
  }
  }
  // Per-image click handler already attached in createGalleryItem
  if (typeof applyLanguage === 'function') applyLanguage(currentLang);

  // Hero video background — dual-buffered, мгновенное переключение
  var heroVideoBg = document.getElementById('heroVideoBg');
  var heroVideoSingle = document.getElementById('heroVideoSingle');
  var heroVideo0 = document.getElementById('heroVideo0');
  var heroVideo1 = document.getElementById('heroVideo1');
  var heroVideo2 = document.getElementById('heroVideo2');

  if (heroVideoBg && (heroVideoSingle || heroVideo0)) {
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

    var started = false;
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

    function createSlot(container, existingEl, initialIdx) {
      existingEl.muted = true;
      existingEl.playsInline = true;
      existingEl.preload = 'auto';
      existingEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover';

      var buffer = document.createElement('video');
      buffer.muted = true;
      buffer.playsInline = true;
      buffer.preload = 'auto';
      buffer.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;pointer-events:none';

      container.appendChild(existingEl);
      container.appendChild(buffer);

      var slot = { active: existingEl, buffer: buffer, idx: initialIdx };

      function retryPlay(el) {
        if (!el.paused) return;
        el.play().catch(function() {
          setTimeout(function() { retryPlay(el); }, 500);
        });
      }

      function keepPlaying(el) {
        el.addEventListener('waiting', function() {
          setTimeout(function() { retryPlay(el); }, 300);
        });
      }

      function swap() {
        var newIdx = pickNext(slot.idx, slots.map(function(s) { return s.idx; }));
        slot.idx = newIdx;

        var a = slot.active, b = slot.buffer;
        b.currentTime = 0;

        var commit = function() {
          b.style.opacity = '';
          b.style.pointerEvents = '';
          b.play().catch(function() {});
          a.style.opacity = '0';
          a.style.pointerEvents = 'none';
          a.style.visibility = 'hidden';

          a.removeEventListener('ended', swap);
          a.removeEventListener('error', swap);
          b.addEventListener('ended', swap);
          b.addEventListener('error', swap);

          keepPlaying(b);

          slot.active = b;
          slot.buffer = a;

          preloadNext();
        };

        if (b.readyState >= 4) {
          commit();
        } else if (b.readyState >= 2) {
          var onCanPlay = function() {
            b.removeEventListener('error', onFail);
            commit();
          };
          var onFail = function() {
            b.removeEventListener('canplay', onCanPlay);
            var retryIdx = pickNext(slot.idx, slots.map(function(s) { return s.idx; }));
            slot.idx = retryIdx;
            b.src = 'images/videos/' + videoFiles[retryIdx];
            swap();
          };
          b.addEventListener('canplay', onCanPlay, { once: true });
          b.addEventListener('error', onFail, { once: true });
        } else {
          var onReady = function() {
            b.removeEventListener('error', onFail);
            var onCanPlay2 = function() { commit(); };
            b.addEventListener('canplay', onCanPlay2, { once: true });
          };
          var onFail = function() {
            b.removeEventListener('loadeddata', onReady);
            var retryIdx = pickNext(slot.idx, slots.map(function(s) { return s.idx; }));
            slot.idx = retryIdx;
            b.src = 'images/videos/' + videoFiles[retryIdx];
            swap();
          };
          b.addEventListener('loadeddata', onReady, { once: true });
          b.addEventListener('error', onFail, { once: true });
        }
      }

      function preloadNext() {
        var nextIdx = pickNext(slot.idx, slots.map(function(s) { return s.idx; }));
        slot.buffer.src = 'images/videos/' + videoFiles[nextIdx];
      }

      existingEl.addEventListener('ended', swap);
      existingEl.addEventListener('error', swap);
      keepPlaying(existingEl);

      existingEl.src = 'images/videos/' + videoFiles[initialIdx];
      existingEl.play().catch(function() {});
      existingEl.addEventListener('playing', function() { preloadNext(); }, { once: true });

      if (!started) {
        started = true;
        heroVideoBg.style.opacity = '1';
      }

      return slot;
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
      started = false;

      if (currentMode === 'single') {
        var wrap = document.createElement('div');
        wrap.style.cssText = 'position:absolute;inset:0;overflow:hidden';
        var parent = heroVideoSingle.parentNode;
        parent.replaceChild(wrap, heroVideoSingle);
        singleSlot = createSlot(wrap, heroVideoSingle, 0);
        singleSlot.container = wrap;
      } else {
        [heroVideo0, heroVideo1, heroVideo2].forEach(function(el, i) {
          var wrap = document.createElement('div');
          wrap.style.cssText = 'flex:1;min-width:0;position:relative;overflow:hidden';
          el.parentNode.replaceChild(wrap, el);
          var slot = createSlot(wrap, el, i * 5);
          slot.container = wrap;
          slots.push(slot);
        });
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

  // Preloader
  window.addEventListener('load', function() {
    var preloader = document.getElementById('preloader');
    if (preloader) preloader.classList.add('hidden');
  });
  // Fallback if load already fired
  if (document.readyState === 'complete') {
    var preloader = document.getElementById('preloader');
    if (preloader) preloader.classList.add('hidden');
  }

  // Navbar scroll
  var navbar = document.getElementById('navbar');
  var backToTop = document.getElementById('backToTop');
  if (navbar && document.querySelector('.page-hero')) {
    navbar.classList.add('scrolled');
  }
  window.addEventListener('scroll', function() {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
    if (backToTop) backToTop.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });

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
    reviewXhr.onload = function() {
      if (reviewXhr.status < 200 || reviewXhr.status >= 300) return;
      var reviews;
      try { reviews = JSON.parse(reviewXhr.responseText); } catch(e) { return; }
      if (!reviews || !reviews.length) return;
      reviews.forEach(function(r) {
        var card = document.createElement('div');
        card.className = 'testimonial-card';
        card.innerHTML =
          '<div class="testimonial-card-top">' +
            '<div class="testimonial-avatar" style="background:#D478B0"></div>' +
            '<div>' +
              '<cite>&mdash; ' + escapeHtml(r.name || '') + '</cite>' +
              '<span class="testimonial-event">Review</span>' +
            '</div>' +
          '</div>' +
          '<div class="testimonial-stars">★★★★★</div>' +
          '<blockquote>&laquo;' + escapeHtml(r.comment || '') + '&raquo;</blockquote>';
        testTrack.appendChild(card);
        testCards.push(card);
        testCardCount++;
      });
      centerSliderPaddings();
      updateTestTrack();
    };
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
  }

  // Toast helper
  var toast = document.getElementById('toast');
  function showToast(msg, isError) {
    if (!toast) return;
    var textEl = toast.querySelector('.toast-text');
    if (textEl) textEl.textContent = msg;
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
    var nameError = document.getElementById('nameError');
    var phoneError = document.getElementById('phoneError');
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

    function setButtonLoading(loading) {
      if (!submitBtn) return;
      if (loading) {
        submitBtn.disabled = true;
        submitBtn.textContent = '...';
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = btnOriginalText;
      }
    }

    function setButtonSuccess() {
      if (!submitBtn) return;
      submitBtn.disabled = true;
      submitBtn.textContent = '✓ ' + btnOriginalText;
      setTimeout(function() {
        submitBtn.disabled = false;
        submitBtn.textContent = btnOriginalText;
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
        { el: phoneInput, valid: validatePhone }
      ];
      for (var i = 0; i < fields.length; i++) {
        var f = fields[i];
        if (!f.valid()) {
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
      if (!isNameValid || !isPhoneValid) {
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
        comment: commentInput.value.trim(),
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



  // ── Magnetic buttons ──
  document.querySelectorAll('.btn, .filter-btn').forEach(function(btn) {
    btn.addEventListener('mousemove', function(e) {
      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left - rect.width / 2;
      var y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = 'translate(' + (x * 0.2) + 'px, ' + (y * 0.2) + 'px)';
    });
    btn.addEventListener('mouseleave', function() {
      btn.style.transform = '';
      btn.style.transition = 'transform .4s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(function() { btn.style.transition = ''; }, 400);
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
    reviewBtn.addEventListener('click', function() {
      var lang = typeof currentLang !== 'undefined' ? currentLang : 'de';
      var pool = reviewPlaceholders[lang] || reviewPlaceholders.en;
      reviewModal.querySelector('#reviewText').placeholder = pool[Math.floor(Math.random() * pool.length)];
      reviewRating.value = '5';
      setStars(5);
      reviewModal.classList.add('open');
    });
    reviewModalClose.addEventListener('click', function() { reviewModal.classList.remove('open'); });
    reviewModal.addEventListener('click', function(e) {
      if (e.target === reviewModal) reviewModal.classList.remove('open');
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

    reviewForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var nameInput = document.getElementById('reviewName');
      var textInput = document.getElementById('reviewText');
      var name = nameInput.value.trim();
      var text = textInput.value.trim();
      var rating = reviewRating.value;
      nameInput.classList.toggle('error', !name);
      textInput.classList.toggle('error', !text);
      if (!name || !text) return;
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
        reviewModal.classList.remove('open');
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
        page_url: window.location.href,
        language: typeof currentLang !== 'undefined' ? currentLang : 'de'
      }));
    });
  }
});