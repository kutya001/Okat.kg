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
    receipt: a.receipt || null, // чек об оплате: { img, t }; img пустой — демонстрационный чек
    check: a.receipt ? a.check || 'wait' : '', // проверка чека кухней: wait — ждёт, ok — принят, bad — отклонён
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
/* заявку с переводом нельзя принять, пока кухня не посмотрела чек */
const needsCheck = o => o.status === 'request' && o.pay !== 'cash' && o.check !== 'ok';
/* картинка чека; у демо-заказов настоящего файла нет — рисуем условный образец */
function receiptSrc(o) {
  if (o.receipt && o.receipt.img) return o.receipt.img;
  const k = kitchen(o.kid),
    row = (y, l, v) =>
      `<text x="28" y="${y}" font-size="15" fill="#8a909c">${l}</text><text x="292" y="${y}" font-size="15" font-weight="600" text-anchor="end" fill="#17191e">${esc(v)}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400" font-family="system-ui,sans-serif"><rect width="320" height="400" fill="#fff"/><text x="160" y="52" font-size="13" font-weight="700" text-anchor="middle" fill="#8a909c" >Демо-чек</text><circle cx="160" cy="104" r="26" fill="#e3f6ec"/><path d="m148 104 8 8 16-17" fill="none" stroke="#14995a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><text x="160" y="170" font-size="30" font-weight="700" text-anchor="middle" fill="#17191e">${fmt(o.total)} сом</text><path d="M28 198h264" stroke="#ecedf0" stroke-width="2"/>${row(236, 'Способ', PAY[o.pay].s)}${row(268, 'Получатель', k.payTo.name)}${row(300, 'Отправитель', o.clientName)}${row(332, 'Время', o.receipt ? o.receipt.t : o.t)}<text x="160" y="376" font-size="12" text-anchor="middle" fill="#b3b8c2">Образец для прототипа, не платёжный документ</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
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
    real = os.filter(isReal);
  const rev = sumBy(real, o => o.sum),
    cost = sumBy(real, o => sumBy(o.items, i => i.cost * i.qty));
  return {
    os,
    req,
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
