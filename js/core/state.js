'use strict';
/* ================= СОСТОЯНИЕ ================= */
const S = {
  started: false,
  role: 'client',
  time: '08:40',
  me: { name: 'Азамат', phone: '+996 555 12 34 56', pointId: 'p1' },
  ctab: 'home',
  cview: null,
  typeFilter: 'all',
  dfeed: { cat: 'all', q: '', sort: 'price' }, // лента блюд: категория, поиск, порядок предложений
  otab: 'list', // вкладка «Заказы»: list — заказы, stats — статистика
  cstat: '30', // период статистики клиента, дней
  carts: {},
  co: { comment: '', pay: null, receipt: '' },
  lastCart: null,
  lastOrder: null,
  kid: 'k1',
  kw: 'full',
  kside: 'open', // левая панель кабинета: open — раскрыта, mini — свёрнута до значков
  kcl: { q: '', point: 'all', sort: 'last', period: '30', all: false }, // раздел «Клиенты»
  ktab: 'dash',
  kst: 'request',
  kpoint: 'all',
  kview: 'board',
  ktf: 'all',
  ksort: 'num',
  mdoc: null,
  rep: '7',
  sheet: null,
  map: { client: null, kitchen: null, sel: null, real: null, prov: null },
};
/* настройки вида кабинета запоминаются в браузере */
const UI_KEY = 'okat.ui';
function saveUi() {
  try {
    localStorage.setItem(UI_KEY, JSON.stringify({ kw: S.kw, kside: S.kside }));
  } catch (err) {}
}
try {
  const ui = JSON.parse(localStorage.getItem(UI_KEY) || '{}');
  if (['full', 'center'].includes(ui.kw)) S.kw = ui.kw;
  if (['open', 'mini'].includes(ui.kside)) S.kside = ui.kside;
} catch (err) {}
