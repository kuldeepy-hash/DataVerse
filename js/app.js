/** Enhance the mobile menu without making navigation depend on JavaScript. */
export function initNavigation(root) {
  const toggle = root.querySelector('#nav-toggle');
  const nav = root.querySelector('#primary-nav');
  if (!toggle || !nav) return;
  const mobile = matchMedia('(max-width: 48rem)');
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  nav.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor || !mobile.matches) return;
    const target = root.getElementById(anchor.hash.slice(1));
    setOpen(false);
    target?.focus({ preventScroll: true });
  });
  mobile.addEventListener('change', () => {
    if (mobile.matches && nav.contains(root.activeElement)) toggle.focus();
    if (!mobile.matches && root.activeElement === toggle) nav.querySelector('a')?.focus();
    setOpen(false);
  });
  toggle.hidden = false;
  toggle.closest('.nav-shell').classList.add('nav-ready');
}

initNavigation(document);
// Optional visuals are loaded independently so a failure cannot break the menu.
const universe = document.querySelector('#universe');
if (universe) {
  import('./universe.js').then(({ initUniverse }) => initUniverse(universe)).catch(() => {
    document.documentElement.dataset.motion = 'paused';
  });
}
