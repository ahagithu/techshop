/**
 * Main application entry — registers routes and starts the router
 */
import { initRouter, registerRoute, navigate } from './router.js';
import { render as renderHome }    from './views/home.js';
import { render as renderAdmin }   from './views/admin.js';
import { render as renderContact } from './views/contact.js';
import { render as renderLogin }   from './views/login.js';

// Register all routes
registerRoute('/',          () => renderPage(renderHome));
registerRoute('/admin',     () => renderPage(renderAdmin));
registerRoute('/contact',   () => renderPage(renderContact));
registerRoute('/login',     () => renderPage(renderLogin));

// 404
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  // Keep nav always rendered
  ensureNav();
});

// Render a view into #app
async function renderPage(viewFn) {
  ensureNav();
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = '<div class="spinner-wrap" style="padding:80px"><div class="spinner"></div></div>';
    await viewFn(app);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Persistent nav (never re-rendered by route changes)
let _navRendered = false;
function ensureNav() {
  const existing = document.getElementById('mainNav');
  if (existing) return; // already rendered

  const nav = document.createElement('nav');
  nav.id = 'mainNav';
  nav.innerHTML = `
    <div class="nav-logo" onclick="window.__navLogo()">Tech<span>Shop</span></div>
    <div class="nav-actions" id="navActions" style="margin-left:auto;display:flex;align-items:center;gap:8px">
      <a href="/contact" data-link class="btn-nav ghost">Contact</a>
      <a href="/login" data-link class="btn-nav primary">Connexion</a>
    </div>
  `;
  document.body.insertBefore(nav, document.body.firstChild);

  // Footer
  const footer = document.createElement('footer');
  footer.innerHTML = `
    <p><strong>TechShop</strong> — Votre boutique electronique de confiance</p>
    <p style="margin-top:8px">
      <a href="https://wa.me/0600000000">WhatsApp</a> &nbsp;·&nbsp;
      <a href="mailto:contact@techshop.com">Email</a> &nbsp;·&nbsp;
      <a href="/contact" data-link>Contact</a>
    </p>
    <p style="margin-top:12px;opacity:.5;font-size:.78rem">© 2026 TechShop. Tous droits reserves.</p>
  `;
  document.body.appendChild(footer);

  // Toast container (persistent)
  if (!document.getElementById('toastContainer')) {
    const tc = document.createElement('div');
    tc.id = 'toastContainer';
    tc.className = 'toast-container';
    document.body.appendChild(tc);
  }

  // Scroll top
  if (!document.getElementById('scrollTopBtn')) {
    const st = document.createElement('button');
    st.id = 'scrollTopBtn';
    st.className = 'scroll-top';
    st.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>';
    st.onclick = () => window.scrollTo({ top:0, behavior:'smooth' });
    document.body.appendChild(st);
    window.addEventListener('scroll', () => {
      st.classList.toggle('visible', window.scrollY > 400);
    });
  }

  window.__navLogo = () => navigate('/');

  // Update nav on auth change
  import('./firebase.js').then(({ onAuthChange }) => {
    onAuthChange((user) => {
      const actions = document.getElementById('navActions');
      if (!actions) return;
      if (user) {
        actions.innerHTML = `
          <a href="/contact" data-link class="btn-nav ghost">Contact</a>
          <a href="/admin" data-link class="btn-nav ghost">🛠️ Dashboard</a>
          <button class="btn-nav danger" onclick="window.__navLogout()">Deconnexion</button>
        `;
        window.__navLogout = async () => {
          const { logout } = await import('./firebase.js');
          await logout();
          navigate('/');
        };
      } else {
        actions.innerHTML = `
          <a href="/contact" data-link class="btn-nav ghost">Contact</a>
          <a href="/login" data-link class="btn-nav primary">Connexion</a>
        `;
      }
    });
  });

  _navRendered = true;
}
