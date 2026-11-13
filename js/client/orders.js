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
    return `<article class="ord past"><div class="o-h"><h3>${esc(k.name)}</h3><span>${o.day < 0 ? dayShort(o.day) : OST[o.status].toLowerCase()}</span></div>${off && o.reason ? `<p class="o-why">${esc(o.reason)}</p>` : ''}<p class="o-items">${items}</p><div class="o-f"><b>${som(o.total)}</b><div class="acts">${acts.join('')}</div></div></article>`;
  }
  const chk = checkOf(o),
    bad = chk === 'bad',
    due = dueSum(o),
    over = overSum(o),
    canPay = k.pay.some(x => x !== 'cash'),
    tags = [];
  /* оплата: состояние чеков одной меткой; нажатие открывает чеки */
  if (o.receipts.length)
    tags.push(
      `<button class="tagc ${chk === 'ok' && !due ? 'ok' : bad ? 'bad' : ''}" data-act="rcpt" data-id="${o.id}">${ic(chk === 'ok' ? 'check' : 'clip', 14)}${chk === 'wait' ? 'Чек на проверке' : bad ? 'Чек не подошёл' : due ? 'Оплачен частично' : 'Оплачен'}</button>`
    );
  else if (o.paid) tags.push(`<span class="tagc ok">${ic('check', 14)}Оплачен</span>`);
  else if (o.pay === 'cash')
    tags.push(
      canPay
        ? `<button class="tagc" data-act="opay" data-id="${o.id}">${ic('clip', 14)}Прикрепить чек</button>`
        : `<span class="tagc">Наличные</span>`
    );
  if (over) tags.push(`<span class="tagc">Переплата ${som(over)}</span>`);
  if (o.change)
    tags.push(
      o.change.st === 'wait'
        ? `<span class="tagc warn">Уточнение у кухни</span>`
        : o.change.st === 'ok'
          ? `<span class="tagc ok">Изменения приняты</span>`
          : `<span class="tagc bad">Кухня не изменила заказ</span>`
    );
  /* действия: до подтверждения заявку можно править, после — отправить кухне уточнение */
  if (o.status === 'request') {
    acts.push(`<button class="btn sm sec" data-act="oedit" data-id="${o.id}">Изменить</button>`);
    acts.push(`<button class="btn sm ghost warn" data-act="cancel" data-id="${o.id}">Отменить</button>`);
  } else {
    if (['confirmed', 'cooking'].includes(o.status) && !(o.change && o.change.st === 'wait'))
      acts.push(`<button class="btn sm sec" data-act="oedit" data-id="${o.id}">Уточнить</button>`);
    acts.push(
      `<a class="rbtn fill" href="tel:${k.phone.replace(/\s/g, '')}" aria-label="Позвонить кухне">${ic('phone', 18)}</a>`
    );
  }
  const needPay = o.pay !== 'cash' && (due > 0 || bad);
  return `<article class="ord" data-key="ord-${o.id}">
    <div class="o-h"><h3>${bad && o.status === 'request' ? 'Нужен новый чек' : OST[o.status]}</h3><span>№ ${o.num}</span></div>
    <p class="o-k">${esc(k.name)}, ${k.dFrom}–${k.dTo}</p>
    <div class="segs ${o.status === 'request' ? 'wait' : ''}" role="img" aria-label="Шаг ${idx + 1} из 5">${OFLOW.map((s, i) => `<i class="${i <= idx ? 'on' : ''}"></i>`).join('')}</div>
    <p class="o-items">${items}</p>
    ${o.comment ? `<p class="o-cm">${esc(o.comment)}</p>` : ''}
    ${tags.length ? `<div class="o-tags">${tags.join('')}</div>` : ''}
    ${needPay ? `<div class="o-due"><span>${due > 0 ? `К оплате <b>${som(due)}</b>` : 'Пришлите новый чек'}</span><button class="btn sm pri" data-act="opay" data-id="${o.id}">${ic('clip', 16)}Прикрепить чек</button></div>` : ''}
    <div class="o-f"><b>${som(o.total)}</b><div class="acts">${acts.join('')}</div></div>
  </article>`;
}
function cOrders() {
  const seg = `<div class="mseg"><button class="${S.otab === 'list' ? 'on' : ''}" data-act="otab" data-t="list">Заказы</button><button class="${S.otab === 'stats' ? 'on' : ''}" data-act="otab" data-t="stats">Статистика</button></div>`;
  if (S.otab === 'stats') return `<h1 class="page-h">Заказы</h1>${seg}${cStats()}`;
  const mine = ORDERS.filter(o => o.clientId === 'me').sort((a, b) => b.day - a.day || b.num - a.num);
  const live = mine.filter(o => o.day === 0 && OFLOW.indexOf(o.status) >= 0 && o.status !== 'delivered'),
    past = mine.filter(o => !live.includes(o));
  return `<h1 class="page-h">Заказы</h1>${seg}
  ${live.length ? live.map(orderCard).join('') : `<div class="blank"><div class="blank-em">🍽️</div><b>Сегодня заказов нет</b><button class="btn pri" data-act="tab" data-tab="home">Выбрать обед</button></div>`}
  ${past.length ? `<h2 class="sub-h">История</h2>${past.map(orderCard).join('')}` : ''}`;
}
