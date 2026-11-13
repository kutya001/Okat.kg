'use strict';
/* ---------- демо-данные: заявки других людей с разных точек ---------- */
(function seed() {
  const r = rng(20261112);
  let ci = 0;
  const names = [
    'Айбек Т.',
    'Нурлан К.',
    'Айгерим С.',
    'Бегимай А.',
    'Данияр О.',
    'Эрмек Ж.',
    'Жылдыз М.',
    'Каныкей Б.',
    'Марат И.',
    'Назгуль Д.',
    'Тимур А.',
    'Чынара Э.',
    'Улан С.',
    'Асель К.',
    'Бакыт Н.',
    'Гульнара Т.',
    'Руслан М.',
    'Салтанат О.',
    'Эльдар Б.',
    'Мээрим Ж.',
    'Анна П.',
    'Сергей В.',
    'Ольга Н.',
    'Дмитрий Л.',
    'Адилет К.',
    'Жанара С.',
    'Кубат Э.',
    'Алина Р.',
  ];
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
      ci++;
      tmp.push({
        kid,
        pointId: pid,
        clientId: 'c' + ci,
        clientName: names[ci % names.length],
        phone:
          '+996 ' +
          pick(['700', '555', '770', '500']) +
          ' ' +
          (100 + Math.floor(r() * 900)) +
          ' ' +
          (100 + Math.floor(r() * 900)),
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
  /* вчерашний заказ текущего клиента — для истории */
  const y = mkOrder({
    num: 87,
    day: -1,
    kid: 'k2',
    pointId: 'p1',
    clientId: 'me',
    clientName: S.me.name,
    phone: S.me.phone,
    items: [
      ['k2d1', 1],
      ['k2d10', 1],
    ],
    status: 'delivered',
    t: '08:15',
    pay: 'cash',
    paid: true,
  });
  y.log.push(['confirmed', '08:21'], ['cooking', '10:05'], ['delivering', '11:50'], ['delivered', '12:25']);
})();
