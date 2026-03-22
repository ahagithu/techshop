/**
 * Firebase configuration and initialization
 * Replace the firebaseConfig values with your own from:
 * Firebase Console → Project Settings → Your Apps → Web App
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";
import {
  getFirestore, collection, doc, getDocs, getDoc, addDoc,
  updateDoc, deleteDoc, query, where, orderBy,
  getCountFromServer, increment, serverTimestamp, setDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail, updatePassword,
  reauthenticateWithCredential, EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js";

// ── Firebase Config ──────────────────────────────────────────────────
const firebaseConfig = {
  apiKey            : "AIzaSyDD6vW_sCIYQPLkdau77tWNULWsq1WiT2U",
  authDomain        : "boutique-electronique.firebaseapp.com",
  projectId         : "boutique-electronique",
  storageBucket     : "boutique-electronique.firebasestorage.app",
  messagingSenderId : "691090681174",
  appId             : "1:691090681174:web:a1624e37bae8af93297af7",
  measurementId     : "G-6GFV5VNVYS"
};

const app       = initializeApp(firebaseConfig);
const db        = getFirestore(app);
const auth      = getAuth(app);
const storage   = getStorage(app);
const analytics = getAnalytics(app);

// ── Expose globally for non-module scripts ───────────────────────────
window.FB = { db, auth, storage, app };

// ── Shop Config ──────────────────────────────────────────────────────
export const CFG = {
  whatsappNumbers : [
    { name: 'Adamou', num: '22789631595' },
    { name: 'Volts Niger', num: '22793033158' }
  ],
  lowStock       : 5,
  currency       : 'FCFA',
  shopName       : 'VoltsNiger',
};

// ── Auth State ───────────────────────────────────────────────────────
let _currentUser = null;
const _authListeners = [];

export function getCurrentUser() { return _currentUser; }
export function isLoggedIn()    { return !!_currentUser; }

export async function isAdmin() {
  if (!_currentUser) return false;
  const snap = await getDoc(doc(db, 'admins', _currentUser.uid));
  return snap.exists() && snap.data().role === 'admin';
}

onAuthStateChanged(auth, (user) => {
  _currentUser = user;
  _authListeners.forEach(fn => fn(user));
});

export function onAuthChange(fn) { _authListeners.push(fn); }

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  _currentUser = cred.user;
  return cred.user;
}

export async function register(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  _currentUser = cred.user;
  // Save to users collection
  await setDoc(doc(db, 'users', cred.user.uid), {
    email: cred.user.email,
    role: 'user',
    createdAt: serverTimestamp()
  });
  return cred.user;
}

export async function logout() {
  await signOut(auth);
  _currentUser = null;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function changePassword(currentPassword, newPassword) {
  const cred = EmailAuthProvider.credential(_currentUser.email, currentPassword);
  await reauthenticateWithCredential(_currentUser, cred);
  await updatePassword(_currentUser, newPassword);
}

// ── Products ─────────────────────────────────────────────────────────
export async function getProducts({ category, search, sort } = {}) {
  let q = collection(db, 'products');
  const constraints = [];
  if (category && category !== 'Tous') constraints.push(where('category', '==', category));
  if (constraints.length) q = query(q, ...constraints);

  const snap = await getDocs(q);
  let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (search) {
    const s = search.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(s) ||
      (p.description || '').toLowerCase().includes(s) ||
      (p.category  || '').toLowerCase().includes(s)
    );
  }

  if (sort === 'price-asc')  list.sort((a,b) => a.price - b.price);
  if (sort === 'price-desc') list.sort((a,b) => b.price - a.price);
  if (sort === 'name-asc')   list.sort((a,b) => a.name.localeCompare(b.name));
  if (sort === 'stock-desc') list.sort((a,b) => b.stock - a.stock);

  return list;
}

export async function getProduct(id) {
  const snap = await getDoc(doc(db, 'products', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllProducts() {
  const snap = await getDocs(query(collection(db, 'products'), orderBy('name')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addProduct(data) {
  const ref = await addDoc(collection(db, 'products'), {
    ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });
  await updateCategoryCounts();
  return ref.id;
}

export async function updateProduct(id, data) {
  await updateDoc(doc(db, 'products', id), { ...data, updatedAt: serverTimestamp() });
  await updateCategoryCounts();
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, 'products', id));
  await updateCategoryCounts();
}

// ── Categories ───────────────────────────────────────────────────────
export async function getCategories() {
  const snap = await getDocs(query(collection(db, 'categories'), orderBy('name')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addCategory(name, emoji) {
  const ref = await addDoc(collection(db, 'categories'), { name, emoji, count: 0 });
  return ref.id;
}

export async function updateCategory(id, name, emoji) {
  await updateDoc(doc(db, 'categories', id), { name, emoji });
}

export async function deleteCategory(id) {
  await deleteDoc(doc(db, 'categories', id));
}

export async function updateCategoryCounts() {
  try {
    const snap = await getDocs(collection(db, 'products'));
    const counts = {};
    snap.docs.forEach(d => {
      const cat = d.data().category;
      if (cat) counts[cat] = (counts[cat]||0) + 1;
    });
    const batch = writeBatch(db);
    const catsSnap = await getDocs(collection(db, 'categories'));
    catsSnap.docs.forEach(c => {
      batch.update(c.ref, { count: counts[c.data().name]||0 });
    });
    await batch.commit();
  } catch (e) { console.warn('Count update error:', e); }
}

// ── Orders ──────────────────────────────────────────────────────────
export async function getOrders() {
  const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Get orders for current user
export async function getMyOrders() {
  if (!_currentUser) return [];
  const snap = await getDocs(query(
    collection(db, 'orders'),
    where('userId', '==', _currentUser.uid),
    orderBy('createdAt', 'desc')
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addOrder(orderData) {
  const ref = await addDoc(collection(db, 'orders'), {
    ...orderData,
    userId    : _currentUser?.uid || null,
    status    : 'pending',
    createdAt : serverTimestamp(),
  });
  // Decrement stock
  if (orderData.productId) {
    await updateDoc(doc(db, 'products', orderData.productId), {
      stock: increment(-orderData.quantity)
    });
  }
  return ref.id;
}

export async function updateOrderStatus(id, status) {
  await updateDoc(doc(db, 'orders', id), { status, updatedAt: serverTimestamp() });
}

export async function deleteOrder(id) {
  // Restore stock before deleting
  const snap = await getDoc(doc(db, 'orders', id));
  if (snap.exists()) {
    const order = snap.data();
    await updateDoc(doc(db, 'products', order.productId), {
      stock: increment(order.quantity)
    });
  }
  await deleteDoc(doc(db, 'orders', id));
}

// ── Wishlist ─────────────────────────────────────────────────────────
export async function getWishlist() {
  if (!_currentUser) return [];
  const snap = await getDocs(query(
    collection(db, 'wishlists'),
    where('userId', '==', _currentUser.uid)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addToWishlist(product) {
  if (!_currentUser) {
    showToast('Connectez-vous pour ajouter à la wishlist.', 'error');
    return;
  }
  // Check if already in wishlist
  const existing = await getDocs(query(
    collection(db, 'wishlists'),
    where('userId', '==', _currentUser.uid),
    where('productId', '==', product.id || product.productId)
  ));
  if (existing.docs.length > 0) {
    showToast('Déjà dans la wishlist.', 'warning');
    return;
  }
  await addDoc(collection(db, 'wishlists'), {
    userId    : _currentUser.uid,
    productId : product.id,
    name      : product.name,
    price     : product.price,
    image     : product.image,
    emoji     : product.emoji,
    stock     : product.stock,
    createdAt : serverTimestamp(),
  });
  showToast('Ajouté à la wishlist !', 'success');
}

export async function removeFromWishlist(productId) {
  if (!_currentUser) return;
  const snap = await getDocs(query(
    collection(db, 'wishlists'),
    where('userId', '==', _currentUser.uid),
    where('productId', '==', productId)
  ));
  for (const doc of snap.docs) {
    await deleteDoc(doc.ref);
  }
}

// ── Admin Stats ──────────────────────────────────────────────────────
export async function getAdminStats() {
  const [total, inStock, outSnap, ordersSnap] = await Promise.all([
    getCountFromServer(collection(db, 'products')),
    getCountFromServer(query(collection(db, 'products'), where('stock', '>', 0))),
    getCountFromServer(query(collection(db, 'products'), where('stock', '==', 0))),
    getCountFromServer(collection(db, 'orders')),
  ]);

  const ordersDocs = await getDocs(collection(db, 'orders'));
  const revenue = ordersDocs.docs.reduce((s, d) => s + (d.data().total||0), 0);

  return {
    total     : total.data().count,
    inStock   : inStock.data().count,
    outStock  : outSnap.data().count,
    orderCount: ordersSnap.data().count,
    revenue,
  };
}

// ── Image Upload ──────────────────────────────────────────────────────
export async function uploadProductImage(file) {
  if (!file) return null;
  const filename = `products/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const ref = storageRef(storage, filename);
  await uploadBytes(ref, file);
  return await getDownloadURL(ref);
}

// ── Toast (available everywhere — accesses #toastContainer) ──────────
export function showToast(msg, type='default') {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ── Utility formatters ─────────────────────────────────────────────────
export function fmt(v) {
  if (v == null) return '';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(v) + ' ' + CFG.currency;
}

export function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function stockInfo(s) {
  if (s === 0)           return { cls: 'out-stock', label: 'Rupture de stock' };
  if (s <= CFG.lowStock) return { cls: 'low-stock', label: `⚠️ Plus que ${s}` };
  return                         { cls: 'in-stock',  label: `✓ En stock (${s})` };
}

export { buildSpinner } from './views/components.js';

// ── Users Management ────────────────────────────────────────────────────
export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function setAdminRole(uid, isAdmin) {
  if (isAdmin) {
    await setDoc(doc(db, 'admins', uid), {
      email: (await getDoc(doc(db, 'users', uid))).data()?.email,
      role: 'admin',
      createdAt: serverTimestamp()
    });
  } else {
    await deleteDoc(doc(db, 'admins', uid));
  }
}

export async function deleteUser(uid) {
  // Delete from Firestore collections
  await deleteDoc(doc(db, 'users', uid)).catch(() => {});
  await deleteDoc(doc(db, 'admins', uid)).catch(() => {});
  // Note: Deleting from Auth requires Admin SDK on server-side
  // For now, we just remove from Firestore
  showToast('Utilisateur supprime (Firestore).', 'success');
}
