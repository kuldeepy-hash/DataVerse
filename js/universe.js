/** Optional decorative layer. Future WebGL can mount inside data-universe-art.
 * Keep HTML destinations outside that layer and honor this lifecycle/pause policy.
 */
export function initUniverse(container) {
  const doc = container.ownerDocument;
  const button = container.querySelector('[data-motion-toggle]');
  const status = container.querySelector('[data-motion-status]');
  if (!button || !status) return { destroy() {} };
  const preference = doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = false;
  const update = () => {
    doc.documentElement.dataset.motion = preference.matches || userPaused || doc.hidden ? 'paused' : 'running';
    button.disabled = preference.matches;
    button.setAttribute('aria-pressed', String(userPaused));
    status.textContent = preference.matches ? 'Motion reduced by system preference' : userPaused ? 'Motion paused' : '';
  };
  const toggle = () => {
    if (preference.matches) return;
    userPaused = !userPaused;
    update();
  };
  button.addEventListener('click', toggle);
  preference.addEventListener('change', update);
  doc.addEventListener('visibilitychange', update);
  update();
  button.hidden = false;
  return {
    destroy() {
      button.removeEventListener('click', toggle);
      preference.removeEventListener('change', update);
      doc.removeEventListener('visibilitychange', update);
      doc.documentElement.dataset.motion = 'paused';
      button.hidden = true;
      status.textContent = '';
    }
  };
}
