/**
 * Account page — for logged-in users to view orders & wishlist
 */
import {
  getCurrentUser, logout, isAdmin, showToast,
  getMyOrders, getWishlist, removeFromWishlist,
  CFG, fmt, esc
} from '../firebase.js';
import { navigate } from '../router.js';
import { stockInfo } from './components.js';

let _orders = [];
let _wishlist = [];

export async function render(container) {
  const user = getCurrentUser();
  
  if (!user) {
    container.innerHTML = `
      <div style="max-width:400px;margin:80px auto;padding:0 24px;text-align:center">
        <h2 style="margin-bottom:12px">Connexion requise</h2>
        <p style="color:var(--text-secondary);margin-bottom:24px">Veuillez vous connecter pour voir votre compte.</p>
        <button class="btn-login" onclick="window.__goLogin()">Se connecter</button>
      </div>
    `;
    window.__goLogin = () => navigate('/login');
    return;
  }

  const admin = await isAdmin();

  container.innerHTML = `
    <div style="max-width:900px;margin:0 auto;padding:40px 24px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;flex-wrap:wrap;gap:16px">
        <div>
          <h1 style="font-size:1.8rem;font-weight:700">👤 Mon Compte</h1>
          <p style="color:var(--text-secondary);margin-top:4px">${esc(user.email)}</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${admin ? '<a href="/admin" data-link class="btn-nav primary">⚙️ Dashboard Admin</a>' : ''}
          <button class="btn-nav danger" onclick="window.__accountLogout()">Deconnexion</button>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:4px;margin-bottom:24px;background:var(--surface2);padding:4px;border-radius:var(--radius);width:fit-content;border:1px solid var(--border)">
        <button class="admin-tab active" id="tab-orders-account" onclick="window.__switchAccountTab('orders')">📦 Mes Commandes</button>
        <button class="admin-tab" id="tab-wishlist-account" onclick="window.__switchAccountTab('wishlist')">❤️ Ma Wishlist <span id="wishlistCount" style="background:var(--accent);color:white;padding:1px 6px;border-radius:10px;font-size:.72rem;margin-left:4px;display:none"></span></button>
      </div>

      <!-- Orders Panel -->
      <div id="panel-orders-account">
        <div style="background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);border:1px solid var(--border);overflow:hidden">
          <h2 style="font-size:1.1rem;font-weight:700;padding:20px 24px;border-bottom:1px solid var(--border)">📦 Mes Commandes</h2>
          <div id="ordersAccountList">${buildSpinner()}</div>
        </div>
      </div>

      <!-- Wishlist Panel -->
      <div id="panel-wishlist-account" style="display:none">
        <div style="background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);border:1px solid var(--border);overflow:hidden">
          <h2 style="font-size:1.1rem;font-weight:700;padding:20px 24px;border-bottom:1px solid var(--border)">❤️ Ma Wishlist</h2>
          <div id="wishlistAccountList">${buildSpinner()}</div>
        </div>
      </div>
    </div>
  `;

  window.__accountLogout = handleLogout;
  window.__switchAccountTab = switchAccountTab;

  await Promise.all([loadOrders(), loadWishlist()]);
}

async function loadOrders() {
  try {
    _orders = await getMyOrders();
    renderOrders();
  } catch {
    document.getElementById('ordersAccountList').innerHTML = '<div style="padding:24px;color:var(--danger);text-align:center">Erreur chargement.</div>';
  }
}

function renderOrders() {
  const el = document.getElementById('ordersAccountList');
  
  if (!_orders.length) {
    el.innerHTML = `
      <div style="padding:60px 24px;text-align:center">
        <div style="font-size:4rem;margin-bottom:16px">📦</div>
        <h3 style="margin-bottom:8px">Aucune commande</h3>
        <p style="color:var(--text-secondary)">Vos commandes apparaitront ici.</p>
      </div>
    `;
    return;
  }

  const statusColor = {
    pending  : { bg:'#fff4e0', color:'#a05c00' },
    confirmed: { bg:'#e8f4fd', color:'#0055b3' },
    shipped  : { bg:'#e8f1fd', color:'#0071e3' },
    delivered: { bg:'#e6f9ef', color:'#0a7c3c' },
    cancelled: { bg:'#ffe5e5', color:'#b00020' },
  };
  const statusLabels = {
    pending  : 'En attente', confirmed : 'Confirmée',
    shipped  : 'Expédiée',   delivered : 'Livrée', cancelled : 'Annulée'
  };

  el.innerHTML = _orders.map(o => {
    const sc = statusColor[o.status] || { bg:'#f5f5f7', color:'#6e6e73' };
    const date = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleString('fr-FR') : '—';
    return `
      <div style="padding:20px 24px;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap">
          ${o.productImg
            ? `<div style="width:64px;height:64px;border-radius:8px;background:var(--surface2);overflow:hidden;flex-shrink:0"><img src="${esc(o.productImg)}" style="width:100%;height:100%;object-fit:contain;padding:4px" /></div>`
            : `<div style="width:64px;height:64px;border-radius:8px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:2rem;flex-shrink:0">📦</div>`
          }
          <div style="flex:1;min-width:180px">
            <div style="font-weight:700;margin-bottom:4px">${esc(o.productName||'')}</div>
            <div style="font-size:.82rem;color:var(--text-secondary)">
              <div>Quantité : ${o.quantity}</div>
              <div>Total : ${fmt(o.total)}</div>
            </div>
          </div>
          <div style="text-align:right">
            <div style="padding:4px 12px;border-radius:20px;font-size:.78rem;font-weight:600;background:${sc.bg};color:${sc.color};display:inline-block">
              ${statusLabels[o.status] || o.status}
            </div>
            <div style="font-size:.75rem;color:var(--text-light);margin-top:4px">${date}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadWishlist() {
  try {
    _wishlist = await getWishlist();
    renderWishlist();
    
    if (_wishlist.length > 0) {
      const badge = document.getElementById('wishlistCount');
      badge.textContent = _wishlist.length;
      badge.style.display = 'inline';
    }
  } catch {
    document.getElementById('wishlistAccountList').innerHTML = '<div style="padding:24px;color:var(--danger);text-align:center">Erreur chargement.</div>';
  }
}

function renderWishlist() {
  const el = document.getElementById('wishlistAccountList');
  
  if (!_wishlist.length) {
    el.innerHTML = `
      <div style="padding:60px 24px;text-align:center">
        <div style="font-size:4rem;margin-bottom:16px">❤️</div>
        <h3 style="margin-bottom:8px">Wishlist vide</h3>
        <p style="color:var(--text-secondary)">Ajoutez des produits à votre wishlist !</p>
      </div>
    `;
    return;
  }

  el.innerHTML = _wishlist.map(item => {
    const si = stockInfo(item.stock ?? 0);
    return `
      <div style="padding:16px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <div style="width:60px;height:60px;border-radius:var(--radius-sm);background:var(--surface2);overflow:hidden;flex-shrink:0">
          ${item.image
            ? `<img src="${esc(item.image)}" style="width:100%;height:100%;object-fit:contain;padding:4px" />`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.5rem">${item.emoji||'📦'}</div>`
          }
        </div>
        <div style="flex:1;min-width:150px">
          <div style="font-weight:600">${esc(item.name||'')}</div>
          <div style="font-size:.78rem;color:var(--text-secondary)">${fmt(item.price||0)}</div>
        </div>
        <span class="stock-indicator ${si.cls}" style="font-size:.78rem">${si.label}</span>
        <button onclick="window.__removeFromWishlist('${item.id}')" style="padding:6px 12px;border:1.5px solid var(--danger);color:var(--danger);background:transparent;border-radius:var(--radius-sm);font-size:.78rem;font-weight:600;cursor:pointer">
          Retirer
        </button>
      </div>
    `;
  }).join('');
}

window.__removeFromWishlist = async function(productId) {
  await removeFromWishlist(productId);
  showToast('Retiré de la wishlist.', 'success');
  await loadWishlist();
};

function switchAccountTab(tab) {
  document.getElementById('tab-orders-account').classList.toggle('active', tab === 'orders');
  document.getElementById('tab-wishlist-account').classList.toggle('active', tab === 'wishlist');
  document.getElementById('panel-orders-account').style.display = tab === 'orders' ? '' : 'none';
  document.getElementById('panel-wishlist-account').style.display = tab === 'wishlist' ? '' : 'none';
}

async function handleLogout() {
  await logout();
  showToast('Déconnecté.', 'default');
  navigate('/');
}

function buildSpinner() {
  return '<div class="spinner-wrap" style="padding:60px"><div class="spinner"></div></div>';
}
