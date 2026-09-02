(function() {
    var STORAGE_KEY = 'teachercolin-lang';

    function apply(lang) {
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-en]').forEach(function(el) {
            el.textContent = el.getAttribute('data-' + lang) || el.getAttribute('data-en');
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
