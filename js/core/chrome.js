'use strict';
/* ================= ВЕРХНЯЯ ПАНЕЛЬ И МЕНЮ =================
   Сверху — парящая панель: слева меню (или «назад» на вложенном экране), в середине главное
   (точка доставки, заведение, название экрана), справа поиск. Снизу — парящая панель разделов.
   Меню открывается из «гамбургера»: разделы и настройки демо-режима. */
function topBar(o) {
  const left = o.back
    ? `<button class="rbtn" data-act="back" aria-label="Назад">${ic('left')}</button>`
    : `<button class="rbtn" data-act="menu" aria-label="Меню" aria-haspopup="dialog">${ic('menu')}${o.dot ? '<i class="dot"></i>' : ''}</button>`;
  const q = o.search
    ? `<label class="tb-q">${ic('search', 19)}<input type="search" value="${esc(o.q)}" data-inp="${o.search}" placeholder="${o.ph}" aria-label="${o.ph}" enterkeyhint="search" autocomplete="off"></label>`
    : '';
  const right = !o.search
    ? o.right || '<span class="tb-sp"></span>'
    : o.qopen
      ? `<button class="rbtn" data-act="qClose" aria-label="Закрыть поиск">${ic('x')}</button>`
      : `<button class="rbtn tb-s" data-act="qOpen" aria-label="Поиск">${ic('search')}</button>`;
  return `<header class="topbar glass ${o.qopen ? 'q' : ''} ${o.search ? 'has-q' : ''}">${left}<span class="nav-logo">Okat</span>${o.main}${q}${right}</header>`;
}
/* середина панели: подпись и главная строка; act — что открыть по нажатию */
const tbMain = (title, sub, act) =>
  act
    ? `<button class="tb-main" ${act}><small>${sub}</small><b><span>${esc(title)}</span>${ic('down', 16)}</b></button>`
    : `<div class="tb-main"><b><span>${esc(title)}</span></b>${sub ? `<small>${sub}</small>` : ''}</div>`;

/* ---------- поиск ---------- */
const searching = () => (S.role === 'client' ? S.qopen || !!S.q.trim() : S.kqopen || !!S.kq.trim());
I.q = (d, el) => {
  S.q = el.value;
  S.qopen = true;
  render();
};
I.kq = (d, el) => {
  S.kq = el.value;
  S.kqopen = true;
  render();
};
A.qOpen = () => {
  if (S.role === 'client') S.qopen = true;
  else S.kqopen = true;
  render();
  const el = $('.tb-q input');
  if (el) el.focus();
};
A.qClose = () => {
  S.q = S.kq = '';
  S.qopen = S.kqopen = false;
  render();
};
A.qSet = d => {
  S.q = d.q;
  S.qopen = true;
  render();
};

/* ---------- меню ---------- */
A.menu = () => {
  S.sheet = { type: 'menu' };
  render();
};
/* переход из меню: закрываем его и поиск, открываем раздел */
A.go = d => {
  S.sheet = null;
  S.q = S.kq = '';
  S.qopen = S.kqopen = false;
  if (S.role === 'client') {
    S.ctab = d.tab;
    S.cview = null;
    if (d.o) S.otab = d.o;
  } else {
    if (d.tab === 'menu') S.mdoc = null;
    S.ktab = d.tab;
  }
  S.map.sel = null;
  render();
};
SHEETS.menu = () => {
  const client = S.role === 'client',
    k = kitchen(S.kid),
    nreq = ORDERS.filter(o => o.kid === S.kid && o.day === 0 && o.status === 'request' && o.isNew).length,
    item = (tab, i, l, on, extra = '', b = '') =>
      `<button class="dr-i ${on ? 'on' : ''}" data-act="go" data-tab="${tab}" ${extra}>${ic(i, 21)}<span>${l}</span>${b ? `<i class="bdg">${b}</i>` : ''}</button>`;
  let head, nav;
  if (client) {
    const act = ORDERS.filter(o => o.clientId === 'me' && o.day === 0 && isActive(o)).length,
      at = t => !S.cview && S.ctab === t;
    head = `<div class="dr-h"><span class="ava">${esc(S.me.name[0])}</span><div><b>${esc(S.me.name)}</b><small>${S.me.phone}</small></div></div>`;
    nav =
      item('home', 'store', 'Заведения', at('home')) +
      item('dishes', 'bowl', 'Блюда', at('dishes')) +
      item('map', 'map', 'Карта', at('map')) +
      item('orders', 'receipt', 'Заказы', at('orders') && S.otab === 'list', 'data-o="list"', act) +
      item('orders', 'chart', 'Статистика', at('orders') && S.otab === 'stats', 'data-o="stats"') +
      item('profile', 'user', 'Профиль', at('profile')) +
      `<button class="dr-i" data-act="sheet" data-sheet="points">${ic('pin', 21)}<span>Точка доставки<small>${esc(point(S.me.pointId).name)}</small></span></button>`;
  } else {
    const st = kStats(S.kid),
      todo = st.req.length + st.chg.length;
    head = `<div class="dr-h"><span class="ava">${k.em}</span><div><b>${esc(k.name)}</b><small>Кабинет заведения</small></div></div>`;
    nav =
      KTABS.map(([id, i, l]) => item(id, i, l, S.ktab === id, '', id === 'orders' && todo ? todo : '')).join('') +
      `<button class="dr-i" data-act="preview">${ic('eye', 21)}<span>Вид клиента</span></button>`;
  }
  /* настройки демо-режима: кто смотрит, который час, какое заведение */
  return `${head}<nav class="dr-nav" aria-label="Разделы">${nav}</nav>
  <p class="cap">Демо-режим</p>
  <div class="seg role" role="group" aria-label="Кто смотрит"><button class="${client ? 'on' : ''}" data-act="role" data-role="client">Клиент</button><button class="${client ? '' : 'on'}" data-act="role" data-role="kitchen">Кухня${nreq && client ? `<i class="bdg">${nreq}</i>` : ''}</button></div>
  <div class="dr-set"><label class="dr-i">${ic('clock', 21)}<span>Время</span><select data-chg="time" aria-label="Демо-время">${['08:40', '09:52', '10:20'].map(t => `<option ${t === S.time ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
  ${client ? '' : `<label class="dr-i">${ic('store', 21)}<span>Заведение</span><select data-chg="kid" aria-label="Заведение">${KITCHENS.map(x => `<option value="${x.id}" ${x.id === k.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>`}
  <button class="dr-i" data-act="reset">${ic('repeat', 21)}<span>Начать заново</span></button></div>`;
};
