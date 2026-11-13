'use strict';
/* ================= ЗАЯВКИ И ЗАКАЗЫ ================= */
const ORDERS = [];
let ORD_SEQ = 100;
const order = id => ORDERS.find(o => o.id === id);
const isActive = o => ACTIVE.includes(o.status),
  isReal = o => REAL.includes(o.status);
function mkOrder(a) {
  const k = kitchen(a.kid);
  const items = a.items.map(([dishId, qty]) => {
    const d = dish(dishId),
      mi = MENU[a.kid].today.items.find(i => i.dishId === dishId);
    return { dishId, name: d.name, em: d.em, price: mi ? mi.price : d.price, cost: d.cost, qty };
  });
  const sum = sumBy(items, i => i.price * i.qty),
    fee = a.fee ?? 0,
    num = a.num ?? ++ORD_SEQ;
  const o = {
    id: 'o' + num,
    num,
    day: a.day ?? 0,
    kid: a.kid,
    pointId: a.pointId,
    clientId: a.clientId,
    clientName: a.clientName,
    phone: a.phone,
    items,
    sum,
    fee,
    total: sum + fee,
    pay: a.pay,
    paid: !!a.paid,
    /* чеки об оплате переводом: { img, t, sum, st }; st: wait — ждёт проверки, ok — принят, bad — отклонён.
       Пустой img — демонстрационный чек. Чеков может быть несколько: доплата после правки заказа */
    receipts: a.receipt ? [{ img: a.receipt.img || '', t: a.receipt.t, sum: sum + fee, st: a.check || 'wait' }] : [],
    edited: '', // когда клиент последний раз правил заявку
    change: null, // уточнение к принятому заказу: { items: { dishId: qty }, note, t, st: 'wait' | 'ok' | 'no' }
    comment: a.comment || '',
    status: a.status,
    t: a.t,
    log: [['request', a.t]],
  };
  ORDERS.push(o);
  return o;
}
/* сколько человек с точки заказали сегодня: всего и по заведениям */
function pointStats(pid) {
  const by = {},
    all = new Set();
  for (const o of ORDERS) {
    if (o.day !== 0 || o.pointId !== pid || !isActive(o)) continue;
    (by[o.kid] ??= new Set()).add(o.clientId);
    all.add(o.clientId);
  }
  return { total: all.size, by: Object.fromEntries(Object.entries(by).map(([k, v]) => [k, v.size])) };
}
function qtyBy(kid, dishId, pred) {
  let q = 0;
  for (const o of ORDERS)
    if (o.day === 0 && o.kid === kid && pred(o)) for (const i of o.items) if (i.dishId === dishId) q += i.qty;
  return q;
}
/* ---------- оплата переводом ---------- */
const lastRcpt = o => o.receipts[o.receipts.length - 1];
const waitRcpts = o => o.receipts.filter(r => r.st === 'wait');
/* проверка чеков: wait — есть непроверенный, bad — последний отклонён, ok — всё проверено, '' — чеков нет */
const checkOf = o => (!o.receipts.length ? '' : waitRcpts(o).length ? 'wait' : lastRcpt(o).st);
const okSum = o => sumBy(o.receipts, r => (r.st === 'ok' ? r.sum : 0));
const sentSum = o => sumBy(o.receipts, r => (r.st !== 'bad' ? r.sum : 0));
/* сколько ещё нужно перевести и сколько переведено лишнего (после правки заказа) */
const dueSum = o => (o.pay === 'cash' ? 0 : Math.max(0, o.total - sentSum(o)));
const overSum = o => (o.pay === 'cash' ? 0 : Math.max(0, sentSum(o) - o.total));
/* перевод оплачен, когда принятые чеки покрывают сумму; наличные кухня отмечает сама */
function syncPay(o) {
  if (o.pay !== 'cash') o.paid = okSum(o) > 0 && okSum(o) >= o.total;
}
/* заявку с переводом нельзя принять, пока чеки не проверены и не покрывают сумму */
const needsCheck = o => o.status === 'request' && o.pay !== 'cash' && (checkOf(o) !== 'ok' || dueSum(o) > 0);
/* способ оплаты новой заявки: выбранный клиентом, иначе перевод, если кухня его принимает */
const payOf = k => (S.co.pay && k.pay.includes(S.co.pay) ? S.co.pay : k.pay.find(x => x !== 'cash') || k.pay[0]);
/* картинка чека; у демо-заказов настоящего файла нет — рисуем условный образец */
function receiptSrc(o, r) {
  if (r.img) return r.img;
  const k = kitchen(o.kid),
    row = (y, l, v) =>
      `<text x="28" y="${y}" font-size="15" fill="#8a909c">${l}</text><text x="292" y="${y}" font-size="15" font-weight="600" text-anchor="end" fill="#17191e">${esc(v)}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400" font-family="system-ui,sans-serif"><rect width="320" height="400" fill="#fff"/><text x="160" y="52" font-size="13" font-weight="700" text-anchor="middle" fill="#8a909c">Демо-чек</text><circle cx="160" cy="104" r="26" fill="#e3f6ec"/><path d="m148 104 8 8 16-17" fill="none" stroke="#14995a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><text x="160" y="170" font-size="30" font-weight="700" text-anchor="middle" fill="#17191e">${fmt(r.sum)} сом</text><path d="M28 198h264" stroke="#ecedf0" stroke-width="2"/>${row(236, 'Способ', PAY[o.pay].s)}${row(268, 'Получатель', k.payTo.name)}${row(300, 'Отправитель', o.clientName)}${row(332, 'Время', r.t)}<text x="160" y="376" font-size="12" text-anchor="middle" fill="#b3b8c2">Образец для прототипа, не платёжный документ</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

/* ---------- состав заказа: правка заявки и уточнение ---------- */
const qtyMap = o => Object.fromEntries(o.items.map(i => [i.dishId, i.qty]));
/* цена блюда в заказе: уже заказанное — по цене заказа, новое — по сегодняшнему меню */
function priceIn(o, dishId) {
  const old = o.items.find(i => i.dishId === dishId),
    mi = MENU[o.kid].today.items.find(i => i.dishId === dishId);
  return old ? old.price : mi ? mi.price : (dish(dishId) || { price: 0 }).price;
}
/* сколько порций блюда может быть в этом заказе: остаток в меню плюс то, что заказ уже держит */
function roomFor(o, dishId) {
  const mi = menuItems(o.kid).find(i => i.dishId === dishId),
    own = (o.items.find(i => i.dishId === dishId) || { qty: 0 }).qty;
  return (mi ? mi.left : 0) + own;
}
const mapSum = (o, map) => sumBy(Object.entries(map), ([id, q]) => priceIn(o, id) * q);
/* что изменится: [{ name, from, to }] только по блюдам с разницей */
function orderDiff(o, map) {
  const was = qtyMap(o);
  return [...new Set([...Object.keys(was), ...Object.keys(map)])]
    .map(id => ({
      id,
      name: (o.items.find(i => i.dishId === id) || dish(id) || { name: 'Блюдо' }).name,
      from: was[id] || 0,
      to: map[id] || 0,
    }))
    .filter(x => x.from !== x.to);
}
/* записать новый состав в заказ и пересчитать суммы и оплату */
function setItems(o, map) {
  const ids = [...new Set([...o.items.map(i => i.dishId), ...Object.keys(map)])];
  o.items = ids
    .filter(id => map[id] > 0)
    .map(id => {
      const old = o.items.find(i => i.dishId === id),
        d = dish(id);
      return old
        ? { ...old, qty: map[id] }
        : { dishId: id, name: d.name, em: d.em, price: priceIn(o, id), cost: d.cost, qty: map[id] };
    });
  o.sum = sumBy(o.items, i => i.price * i.qty);
  o.total = o.sum + o.fee;
  syncPay(o);
}
const taken = (kid, dishId) => qtyBy(kid, dishId, isActive);
function dishFromPoint(kid, pid) {
  const m = {};
  for (const o of ORDERS)
    if (o.day === 0 && o.kid === kid && o.pointId === pid && isActive(o))
      for (const i of o.items) m[i.dishId] = (m[i.dishId] || 0) + i.qty;
  return m;
}
function menuItems(kid, day = 0) {
  const m = MENU[kid][day === 'today' ? 0 : day];
  if (!m) return [];
  return m.items
    .map(mi => {
      const d = dish(mi.dishId),
        t = m.day === 0 ? taken(kid, mi.dishId) : 0;
      return { ...mi, dish: d, taken: t, left: Math.max(0, mi.limit - t) };
    })
    .filter(x => x.dish);
}
const winState = k => {
  const n = toMin(S.time);
  return n < toMin(k.from) ? 'soon' : n >= toMin(k.to) ? 'closed' : 'open';
};
const distM = (a, b) =>
  Math.hypot((a.ll[0] - b.ll[0]) * 111320, (a.ll[1] - b.ll[1]) * 111320 * Math.cos((42.875 * Math.PI) / 180));
const distTxt = m => (m < 1000 ? Math.round(m / 50) * 50 + ' м' : (m / 1000).toFixed(1).replace('.', ',') + ' км');
const cartSum = kid =>
  sumBy(
    Object.entries(S.carts[kid] || {}),
    ([d, q]) => (MENU[kid].today.items.find(i => i.dishId === d)?.price || 0) * q
  );
const cartCnt = kid => sumBy(Object.values(S.carts[kid] || {}), q => q);
/* доставка для новой заявки: бесплатно, если с точки уже набралось нужное число заказов */
function feeFor(k, pid) {
  if (!k.fee) return 0;
  const n = pointStats(pid).by[k.id] || 0;
  return k.freeFrom && n + 1 >= k.freeFrom ? 0 : k.fee;
}
function kStats(kid) {
  const os = ORDERS.filter(o => o.kid === kid && o.day === 0),
    req = os.filter(o => o.status === 'request'),
    chg = os.filter(o => isActive(o) && o.change && o.change.st === 'wait'), // уточнения, которые ждут ответа кухни
    real = os.filter(isReal);
  const rev = sumBy(real, o => o.sum),
    cost = sumBy(real, o => sumBy(o.items, i => i.cost * i.qty));
  return {
    os,
    req,
    chg,
    real,
    rev,
    cost,
    profit: rev - cost,
    margin: rev ? Math.round(((rev - cost) / rev) * 100) : 0,
    reqSum: sumBy(req, o => o.sum),
    por: sumBy(real, o => sumBy(o.items, i => i.qty)),
    porReq: sumBy(req, o => sumBy(o.items, i => i.qty)),
    paid: sumBy(
      real.filter(o => o.paid),
      o => o.total
    ),
  };
}
function byPoint(kid) {
  const m = {};
  for (const o of ORDERS) {
    if (o.kid !== kid || o.day !== 0 || !isActive(o)) continue;
    const x = (m[o.pointId] ??= { p: point(o.pointId), orders: 0, por: 0, sum: 0, req: 0 });
    x.orders++;
    x.por += sumBy(o.items, i => i.qty);
    x.sum += o.sum;
    if (o.status === 'request') x.req++;
  }
  return Object.values(m).sort((a, b) => b.orders - a.orders);
}
