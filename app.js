// app.js — головний контролер застосунку
import { ensureSeeded, getAllProducts, createProduct, toggleFavorite, getFavorites, searchProducts, getByCategory, getRecentProducts } from './products.js';
import { getGoals, addEntry, deleteEntry, getDayTotals, entryTotals, copyDay } from './nutrition.js';
import { generateDailyInsights, dayScore } from './analysis.js';
import { todayKey, shiftDate, formatDateHuman, round1, calcForGrams, MEAL_LABELS, CATEGORY_LABELS, debounce } from './utils.js';

const state = {
  currentDate: todayKey(),
  goals: null,
  entries: [],
  totals: { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  activeMeal: null, // meal we're currently adding food to
};

const el = (sel, root = document) => root.querySelector(sel);
const elAll = (sel, root = document) => Array.from(root.querySelectorAll(sel));

async function init() {
  await ensureSeeded();
  state.goals = await getGoals();
  bindHeaderNav();
  bindModals();
  await refreshDay();
  registerServiceWorker();
}

async function refreshDay() {
  const { entries, totals } = await getDayTotals(state.currentDate);
  state.entries = entries;
  state.totals = totals;
  renderDateHeader();
  renderRing();
  renderMacroCards();
  renderMeals();
  renderDigest();
}

// ---------- Header / date navigation ----------

function bindHeaderNav() {
  el('#prevDay').addEventListener('click', () => changeDate(-1));
  el('#nextDay').addEventListener('click', () => changeDate(1));
  el('#copyYesterday').addEventListener('click', async () => {
    const yesterday = shiftDate(state.currentDate, -1);
    await copyDay(yesterday, state.currentDate);
    await refreshDay();
    toast('Учорашній день скопійовано');
  });
}

function changeDate(delta) {
  state.currentDate = shiftDate(state.currentDate, delta);
  refreshDay();
}

function renderDateHeader() {
  el('#dateLabel').textContent = formatDateHuman(state.currentDate);
}

// ---------- Ring + macro cards ----------

function renderRing() {
  const { kcal } = state.totals;
  const goal = state.goals.kcal;
  const pct = Math.max(0, Math.min(1, kcal / goal));
  const circumference = 2 * Math.PI * 80;
  const offset = circumference * (1 - pct);
  const ring = el('#ringProgress');
  ring.style.strokeDasharray = `${circumference}`;
  ring.style.strokeDashoffset = `${offset}`;
  ring.classList.toggle('ring--over', kcal > goal);

  el('#ringCurrent').textContent = Math.round(kcal);
  el('#ringGoal').textContent = `/ ${goal} ккал`;

  const remaining = goal - kcal;
  const remainingEl = el('#ringRemaining');
  if (remaining >= 0) {
    remainingEl.textContent = `Залишилось ${Math.round(remaining)} ккал`;
    remainingEl.classList.remove('text-over');
  } else {
    remainingEl.textContent = `Перевищено на ${Math.round(-remaining)} ккал`;
    remainingEl.classList.add('text-over');
  }
}

function macroCardConfig() {
  return [
    { key: 'protein', label: 'Білки', icon: '🥩', className: 'macro--protein' },
    { key: 'fat', label: 'Жири', icon: '🥑', className: 'macro--fat' },
    { key: 'carbs', label: 'Вуглеводи', icon: '🍚', className: 'macro--carbs' },
  ];
}

function renderMacroCards() {
  const container = el('#macroCards');
  container.innerHTML = '';
  for (const cfg of macroCardConfig()) {
    const current = state.totals[cfg.key];
    const goal = state.goals[cfg.key];
    const pct = goal ? Math.min(100, Math.round((current / goal) * 100)) : 0;

    const card = document.createElement('div');
    card.className = `macro-card ${cfg.className}`;
    card.innerHTML = `
      <div class="macro-card__top">
        <span class="macro-card__icon">${cfg.icon}</span>
        <span class="macro-card__label">${cfg.label}</span>
      </div>
      <div class="macro-card__values">
        <span class="macro-card__current">${round1(current)}</span>
        <span class="macro-card__goal">/ ${goal} г</span>
      </div>
      <div class="macro-card__bar">
        <div class="macro-card__bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="macro-card__pct">${pct}%</div>
    `;
    container.appendChild(card);
  }
}

// ---------- Meals ----------

function renderMeals() {
  const container = el('#mealsList');
  container.innerHTML = '';

  for (const mealKey of Object.keys(MEAL_LABELS)) {
    const meta = MEAL_LABELS[mealKey];
    const mealEntries = state.entries.filter((e) => e.meal === mealKey);
    const mealKcal = mealEntries.reduce((sum, e) => sum + entryTotals(e).kcal, 0);

    const section = document.createElement('div');
    section.className = 'meal-section';
    section.innerHTML = `
      <div class="meal-section__header">
        <div class="meal-section__title">
          <span class="meal-section__icon">${meta.icon}</span>
          <span>${meta.label}</span>
          ${mealEntries.length ? `<span class="meal-section__kcal">${Math.round(mealKcal)} ккал</span>` : ''}
        </div>
        <button class="btn-add" data-meal="${mealKey}" aria-label="Додати до ${meta.label}">+</button>
      </div>
      <div class="meal-section__items"></div>
    `;

    const itemsRoot = el('.meal-section__items', section);
    if (mealEntries.length === 0) {
      itemsRoot.innerHTML = `<div class="meal-empty">Ще нічого не додано</div>`;
    } else {
      for (const entry of mealEntries) {
        itemsRoot.appendChild(renderFoodItem(entry));
      }
    }

    section.querySelector('.btn-add').addEventListener('click', () => openAddFoodModal(mealKey));
    container.appendChild(section);
  }
}

function renderFoodItem(entry) {
  const t = entryTotals(entry);
  const item = document.createElement('div');
  item.className = 'food-item';
  item.innerHTML = `
    <div class="food-item__info">
      <div class="food-item__name">${entry.productSnapshot.name}</div>
      <div class="food-item__meta">${entry.grams} г · ${Math.round(t.kcal)} ккал</div>
    </div>
    <button class="food-item__delete" aria-label="Видалити">✕</button>
  `;
  item.querySelector('.food-item__delete').addEventListener('click', async () => {
    await deleteEntry(entry.id);
    await refreshDay();
    toast('Продукт видалено', async () => {
      // Undo: re-add the same entry
      await addEntry({
        date: entry.date,
        meal: entry.meal,
        product: { id: entry.productId, ...entry.productSnapshot },
        grams: entry.grams,
      });
      await refreshDay();
    });
  });
  return item;
}

// ---------- Digest ----------

function renderDigest() {
  const digestRoot = el('#digest');
  if (state.entries.length === 0) {
    digestRoot.classList.add('digest--hidden');
    return;
  }
  digestRoot.classList.remove('digest--hidden');
  const score = dayScore(state.totals, state.goals);
  const insights = generateDailyInsights(state.entries, state.totals, state.goals);

  el('#digestScore').textContent = `${score.toFixed(1)} / 10`;
  el('#digestStars').textContent = starString(score);
  const list = el('#digestInsights');
  list.innerHTML = '';
  for (const insight of insights) {
    const li = document.createElement('li');
    li.textContent = insight;
    list.appendChild(li);
  }
}

function starString(score) {
  const filled = Math.round(score / 2);
  return '⭐'.repeat(filled) + '☆'.repeat(5 - filled);
}

// ---------- Toast ----------

let toastTimer = null;
function toast(message, onUndo) {
  const root = el('#toast');
  clearTimeout(toastTimer);
  root.innerHTML = `<span>${message}</span>${onUndo ? '<button class="toast__undo">Скасувати</button>' : ''}`;
  root.classList.add('toast--visible');
  if (onUndo) {
    el('.toast__undo', root).addEventListener('click', () => {
      onUndo();
      root.classList.remove('toast--visible');
    });
  }
  toastTimer = setTimeout(() => root.classList.remove('toast--visible'), 4000);
}

// ---------- Add Food Modal ----------

let addFoodTab = 'search';

function bindModals() {
  el('#addFoodModal .modal__backdrop').addEventListener('click', closeAddFoodModal);
  el('#addFoodModal .modal__close').addEventListener('click', closeAddFoodModal);
  el('#foodSearchInput').addEventListener('input', debounce(onFoodSearch, 200));

  elAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      addFoodTab = btn.dataset.tab;
      elAll('.tab-btn').forEach((b) => b.classList.toggle('tab-btn--active', b === btn));
      renderAddFoodList();
    });
  });

  el('#createProductBtn').addEventListener('click', openCreateProductModal);

  // Create product modal
  el('#createProductModal .modal__backdrop').addEventListener('click', closeCreateProductModal);
  el('#createProductModal .modal__close').addEventListener('click', closeCreateProductModal);
  el('#createProductForm').addEventListener('submit', onCreateProductSubmit);
  el('#productUnit').addEventListener('change', (e) => {
    el('#unitWeightRow').classList.toggle('hidden', e.target.value !== 'piece');
  });

  // Grams modal
  el('#gramsModal .modal__backdrop').addEventListener('click', closeGramsModal);
  el('#gramsModal .modal__close').addEventListener('click', closeGramsModal);
  el('#gramsForm').addEventListener('submit', onGramsSubmit);
  el('#gramsInput').addEventListener('input', updateGramsPreview);
}

function openAddFoodModal(mealKey) {
  state.activeMeal = mealKey;
  el('#addFoodModal .modal__title').textContent = `${MEAL_LABELS[mealKey].icon} ${MEAL_LABELS[mealKey].label}`;
  el('#foodSearchInput').value = '';
  addFoodTab = 'search';
  elAll('.tab-btn').forEach((b) => b.classList.toggle('tab-btn--active', b.dataset.tab === 'search'));
  openModal('#addFoodModal');
  renderAddFoodList();
  setTimeout(() => el('#foodSearchInput').focus(), 100);
}

function closeAddFoodModal() {
  closeModal('#addFoodModal');
  state.activeMeal = null;
}

async function onFoodSearch(e) {
  const query = e.target.value;
  if (query.trim()) {
    addFoodTab = 'search';
    elAll('.tab-btn').forEach((b) => b.classList.remove('tab-btn--active'));
  }
  renderAddFoodList(query);
}

async function renderAddFoodList(query = '') {
  const listRoot = el('#foodList');
  listRoot.innerHTML = '<div class="food-list__loading">Завантаження…</div>';

  let products = [];
  let groupByCategory = false;

  if (query && query.trim()) {
    products = await searchProducts(query);
  } else if (addFoodTab === 'recent') {
    products = await getRecentProducts();
  } else if (addFoodTab === 'favorites') {
    products = await getFavorites();
  } else {
    products = await getAllProducts();
    groupByCategory = true;
  }

  listRoot.innerHTML = '';

  if (products.length === 0) {
    listRoot.innerHTML = `<div class="food-list__empty">Нічого не знайдено</div>`;
    return;
  }

  if (groupByCategory) {
    const byCategory = {};
    for (const p of products) {
      (byCategory[p.category] ||= []).push(p);
    }
    for (const catKey of Object.keys(CATEGORY_LABELS)) {
      const items = byCategory[catKey];
      if (!items || !items.length) continue;
      const group = document.createElement('div');
      group.className = 'food-category';
      group.innerHTML = `<div class="food-category__title">${CATEGORY_LABELS[catKey].icon} ${CATEGORY_LABELS[catKey].label}</div>`;
      const wrap = document.createElement('div');
      for (const p of items) wrap.appendChild(renderProductRow(p));
      group.appendChild(wrap);
      listRoot.appendChild(group);
    }
  } else {
    for (const p of products) listRoot.appendChild(renderProductRow(p));
  }
}

function renderProductRow(product) {
  const row = document.createElement('button');
  row.type = 'button';
  row.className = 'product-row';
  const unitLabel = product.unit === 'piece' ? '1 шт' : '100 г';
  row.innerHTML = `
    <div class="product-row__main">
      <div class="product-row__name">${product.name}</div>
      <div class="product-row__meta">${Math.round(product.kcal)} ккал · Б${round1(product.protein)} Ж${round1(product.fat)} В${round1(product.carbs)} · ${unitLabel}</div>
    </div>
    <span class="product-row__fav ${product.isFavorite ? 'product-row__fav--active' : ''}">★</span>
  `;
  row.querySelector('.product-row__fav').addEventListener('click', async (e) => {
    e.stopPropagation();
    await toggleFavorite(product.id);
    renderAddFoodList(el('#foodSearchInput').value);
  });
  row.addEventListener('click', () => openGramsModal(product));
  return row;
}

// ---------- Grams modal ----------

let gramsProduct = null;

function openGramsModal(product) {
  gramsProduct = product;
  const isPiece = product.unit === 'piece';
  el('#gramsModal .modal__title').textContent = product.name;
  el('#gramsInput').value = isPiece ? 1 : 100;
  el('#gramsUnitLabel').textContent = isPiece ? 'шт' : 'г';
  updateGramsPreview();
  openModal('#gramsModal');
  setTimeout(() => el('#gramsInput').select(), 100);
}

function closeGramsModal() {
  closeModal('#gramsModal');
  gramsProduct = null;
}

function gramsFromInput() {
  if (!gramsProduct) return 0;
  const inputVal = parseFloat(el('#gramsInput').value) || 0;
  return gramsProduct.unit === 'piece' ? inputVal * (gramsProduct.unitWeight || 1) : inputVal;
}

function updateGramsPreview() {
  if (!gramsProduct) return;
  const grams = gramsFromInput();
  const preview = calcForGrams(gramsProduct, grams);
  el('#previewKcal').textContent = Math.round(preview.kcal);
  el('#previewProtein').textContent = round1(preview.protein);
  el('#previewFat').textContent = round1(preview.fat);
  el('#previewCarbs').textContent = round1(preview.carbs);
}

async function onGramsSubmit(e) {
  e.preventDefault();
  if (!gramsProduct || !state.activeMeal) return;
  const grams = gramsFromInput();

  await addEntry({
    date: state.currentDate,
    meal: state.activeMeal,
    product: gramsProduct,
    grams: round1(grams),
  });

  closeGramsModal();
  closeAddFoodModal();
  await refreshDay();
  toast(`${gramsProduct.name} додано`);
}

// ---------- Create product modal ----------

function openCreateProductModal() {
  el('#createProductForm').reset();
  el('#unitWeightRow').classList.add('hidden');
  openModal('#createProductModal');
}

function closeCreateProductModal() {
  closeModal('#createProductModal');
}

async function onCreateProductSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const unit = form.productUnit.value;
  const product = await createProduct({
    name: form.productName.value.trim(),
    category: form.productCategory.value,
    kcal: parseFloat(form.productKcal.value) || 0,
    protein: parseFloat(form.productProtein.value) || 0,
    fat: parseFloat(form.productFat.value) || 0,
    carbs: parseFloat(form.productCarbs.value) || 0,
    unit,
    unitWeight: unit === 'piece' ? parseFloat(form.productUnitWeight.value) || 1 : null,
  });
  closeCreateProductModal();
  toast('Продукт створено');
  addFoodTab = 'search';
  renderAddFoodList();
  openGramsModal(product);
}

// ---------- Modal helpers ----------

function openModal(sel) {
  el(sel).classList.add('modal--open');
  document.body.classList.add('no-scroll');
}

function closeModal(sel) {
  el(sel).classList.remove('modal--open');
  if (!elAll('.modal--open').length) document.body.classList.remove('no-scroll');
}

// ---------- PWA ----------

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
