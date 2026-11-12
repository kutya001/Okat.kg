'use strict';
/* история продаж за прошлые дни — для отчётов кухни */
const HIST = {};
function hist(kid) {
  if (HIST[kid]) return HIST[kid];
  const r = rng(kid.charCodeAt(1) * 977 + 13),
    ds = DISHES.filter(d => d.kid === kid),
    out = [];
  const base = { combo: 10, first: 6, second: 8, salad: 6, bake: 9, drink: 11 };
  for (let off = -29; off <= -1; off++) {
    const d = dayDate(off),
      wd = d.getDay(),
      f = wd === 0 ? 0 : wd === 6 ? 0.35 : 1,
      tr = 1 + ((off + 29) / 29) * 0.25;
    out.push({
      off,
      rows: ds
        .map(x => ({ dishId: x.id, qty: Math.round((base[x.cat] || 6) * (0.6 + r() * 0.8) * f * tr) }))
        .filter(x => x.qty > 0),
    });
  }
  return (HIST[kid] = out);
}
function repData(kid, period) {
  const n = period === 'today' ? 1 : +period,
    days = [],
    agg = {};
  for (let off = -(n - 1); off <= 0; off++) {
    let rows, orders;
    if (off === 0) {
      const m = {},
        real = ORDERS.filter(o => o.kid === kid && o.day === 0 && isReal(o));
      real.forEach(o =>
        o.items.forEach(i => {
          const x = (m[i.dishId] ??= { dishId: i.dishId, name: i.name, qty: 0, rev: 0, cost: 0 });
          x.qty += i.qty;
          x.rev += i.qty * i.price;
          x.cost += i.qty * i.cost;
        })
      );
      rows = Object.values(m);
      orders = real.length;
    } else {
      const h = hist(kid).find(x => x.off === off);
      rows = h.rows.map(x => {
        const d = dish(x.dishId);
        return { dishId: x.dishId, name: d.name, qty: x.qty, rev: x.qty * d.price, cost: x.qty * d.cost };
      });
      orders = Math.round(sumBy(rows, x => x.qty) / 1.7);
    }
    rows.forEach(x => {
      const a = (agg[x.dishId] ??= { name: x.name, qty: 0, rev: 0, cost: 0 });
      a.qty += x.qty;
      a.rev += x.rev;
      a.cost += x.cost;
    });
    days.push({ off, date: dayDate(off), orders, rev: sumBy(rows, x => x.rev), cost: sumBy(rows, x => x.cost) });
  }
  const rev = sumBy(days, d => d.rev),
    cost = sumBy(days, d => d.cost),
    orders = sumBy(days, d => d.orders);
  return {
    days,
    rows: Object.values(agg).sort((a, b) => b.rev - a.rev),
    rev,
    cost,
    orders,
    profit: rev - cost,
    margin: rev ? Math.round(((rev - cost) / rev) * 100) : 0,
    avg: orders ? rev / orders : 0,
  };
}
