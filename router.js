import { mountPage } from './page-effects.js';

const routes = new Map([
  ['/', 'work'],
  ['/about/', 'about'],
  ['/contact/', 'contact'],
]);
const aliases = new Map([
  ['/index.html', '/'],
  ['/about', '/about/'],
  ['/about.html', '/about/'],
  ['/about/index.html', '/about/'],
  ['/contact', '/contact/'],
  ['/contact.html', '/contact/'],
  ['/contact/index.html', '/contact/'],
]);
function normalize(value) {
  const url = new URL(value, location.href);
  url.pathname = aliases.get(url.pathname) || url.pathname;
  return url;
}

let currentURL = normalize(location.href);
let page = document.querySelector('main[data-page]');
// Cache pristine markup before effects can change the live document.
const cache = new Map([[currentURL.pathname, document.documentElement.outerHTML]]);
const drafts = new Map();
const snapshots = new Map();
let currentKey = history.state?.portfolioKey || crypto.randomUUID();
let cleanup = () => {};
let pending = null;
let sequence = 0;
let restoring = true;
let saveTimer = 0;
history.scrollRestoration = 'manual';
history.replaceState({ ...history.state, portfolioKey: currentKey }, '', currentURL);

function measureHeader() {
  const height = document.querySelector('.site-header').getBoundingClientRect().height;
  document.documentElement.style.setProperty('--header-height', `${height}px`);
}
measureHeader();
if ('ResizeObserver' in window)
  new ResizeObserver(measureHeader).observe(document.querySelector('.site-header'));
else window.addEventListener('resize', measureHeader, { passive: true });

function snapshot() {
  const fields = {};
  for (const field of page.querySelectorAll(
    '.contact-form input[name], .contact-form textarea[name]',
  )) {
    fields[field.name] = field.value;
  }
  return {
    scroll: { x: window.scrollX, y: window.scrollY },
    fields,
    posterScroll: page.querySelector('.poster-track')?.scrollLeft || 0,
    posterProgress: Number(page.querySelector('.poster-track')?.dataset.percentage) || 0,
  };
}
function persist() {
  if (currentURL.href !== location.href) return;
  clearTimeout(saveTimer);
  saveTimer = 0;
  const state = remember();
  history.replaceState(
    { ...history.state, portfolioKey: currentKey, portfolio: state },
    '',
    currentURL,
  );
}
function remember() {
  const state = snapshot();
  snapshots.set(currentKey, state);
  if (page.dataset.page === 'contact') drafts.set(currentURL.pathname, state.fields);
  return state;
}
function scheduleSave() {
  if (restoring || currentURL.href !== location.href) return;
  remember();
  clearTimeout(saveTimer);
  // Avoid repeated history writes while scrolling or typing (including Safari's limit).
  saveTimer = setTimeout(() => {
    saveTimer = 0;
    if (!restoring) persist();
  }, 500);
}
function restore(state, hash = '') {
  const fields = state?.fields || drafts.get(currentURL.pathname);
  if (fields)
    for (const field of page.querySelectorAll(
      '.contact-form input[name], .contact-form textarea[name]',
    )) {
      if (Object.hasOwn(fields, field.name)) field.value = fields[field.name];
    }
  const track = page.querySelector('.poster-track');
  if (track) {
    track.scrollLeft = state?.posterScroll || 0;
    track.dataset.percentage = String(state?.posterProgress || 0);
    track.dispatchEvent(new Event('portfolio:poster-restore'));
  }
  const position = state?.scroll;
  window.scrollTo({ left: position?.x || 0, top: position?.y || 0, behavior: 'instant' });
  if (!position && hash) {
    let id;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      return;
    }
    const target = document.getElementById(id);
    target?.scrollIntoView({ behavior: 'instant' });
    if (id === 'page-content') target?.focus({ preventScroll: true });
  }
}
function updateNavigation() {
  for (const link of document.querySelectorAll('.site-nav a')) {
    if (normalize(link.href).pathname === currentURL.pathname)
      link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}
function updateMetadata(nextDocument) {
  document.title = nextDocument.title;
  for (const selector of [
    'meta[name="description"]',
    'link[rel="canonical"]',
    'meta[property="og:title"]',
    'meta[property="og:description"]',
    'meta[property="og:url"]',
  ]) {
    document.head.querySelector(selector)?.remove();
    const element = nextDocument.head.querySelector(selector);
    if (element) document.head.append(element.cloneNode(true));
  }
}
async function loadStyles(nextDocument, signal) {
  const href = nextDocument.querySelector('[data-page-style]')?.getAttribute('href');
  if (!href) throw new Error('Missing page stylesheet');
  const existing = document.querySelector('[data-page-style]:not([media="print"])');
  if (existing?.getAttribute('href') === href) return existing;
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = href;
  stylesheet.media = 'print';
  stylesheet.setAttribute('data-page-style', '');
  await new Promise((resolve, reject) => {
    const dispose = () => {
      stylesheet.onload = null;
      stylesheet.onerror = null;
      signal.removeEventListener('abort', abort);
    };
    const abort = () => {
      dispose();
      stylesheet.remove();
      reject(new DOMException('Navigation cancelled', 'AbortError'));
    };
    stylesheet.onload = () => {
      dispose();
      resolve();
    };
    stylesheet.onerror = () => {
      dispose();
      stylesheet.remove();
      reject(new Error('Cannot load page stylesheet'));
    };
    if (signal.aborted) {
      abort();
      return;
    }
    signal.addEventListener('abort', abort, { once: true });
    document.head.append(stylesheet);
  });
  return stylesheet;
}

async function navigate(value, { pop = false, state = null } = {}) {
  const destination = normalize(value);
  const navigation = ++sequence;
  pending?.abort();
  pending = new AbortController();
  const { signal } = pending;
  restoring = true;
  document.documentElement.setAttribute('aria-busy', 'true');
  let nextStyles = null;
  const destinationKey = pop ? state?.portfolioKey || crypto.randomUUID() : crypto.randomUUID();
  try {
    // Fragment/history changes keep the current form and DOM alive.
    if (destination.pathname === currentURL.pathname && destination.search === currentURL.search) {
      if (!pop) {
        persist();
        history.pushState({ portfolioKey: destinationKey }, '', destination);
      }
      currentURL = destination;
      currentKey = destinationKey;
      restore(pop ? snapshots.get(currentKey) || state?.portfolio : null, destination.hash);
      return;
    }
    let html = cache.get(destination.pathname);
    if (!html) {
      const response = await fetch(destination.pathname, { signal });
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html'))
        throw new Error('Cannot load route');
      html = await response.text();
      cache.set(destination.pathname, html);
    }
    if (signal.aborted) return;
    const nextDocument = new DOMParser().parseFromString(html, 'text/html');
    const source = nextDocument.querySelector('main[data-page]');
    if (source?.dataset.page !== routes.get(destination.pathname)) throw new Error('Invalid route');
    const nextPage = document.importNode(source, true);
    nextPage
      .querySelectorAll('[data-reveal-pending]')
      .forEach((element) => element.removeAttribute('data-reveal-pending'));
    nextStyles = await loadStyles(nextDocument, signal);
    if (signal.aborted) {
      if (nextStyles.media === 'print') nextStyles.remove();
      return;
    }
    if (!pop) {
      persist();
      history.pushState({ portfolioKey: destinationKey }, '', destination);
    }
    cleanup();
    nextStyles.media = 'all';
    page.replaceWith(nextPage);
    page = nextPage;
    document.querySelectorAll('[data-page-style]').forEach((style) => {
      if (style !== nextStyles) style.remove();
    });
    currentURL = destination;
    currentKey = destinationKey;
    document.body.dataset.page = page.dataset.page;
    updateMetadata(nextDocument);
    updateNavigation();
    page.focus({ preventScroll: true });
    restore(pop ? snapshots.get(currentKey) || state?.portfolio : null, destination.hash);
    cleanup = mountPage(page);
    document.dispatchEvent(
      new CustomEvent('portfolio:navigated', { detail: { path: destination.pathname } }),
    );
  } catch (error) {
    if (signal.aborted) return;
    if (nextStyles?.media === 'print') nextStyles.remove();
    if (pop) location.replace(destination);
    else location.assign(destination);
  } finally {
    if (navigation === sequence) {
      restoring = false;
      document.documentElement.removeAttribute('aria-busy');
      persist();
    }
  }
}

// Wait for local fonts before restoring geometry; links retain their native fallback meanwhile.
await document.fonts.ready;
measureHeader();
restore(history.state?.portfolio, currentURL.hash);
cleanup = mountPage(page);
updateNavigation();
restoring = false;
persist();

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (
    !link ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  if (
    link.hasAttribute('download') ||
    (link.target && link.target !== '_self') ||
    link.relList.contains('external')
  )
    return;
  const destination = normalize(link.href);
  if (destination.origin !== location.origin || !routes.has(destination.pathname)) return;
  event.preventDefault();
  if (destination.href === currentURL.href) {
    ++sequence;
    pending?.abort();
    restoring = false;
    document.documentElement.removeAttribute('aria-busy');
    restore(null, destination.hash);
    persist();
    return;
  }
  void navigate(destination);
});
window.addEventListener('popstate', (event) => {
  const destination = normalize(location.href);
  if (!routes.has(destination.pathname)) {
    location.reload();
    return;
  }
  void navigate(destination, { pop: true, state: event.state });
});
window.addEventListener('hashchange', () => {
  currentURL = normalize(location.href);
  scheduleSave();
});
document.addEventListener('scroll', scheduleSave, { capture: true, passive: true });
document.addEventListener('portfolio:poster-change', scheduleSave);
document.addEventListener('input', (event) => {
  if (event.target.closest('.contact-form')) scheduleSave();
});
document.addEventListener('portfolio:form-reset', persist);
window.addEventListener('pagehide', persist);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) persist();
});
