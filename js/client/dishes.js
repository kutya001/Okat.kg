'use strict';
/* ---------- лента блюд: что сегодня готовят и кто это предлагает ---------- */
/* рейтинг хранится строкой «4,8» — для сравнения нужен число */
const rateNum = k => parseFloat(String(k.rating).replace(',', '.')) || 0;
const DSORT = { price: 'Дешевле', rating: 'По рейтингу', near: 'Ближе' };
/* блюда сегодняшних меню, собранные по виду: «Плов» — предложения всех заведений, где он есть */
function dishGroups(q = '') {
  const me = point(S.me.pointId),
    groups = {};
  for (const k of KITCHENS) {
    if (!MENU[k.id].today.published) continue;
    const open = winState(k) === 'open',
      dist = distM(me, k);
    for (const i of menuItems(k.id)) {
      const d = i.dish,
        kind = kindOf(d);
      /* насколько блюдо отвечает поиску: 0 — совпал вид или название, 1 — нашлось в описании */
      const rank = !q
        ? 0
        : (kind + ' ' + d.name).toLowerCase().includes(q)
          ? 0
          : d.desc.toLowerCase().includes(q)
            ? 1
            : -1;
      if (rank < 0) continue;
      const g = (groups[kind] ??= { kind, offers: [], rank: 1 });
      g.rank = Math.min(g.rank, rank);
      g.offers.push({ i, k, open, dist });
    }
  }
  const by = {
    price: (a, b) => a.i.price - b.i.price,
    rating: (a, b) => rateNum(b.k) - rateNum(a.k) || a.i.price - b.i.price,
    near: (a, b) => a.dist - b.dist || a.i.price - b.i.price,
  }[S.dfeed.sort];
  return Object.values(groups).map(g => {
    /* закрытые и распроданные предложения уходят в конец */
    const ok = o => (o.open && o.i.left > 0 ? 0 : 1);
    g.offers.sort((a, b) => ok(a) - ok(b) || by(a, b));
    const cnt = {};
    g.offers.forEach(o => (cnt[o.i.dish.cat] = (cnt[o.i.dish.cat] || 0) + 1));
    g.cat = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
    g.from = Math.min(...g.offers.map(o => o.i.price));
    return g;
  });
}
function offerRow(o) {
  const { i, k } = o,
    d = i.dish,
    q = (S.carts[k.id] || {})[d.id] || 0;
  return `<div class="offer ${o.open ? '' : 'off'}"><button class="of-b" data-act="cdish" data-k="${k.id}" data-id="${d.id}" aria-label="${esc(d.name)}, ${esc(k.name)}: подробнее">${ph(d, 'em')}<span class="of-t"><b>${esc(k.name)}</b><small>${esc(d.name)}${d.w ? ', ' + d.w : ''}</small><small><i class="rate">${k.rating}</i>${distTxt(o.dist)}${o.open ? '' : ', ' + (winState(k) === 'closed' ? 'закрыто' : 'с ' + k.from)}${o.open && i.left > 0 && i.left <= 5 ? `, осталось ${i.left}` : ''}</small></span></button>${addCtl(i, q, o.open)}</div>`;
}
const groupCard = g =>
  `<section class="ogroup" data-key="og-${esc(g.kind)}"><header><h3>${esc(g.kind)}</h3><span>${g.offers.length > 1 ? 'от ' : ''}${som(g.from)}</span></header>${g.offers.map(offerRow).join('')}</section>`;
function cDishes() {
  const all = dishGroups(),
    cat = S.dfeed.cat,
    order = (a, b) => b.offers.length - a.offers.length || a.from - b.from || a.kind.localeCompare(b.kind, 'ru');
  /* первой в ряду стоит сортировка предложений, дальше — категории */
  const chips =
    `<label class="chip selc" aria-label="Порядок предложений">${ic('sort', 16)}<select data-chg="dsort">${Object.entries(
      DSORT
    )
      .map(([id, l]) => `<option value="${id}" ${S.dfeed.sort === id ? 'selected' : ''}>${l}</option>`)
      .join('')}</select></label>` +
    `<button class="chip ${cat === 'all' ? 'on' : ''}" data-act="dcat" data-c="all">Все</button>` +
    CATS.filter(c => all.some(g => g.cat === c.id))
      .map(c => `<button class="chip ${cat === c.id ? 'on' : ''}" data-act="dcat" data-c="${c.id}">${c.n}</button>`)
      .join('');
  /* разделы по категориям; внутри сначала блюда, которые есть у нескольких заведений */
  const sections = CATS.filter(c => cat === 'all' || cat === c.id)
    .map(c => {
      const gs = all.filter(g => g.cat === c.id).sort(order);
      return gs.length ? `<h2 class="cat-h">${c.n}</h2><div class="dfeed">${gs.map(groupCard).join('')}</div>` : '';
    })
    .join('');
  return `<div class="chips" data-keep="dcats">${chips}</div>
  ${sections || `<div class="blank"><div class="blank-em">🍽️</div><b>Сегодня меню ещё нет</b></div>`}
  ${homeCart()}`;
}
A.dcat = d => {
  S.dfeed.cat = d.c;
  render();
};
C.dsort = (d, el) => {
  S.dfeed.sort = el.value;
  render();
};
