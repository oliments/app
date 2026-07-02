// storage.js
// Тонка обгортка над IndexedDB. Без залежностей, без бекенду.
// Схема:
//   products   { id, name, kcal, protein, fat, carbs, unit ('g'|'piece'), unitWeight, category, isCustom, isFavorite, createdAt }
//   entries    { id, date ('YYYY-MM-DD'), meal ('breakfast'|'lunch'|'dinner'|'snack'), productId, productSnapshot, grams, createdAt }
//   recents    { productId, lastUsedAt }
//   weight     { id, date, kg }
//   settings   { key, value }

const DB_NAME = 'mara-nutrition';
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains('products')) {
        const products = db.createObjectStore('products', { keyPath: 'id' });
        products.createIndex('byCategory', 'category');
        products.createIndex('byFavorite', 'isFavorite');
        products.createIndex('byName', 'name');
      }

      if (!db.objectStoreNames.contains('entries')) {
        const entries = db.createObjectStore('entries', { keyPath: 'id' });
        entries.createIndex('byDate', 'date');
        entries.createIndex('byDateMeal', ['date', 'meal']);
      }

      if (!db.objectStoreNames.contains('recents')) {
        db.createObjectStore('recents', { keyPath: 'productId' });
      }

      if (!db.objectStoreNames.contains('weight')) {
        const weight = db.createObjectStore('weight', { keyPath: 'id' });
        weight.createIndex('byDate', 'date');
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
  return dbPromise;
}

function tx(storeName, mode = 'readonly') {
  return openDB().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

function promisifyRequest(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const db = {
  async put(storeName, value) {
    const store = await tx(storeName, 'readwrite');
    return promisifyRequest(store.put(value));
  },

  async get(storeName, key) {
    const store = await tx(storeName, 'readonly');
    return promisifyRequest(store.get(key));
  },

  async getAll(storeName) {
    const store = await tx(storeName, 'readonly');
    return promisifyRequest(store.getAll());
  },

  async getAllByIndex(storeName, indexName, query) {
    const store = await tx(storeName, 'readonly');
    const index = store.index(indexName);
    return promisifyRequest(index.getAll(query));
  },

  async delete(storeName, key) {
    const store = await tx(storeName, 'readwrite');
    return promisifyRequest(store.delete(key));
  },

  async clear(storeName) {
    const store = await tx(storeName, 'readwrite');
    return promisifyRequest(store.clear());
  },

  async count(storeName) {
    const store = await tx(storeName, 'readonly');
    return promisifyRequest(store.count());
  },
};

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
