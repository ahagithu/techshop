/**
 * Main application entry — registers routes and starts the router
 */
import { initRouter, registerRoute, navigate } from './router.js';
import { render as renderHome }    from './views/home.js';
import { render as renderAdmin }   from './views/admin.js';
import { render as renderContact } from './views/contact.js';
import { render as renderLogin }   from './views/login.js';
import { render as renderAccount } from './views/account.js';

// Register all routes
registerRoute('/',          () => renderPage(renderHome));
registerRoute('/admin',     () => renderPage(renderAdmin));
registerRoute('/contact',   () => renderPage(renderContact));
registerRoute('/login',     () => renderPage(renderLogin));
registerRoute('/account',   () => renderPage(renderAccount));

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
    app.innerHTML = '<div class="spinner-wrap" style="padding:80px"><div class="spinner"></div><p id="fb-status" style="margin-top:16px;color:#888;font-size:.85rem">Connexion Firebase...</p></div>';
    try {
      await viewFn(app);
    } catch (err) {
      app.innerHTML = `
        <div style="padding:40px 24px;max-width:600px;margin:0 auto;text-align:center">
          <h2 style="color:#d32f2f">Erreur de chargement</h2>
          <pre style="background:#f5f5f5;padding:16px;border-radius:8px;text-align:left;font-size:.8rem;overflow:auto;margin-top:16px">${err.message || err}</pre>
          <p style="margin-top:16px;color:#666;font-size:.9rem">
            Verifiez que les services Firebase sont actives dans la
            <a href="https://console.firebase.google.com/project/techshop-f4bf7/overview" target="_blank">Firebase Console</a>
            (Firestore, Authentication, Storage).
          </p>
        </div>
      `;
      console.error('[TechShop]', err);
    }
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
    onAuthChange(async (user) => {
      const actions = document.getElementById('navActions');
      if (!actions) return;
      if (user) {
        // Check if user is admin
        const { isAdmin } = await import('./firebase.js');
        const admin = await isAdmin();
        
        actions.innerHTML = `
          <a href="/contact" data-link class="btn-nav ghost">Contact</a>
          <a href="/account" data-link class="btn-nav ghost">👤 Mon Compte</a>
          ${admin ? '<a href="/admin" data-link class="btn-nav primary">⚙️ Admin</a>' : ''}
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
