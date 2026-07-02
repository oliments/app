// utils.js

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function shiftDate(dateKey, days) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return todayKey(date);
}

const WEEKDAYS_UA = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS_UA = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
];

export function formatDateHuman(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = todayKey();
  const yesterday = shiftDate(today, -1);
  const tomorrow = shiftDate(today, 1);

  if (dateKey === today) return 'Сьогодні';
  if (dateKey === yesterday) return 'Учора';
  if (dateKey === tomorrow) return 'Завтра';

  const weekday = WEEKDAYS_UA[date.getDay()];
  return `${weekday}, ${d} ${MONTHS_UA[m - 1]}`;
}

export function round1(n) {
  return Math.round(n * 10) / 10;
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// Обчислює КБЖВ для заданої ваги продукту (значення продукту зберігаються на 100г або на 1 шт)
export function calcForGrams(product, grams) {
  let factor;
  if (product.unit === 'piece') {
    factor = grams / (product.unitWeight || 1);
  } else {
    factor = grams / 100;
  }
  return {
    kcal: product.kcal * factor,
    protein: product.protein * factor,
    fat: product.fat * factor,
    carbs: product.carbs * factor,
  };
}

export const MEAL_LABELS = {
  breakfast: { label: 'Сніданок', icon: '🍳' },
  lunch: { label: 'Обід', icon: '🥪' },
  dinner: { label: 'Вечеря', icon: '🍝' },
  snack: { label: 'Перекуси', icon: '🍎' },
};

export const CATEGORY_LABELS = {
  meat: { label: "М'ясо", icon: '🥩' },
  grains: { label: 'Крупи', icon: '🍚' },
  dairy: { label: 'Молочне', icon: '🥛' },
  vegetables: { label: 'Овочі', icon: '🥦' },
  fruits: { label: 'Фрукти', icon: '🍎' },
  drinks: { label: 'Напої', icon: '🥤' },
  sauces: { label: 'Соуси', icon: '🧂' },
  sweets: { label: 'Солодощі', icon: '🍫' },
  other: { label: 'Інше', icon: '📦' },
};
