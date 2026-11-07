/* HackTrent: accessible interactions
   - Site search: results listed as links, count announced via role="status"
   - Apply form: error summary + inline errors, aria-invalid, aria-describedby,
     focus management, success message announced via role="status"
   Without JavaScript the form still uses the browser's built-in "required" checks. */

(function () {
    'use strict';

    /* ---------- helpers ---------- */

    // Add or remove one id from an element's aria-describedby list without losing hint ids
    function setDescribedBy(el, id, add) {
        var ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
        var has = ids.indexOf(id) !== -1;
        if (add && !has) ids.push(id);
        if (!add && has) ids.splice(ids.indexOf(id), 1);
        if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
        else el.removeAttribute('aria-describedby');
    }

    function showError(errorEl, message) {
        errorEl.textContent = '';
        var hidden = document.createElement('span');
        hidden.className = 'visually-hidden';
        hidden.textContent = 'Error: ';
        errorEl.appendChild(hidden);
        errorEl.appendChild(document.createTextNode(message));
        errorEl.hidden = false;
    }

    function clearError(errorEl) {
        errorEl.textContent = '';
        errorEl.hidden = true;
    }

    /* ---------- site search ---------- */

    var searchForm = document.getElementById('search-form');
    if (searchForm) {
        var input = document.getElementById('search-input');
        var searchError = document.getElementById('search-error');
        var results = document.getElementById('search-results');
        var status = document.getElementById('search-status');
        var list = document.getElementById('search-list');
        var clearBtn = document.getElementById('search-clear');

        var clearResults = function () {
            results.hidden = true;
            status.textContent = '';
            list.textContent = '';
        };

        searchForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var q = input.value.trim().toLowerCase();

            if (!q) {
                clearResults();
                showError(searchError, 'Enter a word to search for.');
                input.setAttribute('aria-invalid', 'true');
                setDescribedBy(input, 'search-error', true);
                input.focus();
                return;
            }
            clearError(searchError);
            input.removeAttribute('aria-invalid');
            setDescribedBy(input, 'search-error', false);

            // Search every section in main plus the news sidebar
            var areas = document.querySelectorAll('main section[id], aside');
            var matches = [];
            areas.forEach(function (area) {
                if (area.textContent.toLowerCase().indexOf(q) !== -1) {
                    var heading = area.querySelector('h1, h2');
                    if (!area.id) area.id = 'news';
                    matches.push({ id: area.id, title: heading ? heading.textContent.trim() : area.id });
                }
            });

            list.textContent = '';
            matches.forEach(function (m) {
                var li = document.createElement('li');
                var a = document.createElement('a');
                a.href = '#' + m.id;
                a.textContent = m.title;
                li.appendChild(a);
                list.appendChild(li);
            });

            results.hidden = false;
            var n = matches.length;
            var shown = input.value.trim();
            status.textContent = n === 0
                ? 'No results for "' + shown + '". Try a different word.'
                : n + (n === 1 ? ' result' : ' results') + ' for "' + shown + '".';
        });

        clearBtn.addEventListener('click', function () {
            clearResults();
            input.value = '';
            input.focus();
        });

        // Escape in the search box clears it
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && input.value) {
                input.value = '';
                clearResults();
            }
        });
    }

    /* ---------- apply form ---------- */

    var form = document.getElementById('apply-form');
    if (!form) return;

    // Script is running, so switch from browser bubbles to our accessible messages
    form.setAttribute('novalidate', '');

    var summary = document.getElementById('error-summary');
    var summaryList = document.getElementById('error-summary-list');
    var formStatus = document.getElementById('apply-status');
    var attempted = false;

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Each rule: which control to mark, where its message goes, and what to say
    var rules = [
        {
            field: 'full-name', error: 'full-name-error',
            check: function () { return form.fullName.value.trim() !== ''; },
            message: function () { return 'Enter your full name.'; }
        },
        {
            field: 'email', error: 'email-error',
            check: function () { return emailPattern.test(form.email.value.trim()); },
            message: function () {
                return form.email.value.trim() === ''
                    ? 'Enter your email address.'
                    : 'Enter an email address in the format name@example.com.';
            }
        },
        {
            field: 'year', error: 'year-error',
            check: function () { return form.year.value !== ''; },
            message: function () { return 'Choose your year of study.'; }
        },
        {
            field: 'exp-none', group: 'experience-group', error: 'experience-error', radios: 'experience',
            check: function () { return !!form.querySelector('input[name="experience"]:checked'); },
            message: function () { return 'Choose how many hackathons you have been to.'; }
        },
        {
            field: 'conduct', error: 'conduct-error',
            check: function () { return form.conduct.checked; },
            message: function () { return 'Agree to the code of conduct to apply.'; }
        }
    ];

    function applyRule(rule) {
        var ok = rule.check();
        var errorEl = document.getElementById(rule.error);
        var container = document.getElementById(rule.group || rule.field).closest('.field');
        var controls = rule.radios
            ? Array.prototype.slice.call(form.querySelectorAll('input[name="' + rule.radios + '"]'))
            : [document.getElementById(rule.field)];
        var describedTarget = rule.group ? document.getElementById(rule.group) : controls[0];

        if (ok) {
            clearError(errorEl);
            controls.forEach(function (c) { c.removeAttribute('aria-invalid'); });
            setDescribedBy(describedTarget, rule.error, false);
            container.classList.remove('has-error');
        } else {
            showError(errorEl, rule.message());
            controls.forEach(function (c) { c.setAttribute('aria-invalid', 'true'); });
            setDescribedBy(describedTarget, rule.error, true);
            container.classList.add('has-error');
        }
        return ok;
    }

    function buildSummary(failed) {
        summaryList.textContent = '';
        failed.forEach(function (rule) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#' + rule.field;
            a.textContent = rule.message();
            // Move focus to the control itself, not just scroll to it
            a.addEventListener('click', function (e) {
                e.preventDefault();
                var target = document.getElementById(rule.field);
                target.focus();
                target.scrollIntoView({ block: 'center' });
            });
            li.appendChild(a);
            summaryList.appendChild(li);
        });
        document.getElementById('error-summary-title').textContent =
            failed.length === 1 ? 'There is 1 problem with your application' : 'There are ' + failed.length + ' problems with your application';
        summary.hidden = failed.length === 0;
    }

    function validateAll() {
        return rules.filter(function (rule) { return !applyRule(rule); });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        attempted = true;
        formStatus.textContent = '';
        var failed = validateAll();
        buildSummary(failed);

        if (failed.length) {
            // Send keyboard and screen reader users straight to the list of problems
            summary.focus();
            return;
        }

        var name = form.fullName.value.trim();
        form.reset();
        attempted = false;
        // role="status" on #apply-status announces this without moving focus
        formStatus.textContent = 'Thanks, ' + name + '. Your application was received. (Demo site: nothing was actually sent.)';
    });

    // After the first submit, fix errors live as the user corrects each field
    form.addEventListener('input', revalidate);
    form.addEventListener('change', revalidate);

    function revalidate(e) {
        if (!attempted) return;
        rules.forEach(function (rule) {
            var el = e.target;
            if (el.id === rule.field || (rule.radios && el.name === rule.radios)) applyRule(rule);
        });
        // Keep the summary in step, but don't steal focus while the user is typing
        buildSummary(rules.filter(function (rule) { return !rule.check(); }));
    }
})();
