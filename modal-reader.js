/* Reading Modal for Projects, Publications, and Lab Log */
(function () {
  'use strict';

  var modal = null;
  var modalBackdrop = null;
  var modalBody = null;
  var modalCloseBtn = null;
  var modalCopyBtn = null;
  var previouslyFocusedEl = null;
  var clickListenerAttached = false; // guard: only ever attach ONE click listener
  var modalStatePushed = false;      // tracks whether we pushed a history state for this modal open
  var closingFromPopstate = false;   // prevents recursive popstate → closeModal → history.back loop
  var openedFromHash = false;        // tracks whether the modal was opened via URL hash (not user click)
  var currentCardId = null;          // the id of the card currently displayed in the modal

  function getFocusableElements(container) {
    if (!container) return [];
    var selectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    var els = Array.prototype.slice.call(container.querySelectorAll(selectors));
    return els.filter(function (el) {
      return !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true' && el.offsetParent !== null;
    });
  }

  function getCardPageUrl(cardId) {
    // Determine which HTML page the current card lives on so we can produce a full shareable link.
    // Works both on a hard load of that page and after SPA navigation.
    var page = document.body.getAttribute('data-page') || '';
    var pageMap = {
      'projects':     'projects.html',
      'publications': 'publications.html',
      'lab':          'lab_log.html',
      'lab_log':      'lab_log.html'
    };
    var file = pageMap[page] || (window.location.pathname.split('/').pop() || 'index.html');
    // Compose an absolute URL using the site origin
    var origin = window.location.origin;
    return origin + '/' + file + '#' + cardId;
  }

  function createModal() {
    // Re-use existing modal if already in DOM (e.g. after SPA navigation that keeps <body>)
    var existing = document.getElementById('reading-modal');
    if (existing) {
      modal = existing;
      modalBackdrop = document.getElementById('reading-modal-backdrop');
      modalBody = modal.querySelector('.modal-body');
      modalCloseBtn = modal.querySelector('.modal-close-btn');
      modalCopyBtn = modal.querySelector('.modal-copy-btn');
      return;
    }

    modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'reading-modal-backdrop';
    modalBackdrop.className = 'reading-modal-backdrop';
    modalBackdrop.setAttribute('aria-hidden', 'true');

    modal = document.createElement('div');
    modal.id = 'reading-modal';
    modal.className = 'reading-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    var modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';

    modalCloseBtn = document.createElement('button');
    modalCloseBtn.className = 'modal-close-btn';
    modalCloseBtn.setAttribute('aria-label', 'Close reading view');
    modalCloseBtn.innerHTML = '&times;';

    modalCopyBtn = document.createElement('button');
    modalCopyBtn.className = 'modal-copy-btn';
    modalCopyBtn.setAttribute('aria-label', 'Copy link to this project');
    modalCopyBtn.setAttribute('title', 'Copy link');
    modalCopyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span class="modal-copy-label">Copy link</span>';

    modalHeader.appendChild(modalCopyBtn);
    modalHeader.appendChild(modalCloseBtn);

    modalBody = document.createElement('div');
    modalBody.className = 'modal-body';

    modal.appendChild(modalHeader);
    modal.appendChild(modalBody);

    document.body.appendChild(modalBackdrop);
    document.body.appendChild(modal);

    // Close on X button
    modalCloseBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeModal();
    });

    // Close on backdrop click — stop propagation so nothing behind fires
    modalBackdrop.addEventListener('click', function (e) {
      e.stopPropagation();
      closeModal();
    });

    // Stop clicks inside the modal from bubbling to the backdrop / document
    modal.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    // Copy link button
    modalCopyBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!currentCardId) return;
      var url = getCardPageUrl(currentCardId);
      var label = modalCopyBtn.querySelector('.modal-copy-label');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          if (label) { label.textContent = 'Copied!'; }
          setTimeout(function () { if (label) label.textContent = 'Copy link'; }, 2000);
        }).catch(function () {
          fallbackCopy(url, label);
        });
      } else {
        fallbackCopy(url, label);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (!modal || !modal.classList.contains('active')) return;
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'Tab') {
        var focusables = getFocusableElements(modal);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        var firstEl = focusables[0];
        var lastEl = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstEl || !modal.contains(document.activeElement)) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl || !modal.contains(document.activeElement)) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    });
  }

  function fallbackCopy(text, label) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (label) { label.textContent = 'Copied!'; }
      setTimeout(function () { if (label) label.textContent = 'Copy link'; }, 2000);
    } catch (err) {}
  }

  function openModal(articleEl, fromHash) {
    if (!articleEl) return;
    createModal();

    var fullContent = articleEl.querySelector('.full-content');
    if (!fullContent) return;

    previouslyFocusedEl = document.activeElement;
    currentCardId = articleEl.id || null;
    openedFromHash = !!fromHash;

    // Clone content so original DOM remains untouched
    modalBody.innerHTML = fullContent.innerHTML;

    // Scroll modal to top
    modal.scrollTop = 0;

    // Activate modal
    modalBackdrop.classList.add('active');
    modal.classList.add('active');
    document.body.classList.add('modal-open');

    // Update URL hash to reflect the open modal
    if (!modalStatePushed) {
      if (openedFromHash) {
        // Already on the right hash URL — tag current state with modalOpen
        history.replaceState({ modalOpen: true, cardId: currentCardId }, '', window.location.href);
      } else {
        // User clicked a card: push a state AND update hash so the URL is shareable
        var hashUrl = currentCardId ? ('#' + currentCardId) : '';
        history.pushState({ modalOpen: true, cardId: currentCardId }, '', hashUrl || (window.location.pathname + window.location.search));
      }
      modalStatePushed = true;
    }

    // Accessibility focus
    modalCloseBtn.focus();
  }

  function closeModal() {
    if (!modal) return;
    modalBackdrop.classList.remove('active');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');

    if (modalStatePushed && !closingFromPopstate) {
      modalStatePushed = false;
      // If opened via hash, replace the URL to clear the hash rather than navigating back
      // to the previous page (which could be personal.html etc.)
      if (openedFromHash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
        openedFromHash = false;
      } else {
        // Opened via click with pushState — pop that state
        openedFromHash = false;
        history.back();
      }
    } else {
      modalStatePushed = false;
      openedFromHash = false;
      closingFromPopstate = false;
    }

    currentCardId = null;

    if (previouslyFocusedEl && typeof previouslyFocusedEl.focus === 'function') {
      try {
        previouslyFocusedEl.focus();
      } catch (err) {}
      previouslyFocusedEl = null;
    }
  }

  function onDocClick(e) {
    // If the modal is open, its own stopPropagation on the modal element prevents this
    // from firing for clicks inside; backdrop has its own listener. Skip if active.
    if (modal && modal.classList.contains('active')) return;

    var readBtn = e.target.closest('.btn-read');
    if (readBtn) {
      e.preventDefault();
      var card = readBtn.closest('.project-card, .pub-card, .log-card');
      if (card) openModal(card, false);
      return;
    }

    var cardThumb = e.target.closest('.thumbnail-wrapper');
    if (cardThumb && !e.target.closest('.btn-ext')) {
      var card = cardThumb.closest('.project-card, .pub-card, .log-card');
      if (card) openModal(card, false);
    }
  }

  // Handle browser Back button closing the modal
  window.addEventListener('popstate', function () {
    if (modal && modal.classList.contains('active')) {
      closingFromPopstate = true;
      closeModal();
    }
  });

  function init() {
    createModal();

    // Only attach the delegated click listener ONCE — survives multiple SPA re-inits
    if (!clickListenerAttached) {
      document.addEventListener('click', onDocClick);
      clickListenerAttached = true;
    }

    // Check URL hash on load — open modal if the hash matches a card
    if (window.location.hash) {
      var targetId = window.location.hash.substring(1);
      var targetCard = document.getElementById(targetId);
      if (targetCard && targetCard.querySelector('.full-content')) {
        setTimeout(function () {
          openModal(targetCard, true);
        }, 150);
      }
    }
  }

  window.initModalReader = init;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
