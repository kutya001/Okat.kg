'use strict';
/* ---------- правка заявки и уточнение к заказу ----------
   Пока кухня не подтвердила заявку, клиент меняет её сам. После подтверждения изменения уходят кухне
   как уточнение: она принимает их или оставляет заказ прежним. Черновик правки живёт в S.sheet. */
A.oedit = d => {
  const o = order(d.id);
  S.sheet = { type: 'oedit', id: o.id, items: qtyMap(o), note: o.status === 'request' ? o.comment : '' };
  render();
};
A.oeAdd = d => {
  const o = order(S.sheet.id),
    q = S.sheet.items[d.id] || 0;
  if (q >= roomFor(o, d.id)) {
    toast('Больше порций нет');
    return;
  }
  S.sheet.items[d.id] = q + 1;
  render();
};
A.oeSub = d => {
  S.sheet.items[d.id] = Math.max(0, (S.sheet.items[d.id] || 0) - 1);
  render();
};
I.oeNote = (d, el) => {
  S.sheet.note = el.value;
  render();
};
A.oeSave = () => {
  const o = order(S.sheet.id),
    map = S.sheet.items,
    note = S.sheet.note.trim();
  if (o.status === 'request') {
    setItems(o, map);
    o.comment = note;
    o.edited = S.time;
    o.isNew = true;
    o.log.push(['edited', S.time]);
    toast('Заявка изменена');
    /* сумма выросла — сразу предлагаем доплатить и прикрепить чек */
    S.sheet = dueSum(o) > 0 ? { type: 'opay', id: o.id } : null;
  } else {
    o.change = { items: { ...map }, note, t: S.time, st: 'wait' };
    toast('Уточнение отправлено кухне');
    S.sheet = null;
  }
  render();
};
SHEETS.oedit = () => {
  const o = order(S.sheet.id),
    k = kitchen(o.kid),
    req = o.status === 'request',
    map = S.sheet.items,
    note = S.sheet.note.trim(),
    ids = [...new Set([...o.items.map(i => i.dishId), ...Object.keys(map)])],
    menu = menuItems(o.kid),
    sum = mapSum(o, map),
    diff = orderDiff(o, map),
    same = !diff.length && note === (req ? o.comment : ''),
    low = sum < minFor(k),
    empty = !Object.values(map).some(q => q > 0),
    delta = sum - o.sum;
  const row = id => {
    const q = map[id] || 0,
      d = dish(id) || {},
      name = (o.items.find(i => i.dishId === id) || d).name;
    return `<div class="row crow ${q ? '' : 'gone'}">${ph(d, 'em')}<span><b>${esc(name)}</b><small>${som(priceIn(o, id))}</small></span><div class="stepper sm"><button data-act="oeSub" data-id="${id}" ${q ? '' : 'disabled'} aria-label="Убрать порцию">${ic('minus', 18)}</button><span>${q}</span><button data-act="oeAdd" data-id="${id}" ${q >= roomFor(o, id) ? 'disabled' : ''} aria-label="Добавить порцию">${ic('plus', 18)}</button></div></div>`;
  };
  const more = menu.filter(i => !ids.includes(i.dishId) && i.left > 0);
  return `<h2>${req ? 'Изменить заявку' : 'Уточнить заказ'}</h2>
  <div class="rows">${ids.map(row).join('')}</div>
  ${
    more.length
      ? `<p class="cap">Добавить</p><div class="rc-scroll oe-more" data-keep="oe-more">${more
          .map(
            i =>
              `<div class="mini">${ph(i.dish)}<b>${esc(i.dish.name)}</b><button class="addbtn" data-act="oeAdd" data-id="${i.dishId}" aria-label="${esc(i.dish.name)}, ${som(i.price)}. Добавить"><span>${som(i.price)}</span>${ic('plus', 18)}</button></div>`
          )
          .join('')}</div>`
      : ''
  }
  <input class="cmt" value="${esc(S.sheet.note)}" data-inp="oeNote" maxlength="140" placeholder="${req ? 'Комментарий для кухни' : 'Что изменить: например, без лука'}" aria-label="${req ? 'Комментарий для кухни' : 'Уточнение для кухни'}">
  <div class="totals"><div><span>Было</span><b>${som(o.sum)}</b></div><div class="sum"><span>Станет</span><b>${som(sum)}${delta ? `<i class="${delta > 0 ? 'up' : 'dn'}">${delta > 0 ? '+' : '−'}${fmt(Math.abs(delta))}</i>` : ''}</b></div></div>
  <button class="btn pri block big" data-act="oeSave" ${same || low || empty ? 'disabled' : ''}>${empty ? 'В заказе должно быть блюдо' : low ? `Минимальный заказ ${som(minFor(k))}` : req ? 'Сохранить' : 'Отправить кухне'}</button>
  ${req ? '' : '<p class="fine">Кухня примет изменения или оставит заказ прежним.</p>'}`;
};

/* ---------- оплата переводом из карточки заказа: реквизиты и чек ---------- */
A.opay = d => {
  S.sheet = { type: 'opay', id: d.id };
  render();
};
C.oReceipt = (d, el) =>
  readImage(
    el.files && el.files[0],
    1200,
    img => {
      const o = order(d.id),
        k = kitchen(o.kid);
      /* заказ был за наличные — клиент решил перевести: меняем способ оплаты */
      if (o.pay === 'cash') o.pay = k.pay.find(x => x !== 'cash');
      o.receipts.push({ img, t: S.time, sum: dueSum(o) || o.total, st: 'wait' });
      o.isNew = true;
      syncPay(o);
      S.sheet = null;
      toast('Чек отправлен кухне');
      render();
    },
    () => toast('Не получилось открыть файл')
  );
SHEETS.opay = () => {
  const o = order(S.sheet.id),
    k = kitchen(o.kid),
    sum = o.pay === 'cash' ? o.total : dueSum(o) || o.total;
  return `<h2>Оплата переводом</h2>
  <div class="pay-box"><div class="pb-to"><span><small>Переведите ${som(sum)}</small><b>${esc(k.payTo.num)}</b><small>${esc(k.payTo.name)}</small></span><button class="rbtn fill" data-act="copyNum" data-v="${esc(k.payTo.num)}" aria-label="Скопировать номер">${ic('copy', 19)}</button></div></div>
  <label class="btn pri block big">${ic('clip', 20)}Прикрепить чек<input type="file" accept="image/*" data-chg="oReceipt" data-id="${o.id}" hidden></label>
  <p class="fine">Кухня проверит чек и отметит оплату.</p>`;
};
