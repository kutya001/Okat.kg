'use strict';
/* ---------- демо-данные: заявки других людей с разных точек ---------- */
(function seed() {
  const r = rng(20261112);
  /* очередь людей по точкам: каждый сегодня заказывает не больше одного раза */
  const queue = {};
  POINTS.forEach(p => (queue[p.id] = PEOPLE.filter(x => x.pointId === p.id)));
  const cm = [
    'Без лука, пожалуйста',
    'Позвоните, как подъедете',
    'Приборы не нужны',
    'Оставьте на ресепшене',
    'Хлеба побольше',
  ];
  const plan = [
    ['p1', 'k1', 7],
    ['p1', 'k2', 5],
    ['p1', 'k3', 3],
    ['p1', 'k4', 2],
    ['p1', 'k5', 4],
    ['p2', 'k1', 4],
    ['p2', 'k2', 6],
    ['p2', 'k5', 2],
    ['p3', 'k1', 5],
    ['p3', 'k2', 3],
    ['p3', 'k4', 3],
    ['p4', 'k5', 5],
    ['p4', 'k3', 2],
    ['p5', 'k1', 2],
    ['p5', 'k3', 4],
    ['p5', 'k4', 2],
  ];
  const pick = a => a[Math.floor(r() * a.length)],
    tmp = [];
  for (const [pid, kid, n] of plan) {
    const k = kitchen(kid),
      ds = DISHES.filter(d => d.kid === kid && MENU[kid].today.items.some(i => i.dishId === d.id));
    const mains = ds.filter(d => ['combo', 'first', 'second'].includes(d.cat)),
      sides = ds.filter(d => ['salad', 'bake'].includes(d.cat)),
      drinks = ds.filter(d => d.cat === 'drink');
    for (let i = 0; i < n; i++) {
      const items = [[pick(mains).id, 1]];
      if (sides.length && r() < 0.45) items.push([pick(sides).id, 1]);
      if (drinks.length && r() < 0.5) items.push([pick(drinks).id, 1]);
      const tm = 425 + Math.floor(r() * 92);
      const who = queue[pid].shift();
      tmp.push({
        kid,
        pointId: pid,
        clientId: who.id,
        clientName: who.name,
        phone: who.phone,
        items,
        t: minToT(tm),
        tm,
        pay: pick(k.pay),
        comment: r() < 0.22 ? pick(cm) : '',
        fee: k.freeFrom && n >= k.freeFrom ? 0 : k.fee,
        rnd: r(),
      });
    }
  }
  tmp
    .sort((a, b) => a.tm - b.tm)
    .forEach(a => {
      a.status = a.tm < 485 ? 'confirmed' : 'request';
      if (a.pay !== 'cash') {
        a.receipt = { img: '', t: minToT(a.tm + 2) };
        a.check = a.status === 'confirmed' ? 'ok' : 'wait';
      }
      a.paid = a.status === 'confirmed' && a.pay !== 'cash';
      const o = mkOrder(a);
      if (a.status === 'confirmed') o.log.push(['confirmed', minToT(a.tm + 4)]);
    });
  /* манты почти разобрали — показать «осталось 2» */
  const mi = MENU.k1.today.items.find(i => i.dishId === 'k1d5');
  mi.limit = taken('k1', 'k1d5') + 2;
  /* прошлые заказы текущего клиента — для истории и статистики; вчерашний задан явно */
  const rm = rng(808),
    fav = ['k1', 'k1', 'k1', 'k2', 'k2', 'k3', 'k4', 'k4', 'k5'],
    one = a => a[Math.floor(rm() * a.length)];
  let hn = 0;
  for (let off = -29; off <= -1; off++) {
    const wd = dayDate(off).getDay();
    if (off !== -1 && (wd === 0 || rm() > (wd === 6 ? 0.15 : 0.66))) continue;
    const kid = off === -1 ? 'k2' : one(fav),
      k = kitchen(kid),
      ds = DISHES.filter(d => d.kid === kid),
      of = c => ds.filter(d => c.includes(d.cat)),
      items =
        off === -1
          ? [
              ['k2d1', 1],
              ['k2d10', 1],
            ]
          : [[one(of(['combo', 'first', 'second'])).id, 1]];
    if (off !== -1 && of(['salad', 'bake']).length && rm() < 0.4) items.push([one(of(['salad', 'bake'])).id, 1]);
    if (off !== -1 && of(['drink']).length && rm() < 0.5) items.push([one(of(['drink'])).id, 1]);
    const pay = off === -1 ? 'cash' : one(k.pay),
      tm = 430 + Math.floor(rm() * 80),
      o = mkOrder({
        num: off === -1 ? 87 : 20 + Math.floor(rm() * 70),
        day: off,
        kid,
        pointId: 'p1',
        clientId: 'me',
        clientName: S.me.name,
        phone: S.me.phone,
        items,
        status: 'delivered',
        t: minToT(tm),
        pay,
        paid: true,
        receipt: pay === 'cash' ? null : { img: '', t: minToT(tm + 2) },
        check: 'ok',
      });
    o.id = 'h' + ++hn;
    o.log.push(['confirmed', minToT(tm + 6)], ['cooking', '10:05'], ['delivering', '11:50'], ['delivered', '12:25']);
  }
})();
