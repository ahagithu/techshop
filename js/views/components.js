/**
 * Shared UI components
 */
import { CFG } from '../firebase.js';

export function buildProductCard(p, categories) {
  const si    = stockInfo(p.stock);
  const hasOld = p.oldPrice && p.oldPrice > p.price;
  const disc   = hasOld ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const emoji  = p.emoji || (categories.find(c => c.name === p.category) || {}).emoji || '📦';

  return `
    <div class="product-card fade-in">
      <div class="product-badge">
        ${p.badge==='new'   ? '<span class="badge badge-new">Nouveau</span>'    : ''}
        ${p.badge==='promo' ? '<span class="badge badge-promo">Promo</span>'    : ''}
        ${p.badge==='hot'   ? '<span class="badge badge-hot">🔥 Populaire</span>' : ''}
      </div>
      <div class="product-image-wrap">
        ${p.image
          ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=&quot;product-image-placeholder&quot;>${emoji}</div>'">`
          : `<div class="product-image-placeholder">${emoji}</div>`
        }
      </div>
      <div class="product-info">
        <div class="product-category">${emoji} ${esc(p.category||'')}</div>
        <div class="product-name">${esc(p.name)}</div>
        <div class="product-description">${esc(p.description||'')}</div>
        <div class="product-price-row">
          <span class="product-price">${fmt(p.price)}</span>
          ${hasOld ? `<span class="product-price-old">${fmt(p.oldPrice)}</span>` : ''}
          ${disc > 0 ? `<span class="product-discount">-${disc}%</span>` : ''}
        </div>
        <div class="stock-indicator ${si.cls}">
          <div class="stock-dot"></div>${si.label}
        </div>
        <div class="product-actions">
          <button class="btn-whatsapp" data-product-id="${p.id}" data-action="order" ${p.stock===0?'disabled':''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            ${p.stock===0 ? 'Rupture' : 'Commander'}
          </button>
          <button class="btn-detail" data-product-id="${p.id}" data-action="detail">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

export function stockInfo(s) {
  if (s === 0) return { cls:'out-stock', label:'Rupture de stock' };
  if (s <= CFG.lowStock) return { cls:'low-stock', label:`⚠️ Plus que ${s}` };
  return { cls:'in-stock', label:`✓ En stock (${s})` };
}

export function fmt(v) {
  if (v == null) return '';
  return new Intl.NumberFormat('fr-FR',{minimumFractionDigits:0}).format(v) + ' ' + CFG.currency;
}

export function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function buildSpinner() {
  return '<div class="spinner-wrap"><div class="spinner"></div></div>';
}
