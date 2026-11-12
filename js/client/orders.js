'use strict';
/* ---------- заказы ---------- */
const OFLOW = ['request', 'confirmed', 'cooking', 'delivering', 'delivered'];
const OST = {
  request: 'Ждём подтверждения',
  confirmed: 'Заказ принят',
  cooking: 'Готовится',
  delivering: 'В пути',
  delivered: 'Доставлен',
  rejected: 'Отклонён',
  cancelled: 'Отменён',
};
function orderCard(o) {
  const k = kitchen(o.kid),
    idx = OFLOW.indexOf(o.status),
    off = idx < 0,
    items = o.items.map(i => esc(i.name) + (i.qty > 1 ? ' × ' + i.qty : '')).join(', '),
    acts = [];
  if (o.day < 0 || o.status === 'delivered' || off) {
    acts.push(`<button class="btn sm sec" data-act="again" data-id="${o.id}">${ic('repeat', 16)}Повторить</button>`);
    return `<article class="ord past"><div class="o-h"><h3>${esc(k.name)}</h3><span>${o.day < 0 ? 'вчера' : OST[o.status].toLowerCase()}</span></div>${off && o.reason ? `<p class="o-why">${esc(o.reason)}</p>` : ''}<p class="o-items">${items}</p><div class="o-f"><b>${som(o.total)}</b><div class="acts">${acts.join('')}</div></div></article>`;
  }
  if (o.status === 'request')
    acts.push(`<button class="btn sm ghost warn" data-act="cancel" data-id="${o.id}">Отменить</button>`);
  else {
    if (o.pay !== 'cash' && !o.paid)
      acts.push(
        o.receipt
          ? `<span class="tagc">Чек отправлен</span>`
          : `<button class="btn sm sec" data-act="receipt" data-id="${o.id}">Прикрепить чек</button>`
      );
    if (o.paid) acts.push(`<span class="tagc ok">${ic('check', 14)}Оплачен</span>`);
    acts.push(
      `<a class="rbtn fill" href="tel:${k.phone.replace(/\s/g, '')}" aria-label="Позвонить кухне">${ic('phone', 18)}</a>`
    );
  }
  return `<article class="ord">
    <div class="o-h"><h3>${OST[o.status]}</h3><span>№ ${o.num}</span></div>
    <p class="o-k">${esc(k.name)}, ${k.dFrom}–${k.dTo}</p>
    <div class="segs ${o.status === 'request' ? 'wait' : ''}" role="img" aria-label="Шаг ${idx + 1} из 5">${OFLOW.map((s, i) => `<i class="${i <= idx ? 'on' : ''}"></i>`).join('')}</div>
    <p class="o-items">${items}</p>
    <div class="o-f"><b>${som(o.total)}</b><div class="acts">${acts.join('')}</div></div>
  </article>`;
}
function cOrders() {
  const mine = ORDERS.filter(o => o.clientId === 'me').sort((a, b) => b.day - a.day || b.num - a.num);
  const live = mine.filter(o => o.day === 0 && OFLOW.indexOf(o.status) >= 0 && o.status !== 'delivered'),
    past = mine.filter(o => !live.includes(o));
  return `<h1 class="page-h">Заказы</h1>
  ${live.length ? live.map(orderCard).join('') : `<div class="blank"><div class="blank-em">🍽️</div><b>Сегодня заказов нет</b><button class="btn pri" data-act="tab" data-tab="home">Выбрать обед</button></div>`}
  ${past.length ? `<h2 class="sub-h">История</h2>${past.map(orderCard).join('')}` : ''}`;
}
