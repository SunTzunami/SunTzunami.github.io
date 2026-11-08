/* Reading Modal for Projects, Publications, and Lab Log */
(function () {
  'use strict';

  var modal = null;
  var modalBackdrop = null;
  var modalBody = null;
  var modalCloseBtn = null;
  var previouslyFocusedEl = null;

  function getFocusableElements(container) {
    if (!container) return [];
    var selectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    var els = Array.prototype.slice.call(container.querySelectorAll(selectors));
    return els.filter(function (el) {
      return !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true' && el.offsetParent !== null;
    });
  }

  function createModal() {
    if (document.getElementById('reading-modal')) return;

    modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'reading-modal-backdrop';
    modalBackdrop.className = 'reading-modal-backdrop';
    modalBackdrop.setAttribute('aria-hidden', 'true');

    modal = document.createElement('div');
    modal.id = 'reading-modal';
    modal.className = 'reading-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modalCloseBtn = document.createElement('button');
    modalCloseBtn.className = 'modal-close-btn';
    modalCloseBtn.setAttribute('aria-label', 'Close reading view');
    modalCloseBtn.innerHTML = '&times;';

    modalBody = document.createElement('div');
    modalBody.className = 'modal-body';

    modal.appendChild(modalCloseBtn);
    modal.appendChild(modalBody);

    document.body.appendChild(modalBackdrop);
    document.body.appendChild(modal);

    modalCloseBtn.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);

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

  function openModal(articleEl) {
    if (!articleEl) return;
    createModal();

    var fullContent = articleEl.querySelector('.full-content');
    if (!fullContent) return;

    previouslyFocusedEl = document.activeElement;

    // Clone content so original DOM remains untouched
    modalBody.innerHTML = fullContent.innerHTML;

    // Scroll modal to top
    modal.scrollTop = 0;

    // Activate modal
    modalBackdrop.classList.add('active');
    modal.classList.add('active');
    document.body.classList.add('modal-open');

    // Accessibility focus
    modalCloseBtn.focus();
  }

  function closeModal() {
    if (!modal) return;
    modalBackdrop.classList.remove('active');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');

    if (previouslyFocusedEl && typeof previouslyFocusedEl.focus === 'function') {
      try {
        previouslyFocusedEl.focus();
      } catch (err) {}
      previouslyFocusedEl = null;
    }
  }

  function init() {
    createModal();

    // Event delegation for card clicks & read buttons
    document.addEventListener('click', function (e) {
      var readBtn = e.target.closest('.btn-read');
      if (readBtn) {
        e.preventDefault();
        var card = readBtn.closest('.project-card, .pub-card, .log-card');
        if (card) openModal(card);
        return;
      }

      var cardThumb = e.target.closest('.thumbnail-wrapper');
      if (cardThumb && !e.target.closest('.btn-ext')) {
        var card = cardThumb.closest('.project-card, .pub-card, .log-card');
        if (card) {
          openModal(card);
        }
      }
    });

    // Check URL hash on load
    if (window.location.hash) {
      var targetId = window.location.hash.substring(1);
      var targetCard = document.getElementById(targetId);
      if (targetCard && targetCard.querySelector('.full-content')) {
        setTimeout(function () {
          openModal(targetCard);
        }, 150);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

