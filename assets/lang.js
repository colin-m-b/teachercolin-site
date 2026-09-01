/* teachercolin.com — EN/VI content toggle
   Shows/hides .i18n-en / .i18n-vi text and remembers the choice
   (localStorage) across index.html, 8-athens.html, 9-zurich.html,
   10-edmonton.html. No page reload, no separate Vietnamese pages. */

(function () {
  var STORAGE_KEY = 'tc-lang';

  function getSavedLang() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function saveLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* localStorage unavailable (private mode, blocked) — toggle still works for this page view */
    }
  }

  function applyLang(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    document.querySelectorAll('.lang-toggle .lang-btn').forEach(function (btn) {
      var isActive = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  var initialLang = getSavedLang() === 'vi' ? 'vi' : 'en';
  applyLang(initialLang);

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.lang-toggle .lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var lang = btn.getAttribute('data-lang');
        saveLang(lang);
        applyLang(lang);
      });
    });
  });
})();
