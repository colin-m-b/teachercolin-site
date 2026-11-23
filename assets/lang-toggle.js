(function() {
    var STORAGE_KEY = 'teachercolin-lang';

    function apply(lang) {
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-en]').forEach(function(el) {
            el.textContent = el.getAttribute('data-' + lang) || el.getAttribute('data-en');
        });
        // Rich blocks (links, bold, tables) come in pairs: data-lang-only="en" and
        // data-lang-only="vi". Only the current language's block is shown; the
        // Vietnamese blocks start hidden so the page reads in English without JavaScript.
        document.querySelectorAll('[data-lang-only]').forEach(function(el) {
            el.hidden = el.getAttribute('data-lang-only') !== lang;
        });
        document.querySelectorAll('.lang-toggle button').forEach(function(btn) {
            btn.classList.toggle('is-active', btn.dataset.lang === lang);
        });
    }

    var saved = 'en';
    try { saved = localStorage.getItem(STORAGE_KEY) || 'en'; } catch (e) {}
    apply(saved);

    document.querySelectorAll('.lang-toggle button').forEach(function(btn) {
        btn.addEventListener('click', function() {
            apply(btn.dataset.lang);
            try { localStorage.setItem(STORAGE_KEY, btn.dataset.lang); } catch (e) {}
        });
    });
})();
