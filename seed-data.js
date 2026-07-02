// seed-data.js
// Базова колекція продуктів (на 100г, якщо не вказано інше).
// kcal, protein, fat, carbs

export const SEED_PRODUCTS = [
  // М'ясо
  { name: 'Куряче філе', category: 'meat', kcal: 110, protein: 23, fat: 2, carbs: 0, unit: 'g' },
  { name: 'Куряче стегно без шкіри', category: 'meat', kcal: 179, protein: 20, fat: 10.5, carbs: 0, unit: 'g' },
  { name: 'Яловичина, нежирна', category: 'meat', kcal: 158, protein: 22, fat: 7.5, carbs: 0, unit: 'g' },
  { name: 'Свинина, вирізка', category: 'meat', kcal: 143, protein: 21, fat: 6, carbs: 0, unit: 'g' },
  { name: 'Індичка, філе', category: 'meat', kcal: 104, protein: 22, fat: 1.5, carbs: 0, unit: 'g' },
  { name: 'Фарш яловичий 15%', category: 'meat', kcal: 215, protein: 18, fat: 15, carbs: 0, unit: 'g' },
  { name: 'Лосось', category: 'meat', kcal: 208, protein: 20, fat: 13, carbs: 0, unit: 'g' },
  { name: 'Тунець консервований', category: 'meat', kcal: 116, protein: 26, fat: 1, carbs: 0, unit: 'g' },
  { name: 'Креветки', category: 'meat', kcal: 99, protein: 21, fat: 1.5, carbs: 0.2, unit: 'g' },
  { name: 'Яйце', category: 'meat', kcal: 70, protein: 6, fat: 5, carbs: 0.4, unit: 'piece', unitWeight: 55 },

  // Крупи
  { name: 'Рис білий, варений', category: 'grains', kcal: 130, protein: 2.4, fat: 0.3, carbs: 28, unit: 'g' },
  { name: 'Гречка, варена', category: 'grains', kcal: 92, protein: 3.4, fat: 0.6, carbs: 20, unit: 'g' },
  { name: 'Вівсянка, суха', category: 'grains', kcal: 372, protein: 13, fat: 7, carbs: 62, unit: 'g' },
  { name: 'Кіноа, варена', category: 'grains', kcal: 120, protein: 4.4, fat: 1.9, carbs: 21, unit: 'g' },
  { name: 'Макарони, варені', category: 'grains', kcal: 131, protein: 5, fat: 1.1, carbs: 25, unit: 'g' },
  { name: 'Хліб цільнозерновий', category: 'grains', kcal: 247, protein: 9, fat: 3.5, carbs: 42, unit: 'g' },
  { name: 'Булгур, варений', category: 'grains', kcal: 83, protein: 3, fat: 0.2, carbs: 18.5, unit: 'g' },

  // Молочне
  { name: 'Йогурт грецький 2%', category: 'dairy', kcal: 73, protein: 9, fat: 2, carbs: 4, unit: 'g' },
  { name: 'Творог 5%', category: 'dairy', kcal: 121, protein: 17, fat: 5, carbs: 3, unit: 'g' },
  { name: 'Молоко 2.5%', category: 'dairy', kcal: 52, protein: 2.8, fat: 2.5, carbs: 4.7, unit: 'g' },
  { name: 'Сир твердий', category: 'dairy', kcal: 350, protein: 25, fat: 27, carbs: 1.3, unit: 'g' },
  { name: 'Кефір 1%', category: 'dairy', kcal: 40, protein: 3, fat: 1, carbs: 4, unit: 'g' },
  { name: 'Моцарела', category: 'dairy', kcal: 280, protein: 22, fat: 21, carbs: 2.2, unit: 'g' },

  // Овочі
  { name: 'Броколі', category: 'vegetables', kcal: 34, protein: 2.8, fat: 0.4, carbs: 7, unit: 'g' },
  { name: 'Помідор', category: 'vegetables', kcal: 18, protein: 0.9, fat: 0.2, carbs: 3.9, unit: 'g' },
  { name: 'Огірок', category: 'vegetables', kcal: 15, protein: 0.7, fat: 0.1, carbs: 3.6, unit: 'g' },
  { name: 'Авокадо', category: 'vegetables', kcal: 160, protein: 2, fat: 14.7, carbs: 8.5, unit: 'g' },
  { name: 'Шпинат', category: 'vegetables', kcal: 23, protein: 2.9, fat: 0.4, carbs: 3.6, unit: 'g' },
  { name: 'Кабачок', category: 'vegetables', kcal: 17, protein: 1.2, fat: 0.3, carbs: 3.1, unit: 'g' },
  { name: 'Морква', category: 'vegetables', kcal: 41, protein: 0.9, fat: 0.2, carbs: 10, unit: 'g' },
  { name: 'Картопля, варена', category: 'vegetables', kcal: 87, protein: 1.9, fat: 0.1, carbs: 20, unit: 'g' },

  // Фрукти
  { name: 'Банан', category: 'fruits', kcal: 96, protein: 1.1, fat: 0.3, carbs: 22, unit: 'piece', unitWeight: 120 },
  { name: 'Яблуко', category: 'fruits', kcal: 52, protein: 0.3, fat: 0.2, carbs: 14, unit: 'piece', unitWeight: 180 },
  { name: 'Апельсин', category: 'fruits', kcal: 47, protein: 0.9, fat: 0.1, carbs: 12, unit: 'piece', unitWeight: 170 },
  { name: 'Ягоди мікс', category: 'fruits', kcal: 45, protein: 0.7, fat: 0.3, carbs: 10, unit: 'g' },

  // Напої
  { name: 'Кава чорна', category: 'drinks', kcal: 2, protein: 0.3, fat: 0, carbs: 0, unit: 'g' },
  { name: 'Протеїновий коктейль на воді', category: 'drinks', kcal: 110, protein: 22, fat: 1.5, carbs: 3, unit: 'g' },

  // Соуси
  { name: 'Оливкова олія', category: 'sauces', kcal: 884, protein: 0, fat: 100, carbs: 0, unit: 'g' },
  { name: 'Соєвий соус', category: 'sauces', kcal: 53, protein: 8, fat: 0.1, carbs: 4.9, unit: 'g' },
  { name: 'Майонез', category: 'sauces', kcal: 680, protein: 1, fat: 75, carbs: 2.6, unit: 'g' },

  // Солодощі
  { name: 'Темний шоколад 70%', category: 'sweets', kcal: 546, protein: 7.8, fat: 38, carbs: 45, unit: 'g' },
  { name: 'Мед', category: 'sweets', kcal: 304, protein: 0.3, fat: 0, carbs: 82, unit: 'g' },
];
