// nutrition.js
import { db, uid } from './storage.js';
import { calcForGrams } from './utils.js';
import { touchRecent } from './products.js';

const DEFAULT_GOALS = { kcal: 1800, protein: 130, fat: 60, carbs: 180 };

export async function getGoals() {
  const saved = await db.get('settings', 'goals');
  return saved ? saved.value : DEFAULT_GOALS;
}

export async function setGoals(goals) {
  await db.put('settings', { key: 'goals', value: goals });
}

export async function addEntry({ date, meal, product, grams }) {
  const entry = {
    id: uid(),
    date,
    meal,
    productId: product.id,
    productSnapshot: {
      name: product.name,
      kcal: product.kcal,
      protein: product.protein,
      fat: product.fat,
      carbs: product.carbs,
      unit: product.unit,
      unitWeight: product.unitWeight,
    },
    grams,
    createdAt: Date.now(),
  };
  await db.put('entries', entry);
  await touchRecent(product.id);
  return entry;
}

export async function updateEntry(id, patch) {
  const existing = await db.get('entries', id);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  await db.put('entries', updated);
  return updated;
}

export async function deleteEntry(id) {
  await db.delete('entries', id);
}

export async function getEntriesForDate(date) {
  return db.getAllByIndex('entries', 'byDate', date);
}

export async function getEntriesForMeal(date, meal) {
  return db.getAllByIndex('entries', 'byDateMeal', [date, meal]);
}

export function entryTotals(entry) {
  return calcForGrams(entry.productSnapshot, entry.grams);
}

export function sumTotals(entries) {
  return entries.reduce(
    (acc, e) => {
      const t = entryTotals(e);
      acc.kcal += t.kcal;
      acc.protein += t.protein;
      acc.fat += t.fat;
      acc.carbs += t.carbs;
      return acc;
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0 }
  );
}

export async function getDayTotals(date) {
  const entries = await getEntriesForDate(date);
  return { entries, totals: sumTotals(entries) };
}

export async function copyDay(fromDate, toDate) {
  const entries = await getEntriesForDate(fromDate);
  const created = [];
  for (const e of entries) {
    const copy = {
      id: uid(),
      date: toDate,
      meal: e.meal,
      productId: e.productId,
      productSnapshot: e.productSnapshot,
      grams: e.grams,
      createdAt: Date.now(),
    };
    await db.put('entries', copy);
    created.push(copy);
  }
  return created;
}

export async function copyMeal(fromDate, meal, toDate) {
  const entries = await getEntriesForMeal(fromDate, meal);
  const created = [];
  for (const e of entries) {
    const copy = {
      id: uid(),
      date: toDate,
      meal: e.meal,
      productId: e.productId,
      productSnapshot: e.productSnapshot,
      grams: e.grams,
      createdAt: Date.now(),
    };
    await db.put('entries', copy);
    created.push(copy);
  }
  return created;
}
