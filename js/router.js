/**
 * Simple client-side router using History API
 * Routes: /, /admin, /contact
 */
const _routes = {};
let _notFoundHandler = null;

export function registerRoute(path, handler) {
  _routes[path] = handler;
}

export function setNotFound(handler) {
  _notFoundHandler = handler;
}

export function navigate(path) {
  history.pushState(null, '', path);
  resolveRoute();
}

export async function resolveRoute() {
  const pathname = location.pathname;

  if (_routes[pathname]) {
    await _routes[pathname]();
    return;
  }
  // 404
  if (_notFoundHandler) {
    await _notFoundHandler();
  } else {
    document.getElementById('app').innerHTML = `
      <div style="text-align:center;padding:80px 24px">
        <h1 style="font-size:4rem;margin-bottom:16px">404</h1>
        <p style="color:var(--text-secondary);margin-bottom:24px">Page introuvable.</p>
        <a href="/" style="color:var(--primary)">Retour a l'accueil</a>
      </div>
    `;
  }
}

export function initRouter() {
  window.addEventListener('popstate', resolveRoute);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-link]');
    if (a) { e.preventDefault(); navigate(a.getAttribute('href')); }
  });
  resolveRoute();
}
