/**
 * Simple client-side router using History API
 * Routes: /, /admin, /contact
 */
const _routes = {};
let _notFoundHandler = null;

// Detect base path for GitHub Pages (repository name in URL)
// This is set at runtime based on where the app is hosted
let _basePath = null;

function detectBasePath() {
  // Check for a global variable set in index.html
  if (window.__BASE_PATH__) {
    return window.__BASE_PATH__;
  }
  
  // Auto-detect from current URL
  // For GitHub Pages project sites: username.github.io/repo-name/
  // The key is that index.html is at the root, and we need to figure out
  // what part of the URL is the "base" vs the "route"
  
  const path = location.pathname;
  const segments = path.split('/').filter(Boolean);
  
  // If we're at the root (no segments), base is /
  if (segments.length === 0) {
    return '/';
  }
  
  // Check if first segment looks like a repo name (not a route)
  const knownRoutes = ['admin', 'contact', 'login', 'account'];
  const firstSegment = segments[0];
  
  // If first segment is a known route, we're at root
  if (knownRoutes.includes(firstSegment)) {
    return '/';
  }
  
  // Otherwise, first segment is likely the repo name
  // But we need to be smarter: check if we're in a sub-path of the repo
  if (segments.length >= 1) {
    // Return the first segment as base
    return '/' + firstSegment + '/';
  }
  
  return '/';
}

function getBasePath() {
  if (_basePath === null) {
    _basePath = detectBasePath();
    console.log('[Router] Detected base path:', _basePath);
  }
  return _basePath;
}

// Get the current route path (without base path)
function getRoutePath() {
  const basePath = getBasePath();
  const pathname = location.pathname;
  
  console.log('[Router Debug] basePath:', basePath, '| pathname:', pathname);
  
  if (basePath !== '/' && pathname.startsWith(basePath)) {
    let route = pathname.slice(basePath.length);
    // Ensure route starts with /
    if (!route.startsWith('/')) {
      route = '/' + route;
    }
    // Remove trailing slash for consistency, except for root
    if (route.length > 1 && route.endsWith('/')) {
      route = route.slice(0, -1);
    }
    return route || '/';
  }
  
  // For root path, just return pathname as-is but normalized
  let route = pathname;
  if (route.length > 1 && route.endsWith('/')) {
    route = route.slice(0, -1);
  }
  return route || '/';
}

export function registerRoute(path, handler) {
  _routes[path] = handler;
}

export function setNotFound(handler) {
  _notFoundHandler = handler;
}

export function navigate(path) {
  const basePath = getBasePath();
  const fullPath = basePath === '/' ? path : basePath + path.replace(/^\//, '');
  history.pushState(null, '', fullPath);
  resolveRoute();
}

export async function resolveRoute() {
  let pathname = getRoutePath();
  
  // Debug logging
  console.log('[Router] pathname:', pathname, '| location.pathname:', location.pathname);
  console.log('[Router] Available routes:', Object.keys(_routes));
  
  // Handle empty path or trailing slash as home
  if (pathname === '' || pathname === '/') {
    pathname = '/';
  }

  if (_routes[pathname]) {
    console.log('[Router] Found route for:', pathname);
    await _routes[pathname]();
    return;
  }
  
  console.log('[Router] No route found for:', pathname);
  
  // 404
  if (_notFoundHandler) {
    await _notFoundHandler();
  } else {
    document.getElementById('app').innerHTML = `
      <div style="text-align:center;padding:80px 24px">
        <h1 style="font-size:4rem;margin-bottom:16px">404</h1>
        <p style="color:var(--text-secondary);margin-bottom:24px">Page introuvable: ${pathname}</p>
        <a href="/" data-link style="color:var(--primary)">Retour a l'accueil</a>
      </div>
    `;
  }
}

export function initRouter() {
  window.addEventListener('popstate', resolveRoute);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-link]');
    if (a) { 
      e.preventDefault(); 
      const href = a.getAttribute('href');
      navigate(href);
    }
  });
  resolveRoute();
}
