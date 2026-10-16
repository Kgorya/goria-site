// Native details remain usable without JavaScript. Animate both directions when available.
(function () {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.dental-questions details').forEach(function (item) {
    const summary = item.querySelector('summary');
    let animation = null;
    let expanded = item.open;
    summary.addEventListener('click', function (event) {
      if (reducedMotion.matches || typeof item.animate !== 'function') return;
      event.preventDefault();
      const from = item.getBoundingClientRect().height;
      expanded = !expanded;
      if (animation) animation.cancel();
      item.style.height = '';
      item.open = true;
      const to = expanded ? item.getBoundingClientRect().height : summary.getBoundingClientRect().height + 1;
      item.style.overflow = 'hidden';
      animation = item.animate([{height: from + 'px'}, {height: to + 'px'}], {
        duration: 280, easing: 'cubic-bezier(.22, 1, .36, 1)'
      });
      animation.onfinish = function () {
        item.open = expanded;
        item.style.overflow = '';
        animation = null;
      };
    });
  });
})();

(function () {
  'use strict';

  const modal = document.querySelector('.dental-modal');
  if (!modal || typeof modal.showModal !== 'function') return;

  const content = modal.querySelector('.dental-modal-content');
  const heading = modal.querySelector('#dental-modal-title');
  const meta = modal.querySelector('#dental-modal-meta');
  const closeButton = modal.querySelector('.dental-modal-close');
  let trigger = null;
  let previousOverflow = '';
  let locked = false;

  function open(source, title, channelText, htmlContent) {
    trigger = source;
    if (heading) heading.textContent = title;
    if (meta) meta.textContent = channelText || '';
    if (content) content.innerHTML = htmlContent;

    previousOverflow = document.body.style.overflow;
    locked = true;
    document.body.style.overflow = 'hidden';

    modal.showModal();
    if (content) content.scrollTop = 0;
    if (closeButton) closeButton.focus();
  }

  function restore() {
    if (!locked) return;
    locked = false;
    document.body.style.overflow = previousOverflow;
    if (content) content.replaceChildren();
    if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
  }

  function close() {
    if (modal.open) modal.close();
    restore();
  }

  modal.addEventListener('cancel', function (event) {
    event.preventDefault();
    close();
  });

  // Attach to scenario buttons
  document.addEventListener('click', function (event) {
    const btn = event.target.closest('.dental-full-chat-btn');
    if (btn) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const img = document.createElement('img');
      img.src = btn.href;
      img.alt = btn.dataset.dialogTitle + '. Скриншот переписки у демо.';
      img.className = 'dental-dialog-image';
      open(btn, btn.dataset.dialogTitle, '', '');
      content.replaceChildren(img);
      return;
    }

    const reportTrigger = event.target.closest('[data-report-open]');
    if (reportTrigger) {
      event.preventDefault();
      const reportElement = document.querySelector('.dental-report');
      if (reportElement) {
        open(reportTrigger, 'Приклад нічного звіту керівнику', '', reportElement.outerHTML);
      }
      return;
    }
  });

  if (closeButton) {
    closeButton.addEventListener('click', close);
  }

  modal.addEventListener('click', function (event) {
    const box = modal.querySelector('.dental-modal-box');
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const isInBox = (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
    if (!isInBox) {
      close();
    }
  });

  modal.addEventListener('close', restore);
})();
