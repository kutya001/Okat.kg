'use strict';
/* История прошлых дней: кто, когда и что заказывал. По ней строятся выручка кухни, учёт клиентов
   и статистика клиента. Записи облегчённые: { day, kid, clientId, pointId, items: [{ dishId, qty, price, cost }], total }.
   Данные демонстрационные и создаются при первом обращении к заведению. */
const SERVES = {
  k1: ['p1', 'p2', 'p3', 'p5'],
  k2: ['p1', 'p2', 'p3'],
  k3: ['p1', 'p4', 'p5'],
  k4: ['p1', 'p3', 'p5'],
  k5: ['p1', 'p2', 'p4'],
  k6: ['p2', 'p4'],
};
const PAST = {};
const lightOrder = o => ({
  day: o.day,
  kid: o.kid,
  clientId: o.clientId,
  pointId: o.pointId,
  items: o.items.map(i => ({ dishId: i.dishId, qty: i.qty, price: i.price, cost: i.cost })),
  total: o.sum,
});
function past(kid) {
  if (PAST[kid]) return PAST[kid];
  const r = rng(kid.charCodeAt(1) * 977 + 13),
    ds = DISHES.filter(d => d.kid === kid),
    of = c => ds.filter(d => c.includes(d.cat)),
    mains = of(['combo', 'first', 'second']),
    sides = of(['salad', 'bake']),
    drinks = of(['drink']),
    pick = a => a[Math.floor(r() * a.length)],
    it = (d, qty = 1) => ({ dishId: d.id, qty, price: d.price, cost: d.cost });
  /* у каждого своя привычка: постоянный клиент, заходит иногда, редкий гость */
  const who = PEOPLE.filter(p => (SERVES[kid] || []).includes(p.pointId)).map(p => {
    const a = r();
    return { p, rate: a < 0.22 ? 0.5 : a < 0.55 ? 0.18 : 0.04 };
  });
  const out = [];
  for (let off = -29; off <= -1; off++) {
    const wd = dayDate(off).getDay(),
      f = (wd === 0 ? 0 : wd === 6 ? 0.3 : 1) * (0.8 + ((off + 29) / 29) * 0.25);
    for (const { p, rate } of who) {
      if (!mains.length || r() >= rate * f) continue;
      const items = [it(pick(mains), r() < 0.08 ? 2 : 1)];
      if (sides.length && r() < 0.45) items.push(it(pick(sides)));
      if (drinks.length && r() < 0.5) items.push(it(pick(drinks)));
      out.push({ day: off, kid, clientId: p.id, pointId: p.pointId, items, total: sumBy(items, i => i.qty * i.price) });
    }
  }
  /* прошлые заказы самого клиента хранятся в ORDERS — они тоже часть истории кухни */
  ORDERS.filter(o => o.kid === kid && o.day < 0 && isReal(o)).forEach(o => out.push(lightOrder(o)));
  return (PAST[kid] = out);
}
/* заказы кухни за период: история + сегодняшние принятые */
const kitchenRecs = (kid, days) =>
  [...past(kid), ...ORDERS.filter(o => o.kid === kid && o.day === 0 && isReal(o)).map(lightOrder)].filter(
    x => x.day > -days
  );
const dishName = id => (dish(id) || { name: 'Блюдо удалено' }).name;

/* ---------- выручка кухни ---------- */
function repData(kid, period) {
  const n = period === 'today' ? 1 : +period,
    recs = kitchenRecs(kid, n),
    days = [],
    agg = {};
  for (let off = -(n - 1); off <= 0; off++) {
    const day = recs.filter(x => x.day === off);
    let rev = 0,
      cost = 0;
    for (const x of day)
      for (const i of x.items) {
        const a = (agg[i.dishId] ??= { name: dishName(i.dishId), qty: 0, rev: 0, cost: 0 });
        a.qty += i.qty;
        a.rev += i.qty * i.price;
        a.cost += i.qty * i.cost;
        rev += i.qty * i.price;
        cost += i.qty * i.cost;
      }
    days.push({ off, date: dayDate(off), orders: day.length, rev, cost });
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

/* ---------- учёт клиентов кухни: заказы за период, собранные по человеку ---------- */
function clientBook(kid, days) {
  const all = kitchenRecs(kid, 30),
    first = {},
    m = {};
  for (const x of all) first[x.clientId] = Math.min(first[x.clientId] ?? 0, x.day);
  for (const x of all) {
    if (x.day <= -days) continue;
    const c = (m[x.clientId] ??= { ...person(x.clientId), n: 0, sum: 0, last: -99, dishes: {}, orders: [] });
    c.n++;
    c.sum += x.total;
    c.last = Math.max(c.last, x.day);
    c.orders.push(x);
    for (const i of x.items) c.dishes[i.dishId] = (c.dishes[i.dishId] || 0) + i.qty;
  }
  return Object.values(m).map(c => ({
    ...c,
    avg: c.sum / c.n,
    first: first[c.id],
    top: Object.entries(c.dishes)
      .sort((a, b) => b[1] - a[1])
      .map(([id, qty]) => ({ id, name: dishName(id), qty })),
    orders: c.orders.sort((a, b) => b.day - a.day),
  }));
}

/* ---------- статистика клиента: где, что и сколько калорий ---------- */
function myStats(days) {
  const os = ORDERS.filter(o => o.clientId === 'me' && isReal(o) && o.day > -days),
    t = { n: os.length, sum: 0, kcal: 0, p: 0, f: 0, c: 0, known: 0 },
    byK = {},
    byD = {},
    byDay = {};
  for (const o of os) {
    let has = false;
    t.sum += o.total;
    for (const i of o.items) {
      const d = dish(i.dishId),
        x = (byD[i.dishId] ??= { name: i.name, d: d || { em: i.em }, qty: 0, kid: o.kid });
      x.qty += i.qty;
      if (!d || d.kcal == null) continue;
      has = true;
      t.kcal += d.kcal * i.qty;
      t.p += (d.p || 0) * i.qty;
      t.f += (d.f || 0) * i.qty;
      t.c += (d.c || 0) * i.qty;
      byDay[o.day] = (byDay[o.day] || 0) + d.kcal * i.qty;
    }
    if (has) t.known++;
    const k = (byK[o.kid] ??= { kid: o.kid, n: 0, sum: 0 });
    k.n++;
    k.sum += o.total;
  }
  return {
    ...t,
    avg: t.n ? t.sum / t.n : 0,
    byDay,
    kitchens: Object.values(byK).sort((a, b) => b.n - a.n || b.sum - a.sum),
    dishes: Object.values(byD).sort((a, b) => b.qty - a.qty),
  };
}
