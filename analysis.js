// analysis.js
// Просте, повністю локальне, правило-орієнтоване формування інсайтів.
// Це НЕ звернення до зовнішнього AI — усі формулювання генеруються з чисел дня.
// Задокументовано навмисно: якщо у майбутньому захочеш підключити справжній
// AI-аналіз (наприклад, через Anthropic API), цей модуль — правильне місце
// для заміни generateDailyInsights() на виклик API з переданими totals/goals.

import { entryTotals } from './nutrition.js';
import { MEAL_LABELS } from './utils.js';

export function generateDailyInsights(entries, totals, goals) {
  const insights = [];

  if (entries.length === 0) {
    return ['Ще немає записів за цей день.'];
  }

  const kcalDiff = totals.kcal - goals.kcal;
  const proteinPct = goals.protein ? (totals.protein / goals.protein) * 100 : 0;
  const fatPct = goals.fat ? (totals.fat / goals.fat) * 100 : 0;

  // Калорійність
  if (Math.abs(kcalDiff) <= goals.kcal * 0.05) {
    insights.push('Калорійність залишилася в межах цілі.');
  } else if (kcalDiff > 0) {
    insights.push(`Перевищення калорій на ${Math.round(kcalDiff)} ккал.`);
  } else {
    insights.push(`Недобір калорій: ${Math.round(-kcalDiff)} ккал до цілі.`);
  }

  // Білок
  if (proteinPct >= 95) {
    insights.push('Чудово виконано норму білка.');
  } else if (proteinPct >= 70) {
    insights.push(`Білка трохи не вистачає — ${Math.round(goals.protein - totals.protein)} г до цілі.`);
  } else {
    insights.push(`Білка суттєво недостатньо — ${Math.round(goals.protein - totals.protein)} г до цілі.`);
  }

  // Жири
  if (fatPct > 115) {
    insights.push('Жирів було трохи забагато.');
  } else if (fatPct < 60) {
    insights.push('Жирів менше, ніж зазвичай варто вживати.');
  }

  // Овочі / клітковина — грубо оцінюємо за категорією продуктів
  const hasVeg = entries.some((e) => e.productSnapshot && /овоч|броколі|шпинат|огірок|кабачок|морква|помідор/i.test(e.productSnapshot.name));
  if (!hasVeg) {
    insights.push('Овочів сьогодні було небагато.');
  }

  // Який прийом їжі дав найбільше калорій
  const byMeal = {};
  for (const e of entries) {
    const t = entryTotals(e);
    byMeal[e.meal] = (byMeal[e.meal] || 0) + t.kcal;
  }
  const topMeal = Object.entries(byMeal).sort((a, b) => b[1] - a[1])[0];
  if (topMeal) {
    const label = MEAL_LABELS[topMeal[0]]?.label || topMeal[0];
    insights.push(`Основна частина калорій припала на прийом їжі «${label.toLowerCase()}».`);
  }

  return insights;
}

export function dayScore(totals, goals) {
  const kcalScore = 1 - Math.min(1, Math.abs(totals.kcal - goals.kcal) / goals.kcal);
  const proteinScore = Math.min(1, totals.protein / goals.protein);
  const fatPenalty = totals.fat > goals.fat * 1.15 ? 0.15 : 0;
  const raw = kcalScore * 0.4 + proteinScore * 0.4 + 0.2 - fatPenalty;
  return Math.max(0, Math.min(10, Math.round(raw * 100) / 10));
}
