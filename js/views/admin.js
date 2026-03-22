/**
 * Admin Dashboard view — protected, only at /admin
 */
import {
  getAdminStats, getAllProducts, getCategories, getOrders,
  addProduct, updateProduct, deleteProduct,
  addCategory, updateCategory, deleteCategory,
  updateOrderStatus, deleteOrder,
  isLoggedIn, logout, changePassword, CFG, showToast
} from '../firebase.js';
import { navigate } from '../router.js';
import { stockInfo, fmt, esc } from './components.js';

let _categories   = [];
let _editingProdId = null;

export async function render(container) {
  if (!isLoggedIn()) {
    container.innerHTML = `
      <div style="max-width:400px;margin:80px auto;padding:0 24px;text-align:center">
        <h2 style="margin-bottom:12px">Acces reserve</h2>
        <p style="color:var(--text-secondary);margin-bottom:24px">Vous devez vous connecter pour acceder au dashboard.</p>
        <button class="btn-login" onclick="window.__goLogin()">Se connecter</button>
      </div>
    `;
    window.__goLogin = () => navigate('/login');
    return;
  }

  _categories = await getCategories();
  const user = (await import('../firebase.js')).getCurrentUser();

  container.innerHTML = `
    <div class="admin-wrapper">
      <div class="admin-header">
        <div>
          <h1>🛠️ Dashboard Admin</h1>
          <p>Connecte : ${esc(user?.email||'')}</p>
        </div>
        <div class="admin-header-actions">
          <a href="/" data-link class="btn-nav ghost">← Boutique</a>
          <button class="btn-nav danger" onclick="window.__adminLogout()">Deconnexion</button>
        </div>
      </div>

      <!-- Firebase Status -->
      <div class="fb-status ok" style="margin-bottom:20px">
        <div class="fb-status-dot"></div>
        🔥 Firebase Connecte — Firestore &amp; Auth
      </div>

      <div class="admin-stats" id="adminStats">${buildSpinner()}</div>

      <!-- Tabs -->
      <div class="admin-tabs">
        <button class="admin-tab active" id="tab-products"   onclick="window.__switchTab('products')">📦 Produits</button>
        <button class="admin-tab"        id="tab-categories"  onclick="window.__switchTab('categories')">🏷️ Categories</button>
        <button class="admin-tab"        id="tab-orders"     onclick="window.__switchTab('orders')">📋 Commandes <span id="orderBadge" style="background:var(--danger);color:white;padding:1px 6px;border-radius:10px;font-size:.72rem;margin-left:4px;display:none"></span></button>
      </div>

      <!-- TAB: Products -->
      <div id="panel-products">
        <div class="admin-panel">
          <div class="admin-form-card">
            <h2 id="prodFormTitle">➕ Ajouter un produit</h2>
            <input type="hidden" id="editProdId" />

            <div class="form-group">
              <label>Nom *</label>
              <input type="text" id="p-name" placeholder="ex: iPhone 15 Pro" />
            </div>
            <div class="form-group">
              <label>Categorie *</label>
              <select id="p-cat"><option value="">Selectionner…</option></select>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea id="p-desc" placeholder="Decrivez le produit…" rows="2"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Prix (MAD) *</label><input type="number" id="p-price" placeholder="0" min="0" step="0.01" /></div>
              <div class="form-group"><label>Ancien prix</label><input type="number" id="p-old-price" placeholder="0" min="0" step="0.01" /></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Stock *</label><input type="number" id="p-stock" placeholder="0" min="0" /></div>
              <div class="form-group"><label>Emoji</label><input type="text" id="p-emoji" placeholder="📱" maxlength="2" /></div>
            </div>

            <!-- Image URL -->
            <div class="form-group">
              <label>URL de l'image</label>
              <input type="url" id="p-img-url" placeholder="https://raw.githubusercontent.com/ahagithu/techshop/main/images/produit.jpg" oninput="window.__previewImg()" />
              <div id="imgPreview" style="display:none;margin-top:8px;height:120px;border-radius:8px;border:1.5px solid var(--border);overflow:hidden;background:var(--surface2)">
                <img id="imgPreviewSrc" style="width:100%;height:100%;object-fit:contain;padding:8px" />
              </div>
              <p style="font-size:.75rem;color:var(--text-secondary);margin-top:6px">
                💡 Uploadez vos images sur GitHub → <code>images/</code> puis collez l'URL ici.
              </p>
            </div>

            <div class="form-group">
              <label>Badge</label>
              <select id="p-badge">
                <option value="">Aucun</option>
                <option value="new">Nouveau</option>
                <option value="promo">Promo</option>
                <option value="hot">Populaire</option>
              </select>
            </div>

            <div class="admin-form-actions">
              <button class="btn-save" id="prodSaveBtn" onclick="window.__saveProduct()">💾 Enregistrer</button>
              <button class="btn-cancel-form" id="prodCancelBtn" onclick="window.__resetProductForm()" style="display:none">Annuler</button>
            </div>

            <!-- Change Password -->
            <div class="change-pass-section" style="margin-top:24px">
              <h3>🔑 Changer le mot de passe</h3>
              <div class="form-group" style="margin-bottom:10px"><label>Mot de passe actuel</label><input type="password" id="cp-current" placeholder="••••••" /></div>
              <div class="form-row">
                <div class="form-group" style="margin-bottom:0"><label>Nouveau</label><input type="password" id="cp-new" placeholder="6+ caracteres" /></div>
                <div class="form-group" style="margin-bottom:0"><label>Confirmer</label><input type="password" id="cp-confirm" placeholder="••••••" /></div>
              </div>
              <button class="btn-save" style="margin-top:12px" onclick="window.__changePass()">Mettre a jour</button>
            </div>
          </div>

          <div class="admin-products-list">
            <h2>📦 Produits <span id="prodCount" style="font-size:.9rem;color:var(--text-secondary);font-weight:400"></span></h2>
            <div id="adminProductsList">${buildSpinner()}</div>
          </div>
        </div>
      </div>

      <!-- TAB: Categories -->
      <div id="panel-categories" style="display:none">
        <div class="categories-panel">
          <div class="cat-form-card">
            <h2>🏷️ Nouvelle categorie</h2>
            <div class="form-group"><label>Nom</label><input type="text" id="cat-name-input" placeholder="ex: Smartphones" /></div>
            <div class="form-group"><label>Emoji</label><input type="text" id="cat-emoji-input" placeholder="📱" maxlength="2" /></div>
            <button class="btn-save" onclick="window.__addCat()">➕ Ajouter</button>
          </div>
          <div class="cat-list-card">
            <h2>🏷️ Categories</h2>
            <div id="catListBody">${buildSpinner()}</div>
          </div>
        </div>
      </div>

      <!-- TAB: Orders -->
      <div id="panel-orders" style="display:none">
        <div class="admin-products-list">
          <h2>📋 Commandes recues</h2>
          <div style="padding:12px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <select id="orderFilterStatus" onchange="window.__filterOrders()" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.875rem">
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmees</option>
              <option value="shipped">Expediees</option>
              <option value="delivered">Livrees</option>
              <option value="cancelled">Annulees</option>
            </select>
          </div>
          <div id="ordersList">${buildSpinner()}</div>
        </div>
      </div>
    </div>
  `;

  // Bind globals
  window.__adminLogout = handleLogout;
  window.__switchTab = switchTab;
  window.__saveProduct = saveProduct;
  window.__resetProductForm = resetProductForm;
  window.__changePass = handleChangePass;
  window.__addCat = handleAddCat;
  window.__filterOrders = filterOrders;
  window.__setOrderStatus = setOrderStatus;
  window.__deleteOrder = handleDeleteOrder;
  window.__editCat = editCat;
  window.__saveCatEdit = saveCatEdit;
  window.__deleteCat = handleDeleteCat;
  window.__cancelCatEdit = cancelCatEdit;

  await Promise.all([loadStats(), loadProducts(), loadCategories(), loadOrders()]);
}

// ── Stats ──────────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const d = await getAdminStats();
    document.getElementById('adminStats').innerHTML = `
      <div class="admin-stat"><div class="label">Total produits</div><div class="value">${d.total}</div></div>
      <div class="admin-stat"><div class="label">En stock</div><div class="value" style="color:var(--success)">${d.inStock}</div></div>
      <div class="admin-stat"><div class="label">Ruptures</div><div class="value" style="color:var(--danger)">${d.outStock}</div></div>
      <div class="admin-stat"><div class="label">Commandes</div><div class="value">${d.orderCount}</div><div class="sub">CA : ${fmt(d.revenue)}</div></div>
    `;
    // Badge
    if (d.orderCount > 0) {
      const badge = document.getElementById('orderBadge');
      badge.textContent = d.orderCount;
      badge.style.display = 'inline';
    }
  } catch { /* silent */ }
}

// ── Products ─────────────────────────────────────────────────────────
async function loadProducts() {
  try {
    const list = await getAllProducts();
    _categories = await getCategories();
    const el = document.getElementById('adminProductsList');
    document.getElementById('prodCount').textContent = `(${list.length})`;

    if (!list.length) {
      el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text-secondary)">Aucun produit.</div>';
      return;
    }

    el.innerHTML = list.map(p => {
      const bc = p.stock===0?'out': p.stock<=CFG.lowStock?'low':'in';
      const si = stockInfo(p.stock);
      const emoji = p.emoji || (_categories.find(c=>c.name===p.category)||{}).emoji || '📦';
      return `
        <div class="admin-product-row">
          <div class="admin-product-thumb">
            ${p.image
              ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.parentElement.textContent='${emoji}'">`
              : emoji
            }
          </div>
          <div class="admin-product-info">
            <div class="admin-product-name">${esc(p.name)}</div>
            <div class="admin-product-meta">${esc(p.category||'')} · Stock : ${p.stock}</div>
          </div>
          <div class="admin-product-price">${fmt(p.price)}</div>
          <span class="stock-badge ${bc}">${si.label}</span>
          <div class="admin-product-actions">
            <button class="btn-edit"   onclick="window.__editProduct('${p.id}')">Editer</button>
            <button class="btn-delete" onclick="window.__deleteProduct('${p.id}')">Supprimer</button>
          </div>
        </div>
      `;
    }).join('');
  } catch { document.getElementById('adminProductsList').innerHTML = '<div style="padding:16px;color:var(--danger)">Erreur.</div>'; }
}

window.__editProduct = async function(id) {
  const { getProduct } = await import('../firebase.js');
  const p = await getProduct(id);
  if (!p) return;
  _editingProdId = id;

  populateCatSelect(p.category);

  document.getElementById('editProdId').value = id;
  document.getElementById('p-name').value = p.name || '';
  document.getElementById('p-desc').value = p.description || '';
  document.getElementById('p-price').value = p.price || '';
  document.getElementById('p-old-price').value = p.oldPrice || '';
  document.getElementById('p-stock').value = p.stock ?? '';
  document.getElementById('p-emoji').value = p.emoji || '';
  document.getElementById('p-img-url').value = p.image || '';
  document.getElementById('p-badge').value = p.badge || '';

  if (p.image) {
    document.getElementById('imgPreview').style.display = 'block';
    document.getElementById('imgPreviewSrc').src = p.image;
  }

  document.getElementById('prodFormTitle').textContent = '✏️ Modifier le produit';
  document.getElementById('prodCancelBtn').style.display = 'inline-flex';
  document.querySelector('.admin-form-card').scrollIntoView({ behavior:'smooth', block:'start' });
};

window.__deleteProduct = async function(id) {
  if (!confirm('Supprimer ce produit ?')) return;
  await deleteProduct(id);
  showToast('Produit supprime.', 'success');
  await Promise.all([loadStats(), loadProducts()]);
};

async function saveProduct() {
  const name     = document.getElementById('p-name').value.trim();
  const category = document.getElementById('p-cat').value;
  const price    = parseFloat(document.getElementById('p-price').value);
  const stock    = parseInt(document.getElementById('p-stock').value);

  if (!name || !category || isNaN(price) || isNaN(stock)) {
    showToast('Remplissez les champs obligatoires.', 'error'); return;
  }

  const image = document.getElementById('p-img-url').value.trim();

  const body = {
    name, category,
    description : document.getElementById('p-desc').value.trim(),
    price,
    oldPrice   : parseFloat(document.getElementById('p-old-price').value) || null,
    stock,
    emoji      : document.getElementById('p-emoji').value.trim(),
    image,
    badge      : document.getElementById('p-badge').value,
  };

  const btn = document.getElementById('prodSaveBtn');
  btn.disabled = true; btn.textContent = '⏳…';
  try {
    if (_editingProdId) {
      await updateProduct(_editingProdId, body);
      showToast('Produit mis a jour !', 'success');
    } else {
      await addProduct(body);
      showToast('Produit ajoute !', 'success');
    }
    resetProductForm();
    await Promise.all([loadStats(), loadProducts()]);
  } catch (err) {
    showToast('Erreur : ' + err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = '💾 Enregistrer';
  }
}

function resetProductForm() {
  _editingProdId = null;
  ['p-name','p-desc','p-price','p-old-price','p-stock','p-emoji','p-img-url'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('p-cat').value = '';
  document.getElementById('p-badge').value = '';
  document.getElementById('imgPreview').style.display = 'none';
  document.getElementById('prodFormTitle').textContent = '➕ Ajouter un produit';
  document.getElementById('prodCancelBtn').style.display = 'none';
}

// Live image preview when URL is pasted
window.__previewImg = function() {
  const url = document.getElementById('p-img-url').value.trim();
  const preview = document.getElementById('imgPreview');
  const previewSrc = document.getElementById('imgPreviewSrc');
  if (url) {
    previewSrc.src = url;
    preview.style.display = 'block';
    previewSrc.onerror = () => {
      preview.style.display = 'none';
      showToast('Image introuvable. Verifiez l\'URL.', 'error');
    };
  } else {
    preview.style.display = 'none';
  }
};

// ── Categories ───────────────────────────────────────────────────────
function populateCatSelect(selected = '') {
  const sel = document.getElementById('p-cat');
  if (!sel) return;
  sel.innerHTML = '<option value="">Selectionner…</option>' +
    _categories.map(c => `<option value="${esc(c.name)}" ${c.name===selected?'selected':''}>${c.emoji||''} ${esc(c.name)}</option>`).join('');
}

async function loadCategories() {
  _categories = await getCategories();
  populateCatSelect();
  const el = document.getElementById('catListBody');
  if (!_categories.length) {
    el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-secondary)">Aucune categorie.</div>';
    return;
  }
  el.innerHTML = _categories.map(c => `
    <div class="cat-row" id="cat-row-${c.id}">
      <div class="cat-icon">${c.emoji||'📦'}</div>
      <div class="cat-info"><div class="cat-name">${esc(c.name)}</div><div class="cat-count">${c.count||0} produit(s)</div></div>
      <div class="cat-actions">
        <button class="btn-edit-cat" onclick="window.__editCat('${c.id}')">Editer</button>
        <button class="btn-delete-cat" onclick="window.__deleteCat('${c.id}')">Supprimer</button>
      </div>
    </div>
    <div class="edit-cat-row" id="cat-edit-${c.id}">
      <input type="text" id="cat-name-${c.id}" value="${esc(c.name)}" placeholder="Nom" />
      <input type="text" id="cat-emoji-${c.id}" value="${esc(c.emoji||'')}" placeholder="Emoji" maxlength="2" style="width:70px" />
      <button class="btn-save" style="flex:0;padding:8px 14px" onclick="window.__saveCatEdit('${c.id}')">Sauvegarder</button>
      <button class="btn-cancel-form" style="flex:0;padding:8px 14px" onclick="window.__cancelCatEdit('${c.id}')">Annuler</button>
    </div>
  `).join('');
}

let _editingCatId = null;

window.__editCat = function(id) {
  _editingCatId = id;
  document.getElementById(`cat-row-${id}`).style.display = 'none';
  document.getElementById(`cat-edit-${id}`).classList.add('active');
};

window.__cancelCatEdit = function(id) {
  document.getElementById(`cat-row-${id}`).style.display = 'flex';
  document.getElementById(`cat-edit-${id}`).classList.remove('active');
  _editingCatId = null;
};

window.__saveCatEdit = async function(id) {
  const name  = document.getElementById(`cat-name-${id}`).value.trim();
  const emoji = document.getElementById(`cat-emoji-${id}`).value.trim() || '📦';
  if (!name) { showToast('Nom requis.', 'error'); return; }
  await updateCategory(id, name, emoji);
  showToast('Categorie mise a jour.', 'success');
  await loadCategories();
};

window.__deleteCat = async function(id) {
  if (!confirm('Supprimer cette categorie ?')) return;
  await deleteCategory(id);
  showToast('Categorie supprimee.', 'success');
  await loadCategories();
};

window.__addCat = async function() {
  const name  = document.getElementById('cat-name-input').value.trim();
  const emoji = document.getElementById('cat-emoji-input').value.trim() || '📦';
  if (!name) { showToast('Nom requis.', 'error'); return; }
  await addCategory(name, emoji);
  showToast('Categorie ajoutee !', 'success');
  document.getElementById('cat-name-input').value = '';
  document.getElementById('cat-emoji-input').value = '';
  await loadCategories();
};

// ── Orders ────────────────────────────────────────────────────────────
let _allOrders = [];

async function loadOrders() {
  try {
    _allOrders = await getOrders();
    renderOrders(_allOrders);
  } catch {
    document.getElementById('ordersList').innerHTML = '<div style="padding:16px;color:var(--danger)">Erreur chargement.</div>';
  }
}

window.__filterOrders = function() {
  const status = document.getElementById('orderFilterStatus').value;
  const filtered = status ? _allOrders.filter(o => o.status === status) : _allOrders;
  renderOrders(filtered);
};

function renderOrders(orders) {
  const el = document.getElementById('ordersList');
  if (!orders.length) {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary)">Aucune commande.</div>';
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
    pending  : 'En attente', confirmed : 'Confirmee',
    shipped  : 'Expediee',   delivered : 'Livree', cancelled : 'Annulee'
  };

  el.innerHTML = orders.map(o => {
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
            <div style="font-size:.82rem;color:var(--text-secondary);line-height:1.6">
              <div>👤 ${esc(o.customerName||'')}</div>
              <div>📞 ${esc(o.customerPhone||'')}</div>
              <div>📍 ${esc(o.customerAddress||'')}</div>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:1.1rem;font-weight:700;color:var(--primary)">${fmt(o.total)}</div>
            <div style="font-size:.8rem;color:var(--text-secondary);margin-top:2px">x${o.quantity} · ${fmt(o.price)}</div>
            <div style="font-size:.75rem;color:var(--text-light);margin-top:2px">${date}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:14px;flex-wrap:wrap">
          <select onchange="window.__setOrderStatus('${o.id}', this.value)" style="padding:6px 10px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.82rem;font-weight:600;background:${sc.bg};color:${sc.color}">
            <option value="pending"   ${o.status==='pending'  ?'selected':''}>En attente</option>
            <option value="confirmed" ${o.status==='confirmed'?'selected':''}>Confirmee</option>
            <option value="shipped"   ${o.status==='shipped'  ?'selected':''}>Expediee</option>
            <option value="delivered" ${o.status==='delivered'?'selected':''}>Livree</option>
            <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Annulee</option>
          </select>
          <button onclick="window.__deleteOrder('${o.id}')" style="margin-left:auto;padding:6px 12px;border:1.5px solid var(--danger);color:var(--danger);background:transparent;border-radius:var(--radius-sm);font-size:.78rem;font-weight:600;cursor:pointer">Supprimer</button>
        </div>
      </div>
    `;
  }).join('');
}

window.__setOrderStatus = async function(id, status) {
  await updateOrderStatus(id, status);
  showToast('Statut mis a jour.', 'success');
};

window.__deleteOrder = async function(id) {
  if (!confirm('Supprimer cette commande ? Le stock sera restaure.')) return;
  await deleteOrder(id);
  showToast('Commande supprimee.', 'success');
  await Promise.all([loadStats(), loadOrders()]);
};

// ── Tab Switching ─────────────────────────────────────────────────────
function switchTab(tab) {
  document.getElementById('tab-products').classList.toggle('active', tab==='products');
  document.getElementById('tab-categories').classList.toggle('active', tab==='categories');
  document.getElementById('tab-orders').classList.toggle('active', tab==='orders');
  document.getElementById('panel-products').style.display   = tab==='products' ? '' : 'none';
  document.getElementById('panel-categories').style.display  = tab==='categories' ? '' : 'none';
  document.getElementById('panel-orders').style.display     = tab==='orders' ? '' : 'none';
}

// ── Auth ─────────────────────────────────────────────────────────────
async function handleLogout() {
  await logout();
  navigate('/');
  showToast('Deconnexion.', 'default');
}

async function handleChangePass() {
  const current = document.getElementById('cp-current').value;
  const newPass = document.getElementById('cp-new').value;
  const confirm = document.getElementById('cp-confirm').value;
  if (!current || !newPass || !confirm) { showToast('Remplissez tous les champs.', 'error'); return; }
  if (newPass !== confirm)               { showToast('Ne correspondent pas.', 'error'); return; }
  try {
    await changePassword(current, newPass);
    showToast('Mot de passe mis a jour.', 'success');
    ['cp-current','cp-new','cp-confirm'].forEach(id => document.getElementById(id).value='');
  } catch (err) {
    const msgs = { 'auth/wrong-password':'Mot de passe actuel incorrect.' };
    showToast(msgs[err.code]||'Erreur.', 'error');
  }
}

// ── Misc ─────────────────────────────────────────────────────────────
function buildSpinner() {
  return '<div class="spinner-wrap"><div class="spinner"></div></div>';
}
