/* ============================================================================
 * app-shell.js — Casca persistente + roteador (Etapa 2, Fase 1)
 * ----------------------------------------------------------------------------
 * Mantém sidebar/navbar/scripts em pé e troca apenas o #app-content via fetch
 * + History API. Páginas NÃO migradas continuam carregando no modo clássico
 * (full reload), então a migração é incremental e o fallback é total.
 *
 * Cada página migrada se auto-registra:
 *   AppShell.register('comercial.html', 'comercial', initFn, teardownFn)
 *
 * Regras de robustez:
 *  - rota sem registro  -> navegação clássica (o navegador resolve)
 *  - página sem #app-content no destino -> navegação clássica
 *  - qualquer erro no fetch/parse -> navegação clássica
 * ========================================================================== */
(function () {
    'use strict';
    if (window.AppShell) return;

    window.__APP_SHELL__ = true;

    var routes = {};   // pageFile -> { key, init, teardown }
    var current = null;

    function pageFromUrl(url) {
        try {
            var p = new URL(url, location.href).pathname.split('/').pop();
            return p || 'index.html';
        } catch (e) { return null; }
    }

    function routeFor(url) {
        var p = pageFromUrl(url);
        return (p && routes[p]) ? routes[p] : null;
    }

    function runInit(r) {
        current = r.key;
        if (typeof r.init === 'function') {
            try { r.init(); } catch (e) { console.error('[AppShell init ' + r.key + ']', e); }
        }
    }

    function runTeardown() {
        if (!current) return;
        var prev = null;
        for (var p in routes) { if (routes[p].key === current) { prev = routes[p]; break; } }
        if (prev && typeof prev.teardown === 'function') {
            try { prev.teardown(); } catch (e) { console.error('[AppShell teardown ' + current + ']', e); }
        }
        current = null;
    }

    function hardLoad(url) { window.location.href = url; }

    function navigate(url, push) {
        var r = routeFor(url);
        if (!r) { hardLoad(url); return Promise.resolve(); }   // rota não migrada -> clássico
        return fetch(url, { headers: { 'X-Requested-With': 'app-shell' }, credentials: 'same-origin' })
            .then(function (resp) { if (!resp.ok) throw new Error('HTTP ' + resp.status); return resp.text(); })
            .then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                var novo = doc.getElementById('app-content');
                var atual = document.getElementById('app-content');
                if (!novo || !atual) { hardLoad(url); return; }   // sem casca no destino -> clássico
                runTeardown();
                atual.innerHTML = novo.innerHTML;
                if (doc.title) document.title = doc.title;
                if (push) history.pushState({ appShell: true, url: url }, '', url);
                window.scrollTo(0, 0);
                runInit(r);
            })
            .catch(function (e) { console.error('[AppShell navigate]', e); hardLoad(url); });
    }

    function onClick(e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;
        if (a.target && a.target !== '_self') return;
        if (a.hasAttribute('download')) return;
        var href = a.getAttribute('href');
        if (!href || href.charAt(0) === '#') return;
        if (/^[a-z][a-z0-9+.-]*:\/\//i.test(href) || /^(mailto|tel):/i.test(href)) return;  // externos
        if (!routeFor(href)) return;                 // não migrada: deixa o navegador fazer o clássico
        // mesma rota + mesma query -> ignora
        var same = pageFromUrl(href) === pageFromUrl(location.href) &&
            (new URL(href, location.href)).search === location.search;
        if (same) { e.preventDefault(); return; }
        e.preventDefault();
        navigate(href, true);
    }

    function onPopState() {
        if (routeFor(location.href)) navigate(location.href, false);
        // se não migrada, o navegador já recarregou a página clássica
    }

    function onReady() {
        var r = routeFor(location.href);
        if (r) runInit(r);
        document.addEventListener('click', onClick);
        window.addEventListener('popstate', onPopState);
    }

    window.AppShell = {
        register: function (pageFile, key, init, teardown) {
            routes[pageFile] = { key: key, init: init, teardown: teardown };
        },
        navigate: navigate,
        routeFor: routeFor,
        pageFromUrl: pageFromUrl,
        get current() { return current; }
    };

    // Garante que o init da rota atual rode SÓ depois de as páginas se registrarem
    // (os <script> de página executam antes do DOMContentLoaded).
    if (document.readyState === 'complete') setTimeout(onReady, 0);
    else document.addEventListener('DOMContentLoaded', onReady);
})();