/* ============================================================
   Creation Structure — App Shell & Routing
   ============================================================ */

(function () {
  'use strict';

  /* ---- Page Routing ---- */
  const tabs = document.querySelectorAll('.nav-tab[data-page]');
  const pages = document.querySelectorAll('.page-section');
  const skipLink = document.querySelector('a[href="#main-content"]');

  function navigateTo(pageId) {
    // Update tabs
    tabs.forEach(t => {
      const active = t.dataset.page === pageId;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    // Update pages
    pages.forEach(p => {
      const active = p.id === 'page-' + pageId;
      p.classList.toggle('active', active);
    });

    // Update URL hash (quietly)
    if (window.location.hash !== '#' + pageId) {
      history.replaceState(null, '', '#' + pageId);
    }

    // Focus main content
    document.getElementById('main-content').focus({ preventScroll: true });

    // Initialize page-specific viz if needed
    window.dispatchEvent(new CustomEvent('page-shown', { detail: { page: pageId } }));
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const pageId = tab.dataset.page;
      navigateTo(pageId);
    });
  });

  // Handle hash on load
  function handleHash() {
    const hash = window.location.hash.replace('#', '');
    const valid = ['fractals', 'lsystems', 'emergence', 'attractors', 'foundation'];
    if (valid.includes(hash)) {
      navigateTo(hash);
    }
  }

  window.addEventListener('hashchange', handleHash);
  if (window.location.hash) {
    handleHash();
  }

  // Skip link
  skipLink.addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('main-content').focus({ preventScroll: false });
  });

  /* ---- Keyboard Navigation ---- */
  document.addEventListener('keydown', function (e) {
    // Ctrl/Cmd + 1-5 to switch tabs
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
      e.preventDefault();
      const idx = parseInt(e.key) - 1;
      const tab = tabs[idx];
      if (tab) navigateTo(tab.dataset.page);
    }
  });

})();
