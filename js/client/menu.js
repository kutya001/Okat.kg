'use strict';
/* ---------- меню заведения ---------- */
function dishCard(i, q, can, hot) {
  const d = i.dish,
    out = i.left <= 0,
    a = `data-k="${d.kid}" data-id="${d.id}"`,
    sub = d.w || d.desc;
  const ctl =
    q > 0
      ? `<div class="stepper"><button data-act="sub" ${a} aria-label="Убрать одну порцию">${ic('minus', 18)}</button><span>${q}</span><button data-act="add" ${a} ${!can || q >= i.left ? 'disabled' : ''} aria-label="Добавить ещё порцию">${ic('plus', 18)}</button></div>`
      : !can
        ? `<span class="addbtn off">${som(i.price)}</span>`
        : `<button class="addbtn" data-act="add" ${a} ${out ? 'disabled' : ''} aria-label="${esc(d.name)}, ${som(i.price)}. Добавить">${out ? 'Закончилось' : `<span>${som(i.price)}</span>${ic('plus', 18)}`}</button>`;
  return `<article class="dcard">${ph(d, '', (hot >= 2 ? `<span class="bd t">${ic('users', 13)}${hot}</span>` : '') + (!out && i.left <= 5 ? `<span class="bd b">осталось ${i.left}</span>` : ''))}<b>${esc(d.name)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}${ctl}</article>`;
}
function cKitchen(id) {
  const k = kitchen(id),
    m = MENU[id].today,
    p = point(S.me.pointId),
    n = pointStats(p.id).by[id] || 0;
  const items = m.published ? menuItems(id) : [],
    cart = S.carts[id] || {},
    fp = dishFromPoint(id, p.id),
    can = winState(k) === 'open' && m.published;
  const cats = CATS.filter(c => items.some(i => i.dish.cat === c.id)),
    cnt = cartCnt(id),
    total = cartSum(id),
    fee = feeFor(k, p.id),
    need = k.fee && k.freeFrom ? k.freeFrom - n : 0;
  return `<header class="kp-h"><button class="rbtn" data-act="back" aria-label="Назад">${ic('left')}</button><h1>${esc(k.name)}</h1><a class="rbtn" href="tel:${k.phone.replace(/\s/g, '')}" aria-label="Позвонить">${ic('phone', 19)}</a></header>
  <p class="kp-meta"><span class="rate">${k.rating}</span> · ${TYPES[k.type].short} · ${esc(k.addr)}</p>
  <div class="kp-tags">${m.published ? dueTag(k) : ''}<span class="tagc">${ic('truck', 14)}${k.dFrom}–${k.dTo}${fee ? ', ' + fee + ' сом' : ''}</span>${fee ? '' : `<span class="tagc ok">бесплатно</span>`}${peopleTag(n)}</div>
  ${can && need > 0 ? `<p class="kp-free">Ещё ${need} ${pl(need, P_ORD)} с вашей точки — доставка бесплатно</p>` : ''}
  ${m.published && m.note ? `<p class="kp-note">${esc(m.note)}</p>` : ''}
  ${!m.published ? `<div class="blank" style="margin-top:16px"><div class="blank-em">🍽️</div><b>Меню на сегодня ещё нет</b></div>` : ''}
  ${cats.length > 2 ? `<div class="tabs"><div class="chips" data-keep="cats">${cats.map(c => `<button class="chip" data-act="jump" data-to="cat-${c.id}">${c.n}</button>`).join('')}</div></div>` : ''}
  ${cats
    .map(
      c =>
        `<section><h2 class="cat-h" id="cat-${c.id}">${c.n}</h2><div class="dgrid">${items
          .filter(i => i.dish.cat === c.id)
          .map(i => dishCard(i, cart[i.dishId] || 0, can, fp[i.dishId] || 0))
          .join('')}</div></section>`
    )
    .join('')}
  ${can && cnt ? `<div class="cartbar">${total < k.min ? `<div class="cartbtn off">Ещё ${som(k.min - total)} до заказа</div>` : `<button class="cartbtn" data-act="checkout" data-id="${id}"><span class="q">${cnt}</span><span class="cb-l">Корзина</span><span>${som(total)}</span></button>`}</div>` : ''}`;
}
