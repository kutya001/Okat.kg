'use strict';
/* ---------- корзина ---------- */
function cCheckout(id) {
  const k = kitchen(id),
    p = point(S.me.pointId),
    cart = S.carts[id] || {},
    items = menuItems(id).filter(i => cart[i.dishId] > 0);
  const total = cartSum(id),
    fee = feeFor(k, p.id),
    pay = S.co.pay && k.pay.includes(S.co.pay) ? S.co.pay : k.pay[0];
  const row = i => {
    const d = i.dish,
      q = cart[i.dishId],
      a = `data-k="${d.kid}" data-id="${d.id}"`;
    return `<div class="row crow">${ph(d)}<span><b>${esc(d.name)}</b><small>${som(i.price)}</small></span><div class="stepper sm"><button data-act="sub" ${a} aria-label="Убрать одну порцию">${ic('minus', 16)}</button><span>${q}</span><button data-act="add" ${a} ${q >= i.left ? 'disabled' : ''} aria-label="Добавить ещё порцию">${ic('plus', 16)}</button></div></div>`;
  };
  return `<header class="kp-h"><button class="rbtn" data-act="back" aria-label="Назад к меню">${ic('left')}</button><h1>Корзина</h1><span class="sp"></span></header>
  <div class="rows" style="margin-top:4px">${items.map(row).join('')}</div>
  <div class="rows">
    <button class="row" data-act="sheet" data-sheet="points">${ic('pin')}<span><b>${esc(p.name)}</b><small>${esc(p.addr)}</small></span>${ic('right', 18)}</button>
    <div class="row">${ic('clock')}<span><b>Сегодня, ${k.dFrom}–${k.dTo}</b></span></div>
  </div>
  <p class="cap">Оплата</p>
  <div class="pays">${k.pay.map(x => `<button class="chip ${x === pay ? 'on' : ''}" data-act="pay" data-p="${x}">${PAY[x].s}</button>`).join('')}</div>
  <input class="cmt" data-inp="comment" placeholder="Комментарий для кухни" aria-label="Комментарий для кухни" value="${esc(S.co.comment)}">
  <div class="totals"><div><span>Блюда</span><b>${som(total)}</b></div><div><span>Доставка</span><b class="${fee ? '' : 'okc'}">${fee ? som(fee) : 'бесплатно'}</b></div></div>
  <p class="fine">Кухня подтвердит заявку — и она станет заказом.</p>
  <div class="cartbar"><button class="cartbtn" data-act="submit" ${items.length && total >= k.min ? '' : 'disabled'}><span class="cb-l">Отправить заявку</span><span>${som(total + fee)}</span></button></div>`;
}
