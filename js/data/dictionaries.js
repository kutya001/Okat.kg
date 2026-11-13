'use strict';
/* ================= СПРАВОЧНИКИ ================= */
const TYPES = {
  kitchen: { label: 'Кухня на доставку', short: 'Кухня', many: 'Кухни', icon: '🍲' },
  canteen: { label: 'Столовая', short: 'Столовая', many: 'Столовые', icon: '🍽️' },
  cafe: { label: 'Кафе', short: 'Кафе', many: 'Кафе', icon: '☕' },
  rest: { label: 'Ресторан', short: 'Ресторан', many: 'Рестораны', icon: '🍴' },
};
const CATS = [
  { id: 'combo', n: 'Комплексы' },
  { id: 'first', n: 'Первое' },
  { id: 'second', n: 'Второе' },
  { id: 'salad', n: 'Салаты' },
  { id: 'bake', n: 'Выпечка и хлеб' },
  { id: 'drink', n: 'Напитки' },
];
const LIM = { combo: 30, first: 20, second: 25, salad: 20, bake: 40, drink: 60 };
const PAY = {
  cash: { s: 'Наличные', l: 'Наличными при получении' },
  mbank: { s: 'MBank', l: 'Перевод MBank' },
  odengi: { s: 'О!Деньги', l: 'Перевод О!Деньги' },
  bakai: { s: 'Bakai', l: 'Перевод Bakai' },
};
/* метки пользы: кухня отмечает их в карточке блюда сама */
const TAGS = {
  light: 'Лёгкое',
  protein: 'Много белка',
  fiber: 'Клетчатка',
  veg: 'Без мяса',
  steam: 'Без жарки',
  nosugar: 'Без сахара',
  spicy: 'Острое',
};
const STATUS = {
  request: 'Заявка',
  confirmed: 'Принят',
  cooking: 'Готовится',
  delivering: 'В пути',
  delivered: 'Доставлен',
  rejected: 'Отклонён',
  cancelled: 'Отменён',
};
const ACTIVE = ['request', 'confirmed', 'cooking', 'delivering', 'delivered'],
  REAL = ['confirmed', 'cooking', 'delivering', 'delivered'];
const EMO = [
  '🍲',
  '🍜',
  '🍚',
  '🥟',
  '🍛',
  '🥘',
  '🍗',
  '🐟',
  '🥗',
  '🍅',
  '🥣',
  '🥧',
  '🫓',
  '🥐',
  '🥞',
  '🍱',
  '🧃',
  '🍵',
  '🥛',
  '🥤',
];
