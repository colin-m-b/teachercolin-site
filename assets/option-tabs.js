/* Option A / Option B tabs.
   Every [data-opt-tabs] group on the page switches together.
   Without JavaScript (and in print) every panel shows, one after the other. */
(function () {
    var STORAGE_KEY = 'teachercolin-option';
    var groups = Array.prototype.slice.call(document.querySelectorAll('[data-opt-tabs]'));
    if (!groups.length) return;

    var LABELS = { a: 'Option A: Analyze', b: 'Option B: Create' };
    var LABELS_VI = { a: 'Lựa chọn A: Phân tích', b: 'Lựa chọn B: Sáng tạo' };
    var isVi = document.documentElement.lang === 'vi';
    var allTabs = [];

    groups.forEach(function (group, gi) {
        var panels = group.querySelectorAll(':scope > [data-opt]');
        var list = document.createElement('div');
        list.className = 'opt-tablist';
        list.setAttribute('role', 'tablist');
        list.setAttribute('aria-label', 'Choose your option');

        Array.prototype.forEach.call(panels, function (panel) {
            var key = panel.getAttribute('data-opt');
            var id = 'opt-' + gi + '-' + key;
            panel.id = panel.id || id + '-panel';
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-labelledby', id);
            panel.setAttribute('tabindex', '0');

            var tab = document.createElement('button');
            tab.type = 'button';
            tab.className = 'opt-tab';
            tab.id = id;
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-controls', panel.id);
            tab.setAttribute('data-opt', key);
            // data-en / data-vi let lang-toggle.js switch the label with the rest of the page.
            tab.setAttribute('data-en', LABELS[key] || key);
            tab.setAttribute('data-vi', LABELS_VI[key] || LABELS[key] || key);
            tab.textContent = isVi ? tab.getAttribute('data-vi') : tab.getAttribute('data-en');
            list.appendChild(tab);
            allTabs.push(tab);
        });

        group.insertBefore(list, group.firstChild);
        group.classList.add('is-tabbed');
    });

    function select(key, anchor) {
        // Keep the tab the student clicked in the same place on screen,
        // even if a group above it changes height.
        var before = anchor ? anchor.getBoundingClientRect().top : null;

        groups.forEach(function (group) {
            group.querySelectorAll(':scope > [data-opt]').forEach(function (panel) {
                panel.hidden = panel.getAttribute('data-opt') !== key;
            });
        });
        allTabs.forEach(function (tab) {
            var on = tab.getAttribute('data-opt') === key;
            tab.setAttribute('aria-selected', on ? 'true' : 'false');
            tab.tabIndex = on ? 0 : -1;
        });

        if (anchor) window.scrollBy(0, anchor.getBoundingClientRect().top - before);
        try { sessionStorage.setItem(STORAGE_KEY, key); } catch (e) {}
    }

    allTabs.forEach(function (tab) {
        tab.addEventListener('click', function () { select(tab.getAttribute('data-opt'), tab); });
        tab.addEventListener('keydown', function (e) {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
            e.preventDefault();
            var siblings = Array.prototype.slice.call(tab.parentNode.querySelectorAll('[role="tab"]'));
            var i = siblings.indexOf(tab);
            var next;
            if (e.key === 'Home') next = siblings[0];
            else if (e.key === 'End') next = siblings[siblings.length - 1];
            else next = siblings[(i + (e.key === 'ArrowRight' ? 1 : -1) + siblings.length) % siblings.length];
            select(next.getAttribute('data-opt'), next);
            next.focus();
        });
    });

    var saved = 'a';
    try { saved = sessionStorage.getItem(STORAGE_KEY) || 'a'; } catch (e) {}
    if (!LABELS[saved]) saved = 'a';
    select(saved);
})();
