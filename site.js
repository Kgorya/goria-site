(() => {
  const button = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#mobile-nav');
  if (button && nav) {
    nav.hidden = true;
    button.hidden = false;
    const setOpen = open => {
      button.setAttribute('aria-expanded', String(open));
      nav.hidden = !open;
    };
    button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', event => { if (event.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        setOpen(false); button.focus();
      }
    });
    document.addEventListener('click', event => { if (!event.target.closest('.site-header')) setOpen(false); });
    matchMedia('(min-width: 768px)').addEventListener('change', () => setOpen(false));
  }

  const dialog = document.querySelector('#contact-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  let trigger = null;
  const testLink = document.querySelector('#dialog-test');
  const emailLink = document.querySelector('#dialog-email');
  document.querySelectorAll('[data-contact]').forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      event.preventDefault();
      trigger = link;
      const topic = link.dataset.topic || 'Моя задача для бізнесу';
      emailLink.href = `mailto:kostya.gorya@gmail.com?subject=${encodeURIComponent(topic)}`;
      document.querySelector('#contact-dialog-title').textContent = topic;
      dialog.showModal();
      testLink.focus();
    });
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { if (trigger) trigger.focus(); });
})();
