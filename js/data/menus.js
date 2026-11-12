'use strict';
/* Меню на день — отдельный документ на каждую дату (ключ — смещение в днях от сегодня: 0, 1, -1…).
   У документа свои блюда, цены, число порций, время приёма заявок и доставки. */
const MENU = {};
const mkMenu = (k, day, src) => ({
  day,
  published: false,
  note: '',
  from: k.def.from,
  to: k.def.to,
  dFrom: k.def.dFrom,
  dTo: k.def.dTo,
  items: [],
  ...src,
});
KITCHENS.forEach(k => {
  k.def = {
    from: k.from,
    to: k.to,
    dFrom: k.dFrom,
    dTo: k.dTo,
  }; /* время по умолчанию для новых меню; k.from/k.to… — время сегодняшнего меню */
  const all = DISHES.filter(d => d.kid === k.id),
    skip = k.id === 'k1' ? ['k1d3', 'k1d7'] : [],
    it = d => ({ dishId: d.id, price: d.price, limit: LIM[d.cat] });
  const o = (MENU[k.id] = {});
  Object.defineProperty(o, 'today', {
    get() {
      return this[0];
    },
  });
  o[0] = mkMenu(k, 0, { published: k.id !== 'k6', note: k.note, items: all.filter(d => !skip.includes(d.id)).map(it) });
  for (const d of [-1, -2, -3]) {
    if (dayDate(d).getDay() === 0) continue;
    o[d] = mkMenu(k, d, { published: true, items: all.filter((x, i) => (i - d) % 4 !== 0).map(it) });
  }
});
