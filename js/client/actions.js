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
  S.sheet = null;
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
  S.lastCart = d.k;
  render();
  fxBump('.cartbtn .q');
};
A.sub = d => {
  const c = S.carts[d.k] || {};
  if (c[d.id] > 1) c[d.id]--;
  else delete c[d.id];
  if (S.cview && S.cview.kind === 'checkout' && !cartCnt(d.k)) S.cview = { kind: 'kitchen', id: d.k };
  render();
  fxBump('.cartbtn .q');
};
A.checkout = d => {
  S.cview = { kind: 'checkout', id: d.id };
  S.sheet = null;
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
  const pay = S.co.pay && k.pay.includes(S.co.pay) ? S.co.pay : k.pay[0];
  if (pay !== 'cash' && !S.co.receipt) {
    toast('Прикрепите чек');
    return;
  }
  const o = mkOrder({
    kid,
    pointId: S.me.pointId,
    clientId: 'me',
    clientName: S.me.name,
    phone: S.me.phone,
    items,
    status: 'request',
    t: S.time,
    pay,
    receipt: pay !== 'cash' ? { img: S.co.receipt, t: S.time } : null,
    comment: S.co.comment.trim(),
    fee: feeFor(k, S.me.pointId),
  });
  o.isNew = true;
  delete S.carts[kid];
  S.co = { comment: '', pay: null, receipt: '' };
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
/* чек об оплате: в корзине и повторно, если кухня его отклонила */
C.coReceipt = (d, el) =>
  readImage(
    el.files && el.files[0],
    1200,
    img => {
      S.co.receipt = img;
      render();
    },
    () => toast('Не получилось открыть файл')
  );
C.reReceipt = (d, el) =>
  readImage(
    el.files && el.files[0],
    1200,
    img => {
      const o = order(d.id);
      o.receipt = { img, t: S.time };
      o.check = 'wait';
      o.isNew = true;
      toast('Чек отправлен');
      render();
    },
    () => toast('Не получилось открыть файл')
  );
A.coReceiptView = () => {
  S.sheet = { type: 'rcpt', img: S.co.receipt };
  render();
};
A.copyNum = d => {
  const ok = () => toast('Номер скопирован');
  if (navigator.clipboard && navigator.clipboard.writeText)
    navigator.clipboard.writeText(d.v).then(ok, () => toast(d.v));
  else toast(d.v);
};
/* шторка блюда и прокрутка ленты блюд в карточке заведения */
A.cdish = d => {
  S.sheet = { type: 'cdish', k: d.k, id: d.id };
  render();
};
A.rcScroll = (d, el) => {
  const sc = el.closest('.rc-wrap').querySelector('.rc-scroll');
  sc.scrollBy({ left: +d.dir * sc.clientWidth * 0.8, behavior: FX.off() ? 'auto' : 'smooth' });
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
