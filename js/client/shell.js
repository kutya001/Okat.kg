'use strict';
/* ================= КЛИЕНТ ================= */
function clientApp() {
  const p = point(S.me.pointId),
    addr = tbMain(
      p.name,
      'Доставка',
      `data-act="sheet" data-sheet="points" aria-label="Точка доставки: ${esc(p.name)}"`
    ),
    find = { search: 'q', q: S.q, ph: 'Блюдо или заведение' };
  let body,
    bar,
    cls = 'narrow';
  if (S.cview && S.cview.kind === 'kitchen') {
    const k = kitchen(S.cview.id);
    body = cKitchen(k.id);
    cls = '';
    bar = topBar({
      back: 1,
      main: tbMain(k.name, `${TYPES[k.type].short}, ${distTxt(distM(p, k))}`),
      right: `<a class="rbtn" href="tel:${k.phone.replace(/\s/g, '')}" aria-label="Позвонить">${ic('phone', 19)}</a>`,
    });
  } else if (S.cview && S.cview.kind === 'checkout') {
    body = cCheckout(S.cview.id);
    bar = topBar({ back: 1, main: tbMain('Корзина', esc(kitchen(S.cview.id).name)) });
  } else if (searching()) {
    body = cSearch();
    cls = '';
    bar = topBar({ main: addr, qopen: true, ...find });
  } else {
    body = { home: cHome, dishes: cDishes, map: cMap, orders: cOrders, profile: cProfile }[S.ctab]();
    cls = S.ctab === 'map' ? 'is-map' : ['home', 'dishes'].includes(S.ctab) ? '' : 'narrow';
    bar = topBar({ main: addr, ...find });
  }
  return `<div class="c-app">${bar}<div class="c-shell ${cls} ${S.cview ? 'detail' : ''}" data-key="${viewKey()}">${body}</div>${S.cview ? '' : cNav()}</div>`;
}
/* нижняя панель разделов */
function cNav() {
  const act = ORDERS.filter(
      o => o.clientId === 'me' && o.day === 0 && ['request', 'confirmed', 'cooking', 'delivering'].includes(o.status)
    ).length,
    cur = id => !searching() && S.ctab === id;
  const t = (id, i, l, b) =>
    `<button class="${cur(id) ? 'on' : ''}" data-act="tab" data-tab="${id}" ${cur(id) ? 'aria-current="page"' : ''}>${ic(i, 23)}<span>${l}</span>${b ? `<i class="bdg">${b}</i>` : ''}</button>`;
  return `<nav class="tabbar glass" aria-label="Разделы">${t('home', 'store', 'Заведения')}${t('dishes', 'bowl', 'Блюда')}${t('map', 'map', 'Карта')}${t('orders', 'receipt', 'Заказы', act)}${t('profile', 'user', 'Профиль')}</nav>`;
}
/* поиск: заведения и блюда по одному запросу */
function cSearch() {
  const q = S.q.trim().toLowerCase(),
    me = point(S.me.pointId);
  if (!q) {
    const kinds = [...new Set(dishGroups().map(g => g.kind))],
      hints = KINDS.map(k => k[0]).filter(k => kinds.includes(k));
    return `<p class="cap">Сегодня готовят</p><div class="chips wrap">${hints.map(k => `<button class="chip" data-act="qSet" data-q="${esc(k)}">${esc(k)}</button>`).join('')}</div>`;
  }
  const ks = KITCHENS.filter(k => (k.name + ' ' + TYPES[k.type].short).toLowerCase().includes(q)),
    gs = dishGroups(q).sort((a, b) => a.rank - b.rank || b.offers.length - a.offers.length || a.from - b.from);
  if (!ks.length && !gs.length)
    return `<div class="blank"><div class="blank-em">🔎</div><b>Ничего не нашлось</b><button class="btn sec" data-act="qSet" data-q="">Сбросить</button></div>`;
  return `${
    ks.length
      ? `<h2 class="cat-h">Заведения</h2><div class="rows">${ks
          .map(
            k =>
              `<button class="row" data-act="openK" data-id="${k.id}"><span class="ava">${k.em}</span><span><b>${esc(k.name)}</b><small>${TYPES[k.type].short}, ${distTxt(distM(me, k))}</small></span><i class="rate">${k.rating}</i>${ic('right', 18)}</button>`
          )
          .join('')}</div>`
      : ''
  }${gs.length ? `<h2 class="cat-h">Блюда</h2><div class="dfeed found">${gs.map(groupCard).join('')}</div>` : ''}${homeCart()}`;
}
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
