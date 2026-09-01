(function () {
  'use strict';
  var KEY = 'tc-lang';

  function sync() {
    var lang = document.documentElement.classList.contains('lang-vi') ? 'vi' : 'en';
    var buttons = document.querySelectorAll('[data-lang-btn]');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      btn.setAttribute('aria-pressed', btn.getAttribute('data-lang-btn') === lang ? 'true' : 'false');
    }
  }

  function setLang(lang) {
    document.documentElement.classList.remove('lang-en', 'lang-vi');
    document.documentElement.classList.add('lang-' + lang);
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    sync();
  }

  var buttons = document.querySelectorAll('[data-lang-btn]');
  for (var i = 0; i < buttons.length; i++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        setLang(btn.getAttribute('data-lang-btn'));
      });
    })(buttons[i]);
  }

  sync();
})();
