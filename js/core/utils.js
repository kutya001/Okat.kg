'use strict';
/* ================= ПОМОЩНИКИ ================= */
const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
const fmt = n =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const som = n => fmt(n) + ' сом';
const pl = (n, f) => {
  const a = Math.abs(n) % 100,
    b = a % 10;
  return f[a > 10 && a < 20 ? 2 : b > 1 && b < 5 ? 1 : b === 1 ? 0 : 2];
};
const P_MAN = ['человек', 'человека', 'человек'],
  P_POR = ['порция', 'порции', 'порций'],
  P_ORD = ['заказ', 'заказа', 'заказов'],
  P_REQ = ['заявка', 'заявки', 'заявок'],
  P_POS = ['позиция', 'позиции', 'позиций'],
  P_DISH = ['блюдо', 'блюда', 'блюд'],
  P_PT = ['точка', 'точки', 'точек'];
const toMin = t => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const minToT = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const durTxt = m => (m >= 60 ? Math.floor(m / 60) + ' ч' + (m % 60 ? ' ' + (m % 60) + ' мин' : '') : m + ' мин');
const sumBy = (a, f) => a.reduce((s, x) => s + f(x), 0);
function rng(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const NOW = new Date();
const dayDate = off => {
  const d = new Date(NOW);
  d.setDate(d.getDate() + off);
  return d;
};
const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
  WDL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const MON = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];
const dateLong = d => d.getDate() + ' ' + MON[d.getMonth()];
/* читает выбранную картинку, уменьшает до max пикселей по длинной стороне и отдаёт как data-URL */
function readImage(file, max, done, fail) {
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height)),
        cv = document.createElement('canvas');
      cv.width = Math.round(im.width * k);
      cv.height = Math.round(im.height * k);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      done(cv.toDataURL('image/jpeg', 0.82));
    };
    im.onerror = fail;
    im.src = rd.result;
  };
  rd.onerror = fail;
  rd.readAsDataURL(file);
}
