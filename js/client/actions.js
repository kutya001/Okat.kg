'use strict';
/* ---------- действия клиента ---------- */
A.tab = d => {
  S.ctab = d.tab;
  S.cview = null;
  S.map.sel = null;
  render();
};
A.type = d => {
  S.typeFilter = d.t;
  S.map.sel = null;
  render();
};
A.openK = d => {
  S.cview = { kind: 'kitchen', id: d.id };
  S.map.sel = null;
  render();
};
A.back = () => {
  S.cview = S.cview && S.cview.kind === 'checkout' ? { kind: 'kitchen', id: S.cview.id } : null;
  render({ back: true });
};
A.jump = d => {
  const el = document.getElementById(d.to);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
A.add = d => {
  const mi = menuItems(d.k).find(i => i.dishId === d.id),
    c = (S.carts[d.k] ??= {}),
    q = c[d.id] || 0;
  if (!mi || q >= mi.left) {
    toast('Больше порций нет');
    return;
  }
  c[d.id] = q + 1;
  render();
};
A.sub = d => {
  const c = S.carts[d.k] || {};
  if (c[d.id] > 1) c[d.id]--;
  else delete c[d.id];
  if (S.cview && S.cview.kind === 'checkout' && !cartCnt(d.k)) S.cview = { kind: 'kitchen', id: d.k };
  render();
};
A.checkout = d => {
  S.cview = { kind: 'checkout', id: d.id };
  render();
};
A.pay = d => {
  S.co.pay = d.p;
  render();
};
I.comment = (d, el) => {
  S.co.comment = el.value;
};
A.setPoint = d => {
  S.me.pointId = d.id;
  S.sheet = null;
  S.map.client = null;
  S.map.sel = null;
  render();
};
A.submit = () => {
  const kid = S.cview.id,
    k = kitchen(kid),
    items = Object.entries(S.carts[kid] || {}).filter(([, q]) => q > 0);
  if (!items.length) return;
  const o = mkOrder({
    kid,
    pointId: S.me.pointId,
    clientId: 'me',
    clientName: S.me.name,
    phone: S.me.phone,
    items,
    status: 'request',
    t: S.time,
    pay: S.co.pay && k.pay.includes(S.co.pay) ? S.co.pay : k.pay[0],
    comment: S.co.comment.trim(),
    fee: feeFor(k, S.me.pointId),
  });
  o.isNew = true;
  delete S.carts[kid];
  S.co = { comment: '', pay: null };
  S.lastOrder = o.id;
  S.kid = kid;
  S.map.kitchen = null;
  S.kst = 'request';
  S.kpoint = 'all';
  S.cview = null;
  S.ctab = 'orders';
  toast('Заявка отправлена');
  render();
};
A.cancel = d => {
  const o = order(d.id);
  if (o.status !== 'request') return;
  o.status = 'cancelled';
  o.isNew = false;
  o.log.push(['cancelled', S.time]);
  toast('Заявка отменена');
  render();
};
A.receipt = d => {
  order(d.id).receipt = true;
  toast('Чек отправлен');
  render();
};
A.again = d => {
  const o = order(d.id),
    k = kitchen(o.kid),
    m = MENU[o.kid].today;
  if (!m.published || winState(k) !== 'open') {
    S.cview = { kind: 'kitchen', id: o.kid };
    toast('Сейчас заказы не принимают');
    render();
    return;
  }
  const c = (S.carts[o.kid] = {});
  o.items.forEach(i => {
    const mi = menuItems(o.kid).find(x => x.dishId === i.dishId);
    if (mi && mi.left > 0) c[i.dishId] = Math.min(i.qty, mi.left);
  });
  S.cview = { kind: 'kitchen', id: o.kid };
  render();
};
