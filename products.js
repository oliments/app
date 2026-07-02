// products.js
import { db, uid } from './storage.js';
import { SEED_PRODUCTS } from './seed-data.js';

export async function ensureSeeded() {
  const count = await db.count('products');
  if (count > 0) return;
  for (const p of SEED_PRODUCTS) {
    await db.put('products', {
      id: uid(),
      isCustom: false,
      isFavorite: false,
      createdAt: Date.now(),
      unit: 'g',
      unitWeight: null,
      ...p,
    });
  }
}

export async function getAllProducts() {
  return db.getAll('products');
}

export async function getProduct(id) {
  return db.get('products', id);
}

export async function createProduct(data) {
  const product = {
    id: uid(),
    isCustom: true,
    isFavorite: false,
    createdAt: Date.now(),
    unitWeight: null,
    category: 'other',
    ...data,
  };
  await db.put('products', product);
  return product;
}

export async function updateProduct(id, patch) {
  const existing = await db.get('products', id);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  await db.put('products', updated);
  return updated;
}

export async function deleteProduct(id) {
  await db.delete('products', id);
  await db.delete('recents', id);
}

export async function toggleFavorite(id) {
  const p = await db.get('products', id);
  if (!p) return null;
  p.isFavorite = !p.isFavorite;
  await db.put('products', p);
  return p;
}

export async function getFavorites() {
  const all = await db.getAll('products');
  return all.filter((p) => p.isFavorite);
}

export async function searchProducts(query) {
  const all = await db.getAll('products');
  if (!query || !query.trim()) return all;
  const q = query.trim().toLowerCase();
  return all.filter((p) => p.name.toLowerCase().includes(q));
}

export async function getByCategory(category) {
  return db.getAllByIndex('products', 'byCategory', category);
}

// --- Recents ---

const MAX_RECENTS = 30;

export async function touchRecent(productId) {
  await db.put('recents', { productId, lastUsedAt: Date.now() });
  const all = await db.getAll('recents');
  if (all.length > MAX_RECENTS) {
    const sorted = all.sort((a, b) => a.lastUsedAt - b.lastUsedAt);
    const toRemove = sorted.slice(0, all.length - MAX_RECENTS);
    for (const r of toRemove) await db.delete('recents', r.productId);
  }
}

export async function getRecentProducts() {
  const recents = await db.getAll('recents');
  recents.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  const products = [];
  for (const r of recents) {
    const p = await db.get('products', r.productId);
    if (p) products.push(p);
  }
  return products;
}
