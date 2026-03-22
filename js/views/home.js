/**
 * Home view — public storefront
 */
import { getProducts, getCategories, CFG, isLoggedIn, showToast, fmt } from '../firebase.js';
import { buildProductCard } from './components.js';

let _products   = [];
let _categories = [];
let _activeCategory = 'Tous';

export function render(container) {
  container.innerHTML = `
    <!-- Hero -->
    <section class="hero fade-in">
      <div class="hero-content">
        <span class="hero-badge">✦ Nouvelle collection 2026</span>
        <h1>L'electronique au meilleur prix</h1>
        <p>Smartphones, laptops, accessoires — tout ce dont vous avez besoin, livre rapidement via WhatsApp.</p>
        <div class="hero-cta">
          <a href="#catalogue" class="btn-hero-primary" onclick="document.getElementById('catalogue').scrollIntoView({behavior:'smooth'})">Voir le catalogue</a>
          <a href="/contact" data-link class="btn-hero-secondary">Nous contacter</a>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><div class="value" id="statProducts">—</div><div class="label">Produits</div></div>
          <div class="hero-stat"><div class="value">100%</div><div class="label">Satisfait</div></div>
          <div class="hero-stat"><div class="value">24h</div><div class="label">Livraison</div></div>
        </div>
      </div>
    </section>

    <!-- Catalogue -->
    <div class="main-wrapper" id="catalogue">
      <h2 class="section-title">Notre Catalogue</h2>
      <p class="section-subtitle">Tous nos produits sont garantis et disponibles immediatement</p>
      <div class="filters-bar" id="filtersBar"></div>
      <div class="products-header">
        <span class="products-count" id="productsCount"></span>
        <select class="sort-select" id="sortSelect" onchange="window.__onSortChange()">
          <option value="default">Trier par defaut</option>
          <option value="price-asc">Prix croissant</option>
          <option value="price-desc">Prix decroissant</option>
          <option value="name-asc">Nom A → Z</option>
          <option value="stock-desc">Stock disponible</option>
        </select>
      </div>
      <div class="products-grid" id="productsGrid">
        <div class="spinner-wrap"><div class="spinner"></div></div>
      </div>
    </div>

    <!-- Order Modal -->
    <div class="modal-overlay" id="orderModal" onclick="window.__closeOrderModalIfOverlay(event)">
      <div class="modal" style="max-width:520px">
        <button class="modal-close" onclick="window.__closeOrderModal()">✕</button>
        <div style="padding:24px">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border)">
            <div id="orderProductImg" style="width:60px;height:60px;border-radius:8px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:2rem;overflow:hidden;flex-shrink:0">
              <div id="orderProductEmoji"></div>
            </div>
            <div>
              <div style="font-weight:700;font-size:.95rem" id="orderProductName"></div>
              <div style="color:var(--primary);font-weight:700;margin-top:2px" id="orderProductPrice"></div>
            </div>
          </div>

          <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:16px">Vos informations</h3>

          <div class="form-group">
            <label>Nom complet *</label>
            <input type="text" id="orderName" placeholder="ex: Ahmed Benali" />
          </div>
          <div class="form-group">
            <label>Telephone (WhatsApp) *</label>
            <input type="tel" id="orderPhone" placeholder="ex: 0600000000" />
          </div>
          <div class="form-group">
            <label>Adresse de livraison *</label>
            <textarea id="orderAddress" placeholder="Ville, quartier, rue..." rows="2"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Quantite</label>
              <div style="display:flex;align-items:center;border:1.5px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;height:42px">
                <button onclick="window.__orderQty(-1)" style="width:36px;height:100%;background:var(--surface2);border:none;font-size:1.1rem;cursor:pointer">-</button>
                <input type="number" id="orderQty" value="1" min="1" style="flex:1;text-align:center;border:none;border-left:1.5px solid var(--border);border-right:1.5px solid var(--border);height:100%;font-size:.95rem;font-weight:600;outline:none;background:white" oninput="window.__updateOrderTotal()" />
                <button onclick="window.__orderQty(1)" style="width:36px;height:100%;background:var(--surface2);border:none;font-size:1.1rem;cursor:pointer">+</button>
              </div>
            </div>
            <div class="form-group">
              <label>Total</label>
              <div style="padding:10px 14px;background:var(--primary-light);border:1.5px solid var(--border);border-radius:var(--radius-sm);font-weight:700;color:var(--primary);font-size:1.1rem" id="orderTotal">0 MAD</div>
            </div>
          </div>

          <div id="orderError" style="background:#ffe5e5;color:#b00020;padding:10px 14px;border-radius:var(--radius-sm);font-size:.875rem;margin-bottom:12px;display:none"></div>

          <button class="btn-whatsapp-lg" id="orderSubmitBtn" onclick="window.__submitOrder()" style="margin-top:8px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            Commander via WhatsApp
          </button>
        </div>
      </div>
    </div>
  `;

  // Bind global handlers
  window.__onSortChange   = onSortChange;
  window.__closeOrderModal      = closeOrderModal;
  window.__closeOrderModalIfOverlay = (e) => { if (e.target.id==='orderModal') closeOrderModal(); };
  window.__orderQty       = orderQty;
  window.__updateOrderTotal = updateOrderTotal;
  window.__submitOrder    = submitOrder;

  loadData();
}

// ── Data ────────────────────────────────────────────────────────────
async function loadData() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
  try {
    const [cats, prods] = await Promise.all([
      getCategories(),
      getProducts(),
    ]);
    _categories = cats;
    _products   = prods;
    renderFilters();
    renderGrid(prods);
    document.getElementById('statProducts').textContent = prods.length + '+';
  } catch (err) {
    grid.innerHTML = '<div class="empty-state"><div class="icon">⚠️</div><h3>Erreur de connexion Firebase</h3><p>Verifiez votre connexion internet.</p></div>';
  }
}

async function onSortChange() {
  const search = document.getElementById('searchInput')?.value?.trim() || '';
  const sort   = document.getElementById('sortSelect').value;
  const q      = new URLSearchParams();
  if (_activeCategory !== 'Tous') q.set('category', _activeCategory);
  if (search) q.set('search', search);
  if (sort)   q.set('sort', sort);

  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
  try {
    _products = await getProducts({ category: _activeCategory, search, sort });
    renderGrid(_products);
  } catch {
    grid.innerHTML = '<div class="empty-state"><div class="icon">⚠️</div><h3>Erreur</h3></div>';
  }
}

function onSearch() {
  clearTimeout(window.__searchTimer);
  window.__searchTimer = setTimeout(onSortChange, 300);
}

// ── Filters ─────────────────────────────────────────────────────────
function renderFilters() {
  const bar    = document.getElementById('filtersBar');
  const total  = _categories.reduce((s,c) => s + (c.count||0), 0);
  bar.innerHTML = `
    <button class="filter-btn ${_activeCategory==='Tous'?'active':''}" onclick="window.__setCategory('Tous')">
      Tous <span class="filter-count">${total||_products.length}</span>
    </button>
    ${_categories.map(c => `
      <button class="filter-btn ${_activeCategory===c.name?'active':''}" onclick="window.__setCategory('${esc(c.name)}')">
        ${c.emoji||'📦'} ${esc(c.name)} <span class="filter-count">${c.count||0}</span>
      </button>
    `).join('')}
  `;
  window.__setCategory = setCategory;
}

function setCategory(cat) {
  _activeCategory = cat;
  onSortChange();
}

// ── Grid ─────────────────────────────────────────────────────────────
function renderGrid(list) {
  const grid  = document.getElementById('productsGrid');
  const count = document.getElementById('productsCount');
  count.textContent = `${list.length} produit${list.length!==1?'s':''}`;

  if (!list.length) {
    grid.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><h3>Aucun produit</h3></div>';
    return;
  }

  grid.innerHTML = list.map(p => buildProductCard(p, _categories)).join('');
  bindProductButtons();
}

function bindProductButtons() {
  document.querySelectorAll('[data-product-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id  = btn.dataset.productId;
      const p   = _products.find(x => x.id === id);
      if (!p) return;
      if (btn.dataset.action === 'order') quickOrder(p);
      else openProductModal(p);
    });
  });
}

// ── Order Modal ──────────────────────────────────────────────────────
let _orderProduct = null;

function quickOrder(p) {
  if (p.stock === 0) { showToast('Produit en rupture.', 'error'); return; }
  openOrderModal(p, 1);
}

function openProductModal(p) {
  if (p.stock === 0) { showToast('Produit en rupture.', 'error'); return; }
  openOrderModal(p, 1);
}

function openOrderModal(p, qty = 1) {
  _orderProduct = p;
  const emoji = p.emoji || (_categories.find(c=>c.name===p.category)||{}).emoji || '📦';

  document.getElementById('orderProductName').textContent = p.name;
  document.getElementById('orderProductPrice').textContent = fmt(p.price);
  document.getElementById('orderQty').value = qty;
  document.getElementById('orderQty').max   = p.stock || 99;
  document.getElementById('orderName').value  = '';
  document.getElementById('orderPhone').value = '';
  document.getElementById('orderAddress').value = '';
  document.getElementById('orderError').style.display = 'none';

  if (p.image) {
    document.getElementById('orderProductImg').innerHTML = `<img src="${esc(p.image)}" style="width:100%;height:100%;object-fit:contain;padding:4px">`;
  } else {
    document.getElementById('orderProductImg').innerHTML = `<div style="font-size:2rem">${emoji}</div>`;
  }

  updateOrderTotal();
  document.getElementById('orderModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('orderName').focus();
}

function closeOrderModal() {
  document.getElementById('orderModal').classList.remove('open');
  document.body.style.overflow = '';
  _orderProduct = null;
}

function orderQty(d) {
  const inp = document.getElementById('orderQty');
  const max = _orderProduct ? _orderProduct.stock : 99;
  inp.value = Math.max(1, Math.min(max||1, +inp.value + d));
  updateOrderTotal();
}

function updateOrderTotal() {
  if (!_orderProduct) return;
  const qty = parseInt(document.getElementById('orderQty').value) || 1;
  document.getElementById('orderTotal').textContent = fmt(_orderProduct.price * qty);
}

async function submitOrder() {
  if (!_orderProduct) return;
  const name    = document.getElementById('orderName').value.trim();
  const phone   = document.getElementById('orderPhone').value.trim();
  const address = document.getElementById('orderAddress').value.trim();
  const qty     = parseInt(document.getElementById('orderQty').value) || 1;
  const errEl   = document.getElementById('orderError');

  if (!name)    { errEl.textContent = 'Veuillez entrer votre nom.'; errEl.style.display='block'; return; }
  if (!phone)   { errEl.textContent = 'Veuillez entrer votre numero de telephone.'; errEl.style.display='block'; return; }
  if (!address) { errEl.textContent = 'Veuillez entrer votre adresse de livraison.'; errEl.style.display='block'; return; }

  const btn = document.getElementById('orderSubmitBtn');
  btn.disabled = true; btn.textContent = 'Envoi en cours…';
  errEl.style.display = 'none';

  try {
    const { addOrder } = await import('../firebase.js');
    await addOrder({
      productId   : _orderProduct.id,
      productName : _orderProduct.name,
      productImg  : _orderProduct.image || null,
      price       : _orderProduct.price,
      quantity    : qty,
      total       : _orderProduct.price * qty,
      customerName : name,
      customerPhone: phone,
      customerAddress: address,
    });

    const msg = buildWAMsg(_orderProduct, qty, name, phone, address);
    window.open(`https://wa.me/${CFG.whatsappNumber}?text=${msg}`, '_blank');

    showToast('Commande enregistree ! Redirection WhatsApp…', 'success');
    closeOrderModal();
    loadData(); // Refresh grid
  } catch (err) {
    errEl.textContent = 'Erreur : ' + err.message;
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> Commander via WhatsApp`;
  }
}

function buildWAMsg(p, qty, name, phone, address) {
  const text =
`Bonjour ${CFG.shopName} 👋

*Nouvelle commande :*
━━━━━━━━━━━━━━━
👤 Client : ${name}
📞 Tel : ${phone}
📍 Adresse : ${address}
━━━━━━━━━━━━━━━
📦 Produit : ${p.name}
💰 Prix unitaire : ${fmt(p.price)}
🔢 Quantite : ${qty}
💵 *Total : ${fmt(p.price * qty)}*
━━━━━━━━━━━━━━━

Merci de confirmer la disponibilite et les details de livraison.`;
  return encodeURIComponent(text);
}

// ── Utilities ───────────────────────────────────────────────────────
function stockInfo(s) {
  if (s === 0) return { cls:'out-stock', label:'Rupture de stock' };
  if (s <= CFG.lowStock) return { cls:'low-stock', label:`⚠️ Plus que ${s}` };
  return { cls:'in-stock', label:`✓ En stock (${s})` };
}

function fmt(v) {
  if (v == null) return '';
  return new Intl.NumberFormat('fr-FR',{minimumFractionDigits:0}).format(v) + ' ' + CFG.currency;
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg, type='default') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`; t.textContent = msg;
  c.appendChild(t); setTimeout(() => t.remove(), 4000);
}
