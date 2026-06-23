var BACKEND_URL = (function() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  return 'https://party-tales-production.up.railway.app';
})();
