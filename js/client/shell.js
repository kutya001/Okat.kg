'use strict';
/* ================= КЛИЕНТ ================= */
function clientApp() {
  let body,
    cls = 'narrow';
  if (S.cview && S.cview.kind === 'kitchen') {
    body = cKitchen(S.cview.id);
    cls = '';
  } else if (S.cview && S.cview.kind === 'checkout') body = cCheckout(S.cview.id);
  else {
    body = { home: cHome, map: cMap, orders: cOrders, profile: cProfile }[S.ctab]();
    cls = S.ctab === 'map' ? 'is-map' : S.ctab === 'home' ? '' : 'narrow';
  }
  return `<div class="c-app">${S.cview ? '' : cNav()}<div class="c-shell ${cls} ${S.cview ? 'detail' : ''}">${body}</div></div>`;
}
function cNav() {
  const act = ORDERS.filter(
    o => o.clientId === 'me' && o.day === 0 && ['request', 'confirmed', 'cooking', 'delivering'].includes(o.status)
  ).length;
  const t = (id, i, l, b) =>
    `<button class="${S.ctab === id ? 'on' : ''}" data-act="tab" data-tab="${id}" ${S.ctab === id ? 'aria-current="page"' : ''}>${ic(i, 23)}<span>${l}</span>${b ? `<i class="bdg">${b}</i>` : ''}</button>`;
  return `<nav class="tabbar" aria-label="Разделы"><span class="nav-logo">Okat</span>${t('home', 'home', 'Главная')}${t('map', 'map', 'Карта')}${t('orders', 'receipt', 'Заказы', act)}${t('profile', 'user', 'Профиль')}</nav>`;
}
const addrBtn = p =>
  `<button class="addr" data-act="sheet" data-sheet="points" aria-label="Точка доставки: ${esc(p.name)}">${ic('pin', 20)}<b>${esc(p.name)}</b>${ic('down', 16)}</button>`;
const typeChips = () =>
  `<button class="chip ${S.typeFilter === 'all' ? 'on' : ''}" data-act="type" data-t="all">Все</button>` +
  Object.entries(TYPES)
    .map(
      ([id, t]) =>
        `<button class="chip ${S.typeFilter === id ? 'on' : ''}" data-act="type" data-t="${id}">${t.many}</button>`
    )
    .join('');
/* до какого времени можно заказать — одна метка вместо баннера */
const dueTag = k => {
  const ws = winState(k),
    left = toMin(k.to) - toMin(S.time);
  return ws === 'open'
    ? `<span class="tagc ${left <= 15 ? 'bad' : 'ok'}">${ic('clock', 14)}${left <= 15 ? left + ' мин' : 'до ' + k.to}</span>`
    : `<span class="tagc">${ic('clock', 14)}${ws === 'closed' ? 'закрыто' : 'с ' + k.from}</span>`;
};
const feeTag = fee =>
  `<span class="tagc ${fee ? '' : 'ok'}">${ic('truck', 14)}${fee ? fee + ' сом' : 'бесплатно'}</span>`;
const peopleTag = n => (n ? `<span class="tagc" title="Заказали с вашей точки">${ic('users', 14)}${n}</span>` : '');
