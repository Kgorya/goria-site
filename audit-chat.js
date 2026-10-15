/* One illustrative conversation, played once when it enters view. */
(() => {
  const chat = document.querySelector('.audit-chat');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!chat || reducedMotion.matches || !('IntersectionObserver' in window)) return;

  let observer;
  let finishTimer;
  const finish = () => {
    clearTimeout(finishTimer);
    if (observer) observer.disconnect();
    delete chat.dataset.motion;
    reducedMotion.removeEventListener('change', finish);
  };

  try {
    observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      chat.dataset.motion = 'playing';
      finishTimer = setTimeout(finish, 6900);
    }, { threshold: 0.25 });
    chat.dataset.motion = 'waiting';
    reducedMotion.addEventListener('change', finish);
    observer.observe(chat);
  } catch {
    // The full conversation remains available if enhancement is unsupported.
    finish();
  }
})();
