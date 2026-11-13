'use strict';
/* ---------- заведение ---------- */
function kProfile(k) {
  return `<section class="card"><div class="pform">
    <label class="fld"><small>Название</small><input value="${esc(k.name)}" data-chg="kf" data-f="name"></label>
    <label class="fld"><small>Тип</small><select data-chg="kf" data-f="type">${Object.entries(TYPES)
      .map(([id, t]) => `<option value="${id}" ${k.type === id ? 'selected' : ''}>${t.label}</option>`)
      .join('')}</select></label>
    <label class="fld"><small>Адрес</small><input value="${esc(k.addr)}" data-chg="kf" data-f="addr"></label>
    <label class="fld"><small>Телефон</small><input type="tel" value="${esc(k.phone)}" data-chg="kf" data-f="phone"></label>
    <label class="fld"><small>Доставка, сом</small><input type="number" inputmode="numeric" min="0" step="10" value="${k.fee}" data-chg="kf" data-f="fee"></label>
    <label class="fld"><small>Бесплатно от заказов на точку</small><input type="number" inputmode="numeric" min="0" value="${k.freeFrom}" data-chg="kf" data-f="freeFrom"></label>
    <label class="fld"><small>Минимальный заказ, сом</small><input type="number" inputmode="numeric" min="0" step="50" value="${k.min}" data-chg="kf" data-f="min"></label>
    <div class="fld"><small>Оплата</small><div class="checks">${Object.entries(PAY)
      .map(
        ([id, p]) =>
          `<label><input type="checkbox" data-chg="kpay" data-p="${id}" ${k.pay.includes(id) ? 'checked' : ''}><span class="chip">${p.s}</span></label>`
      )
      .join('')}</div></div>
    <label class="fld"><small>Номер для переводов</small><input type="tel" value="${esc(k.payTo.num)}" data-chg="kpayTo" data-f="num"></label>
    <label class="fld"><small>Получатель</small><input value="${esc(k.payTo.name)}" data-chg="kpayTo" data-f="name" placeholder="Как в банковском приложении"></label>
  </div></section>
  <section class="card"><div class="card-h"><h2>Время для новых меню</h2></div><div class="ae-row" style="margin:0">${[
    ['from', 'Заявки с'],
    ['to', 'до'],
    ['dFrom', 'Доставка с'],
    ['dTo', 'до'],
  ]
    .map(
      ([f, l]) =>
        `<label class="fld"><small>${l}</small><input type="time" value="${k.def[f]}" data-chg="kdef" data-f="${f}"></label>`
    )
    .join('')}</div></section>
  <section class="card"><label class="fld"><small>Демо: другое заведение</small><select data-chg="kid">${KITCHENS.map(x => `<option value="${x.id}" ${x.id === k.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label></section>`;
}
C.kf = (d, el) => {
  const k = kitchen(S.kid);
  k[d.f] = ['fee', 'freeFrom', 'min'].includes(d.f)
    ? Math.max(0, Math.round(+el.value || 0))
    : el.value.trim() || k[d.f];
  toast('Сохранено');
  render();
};
C.kpayTo = (d, el) => {
  const k = kitchen(S.kid);
  k.payTo[d.f] = el.value.trim() || k.payTo[d.f];
  toast('Сохранено');
  render();
};
C.kdef = (d, el) => {
  if (el.value) {
    kitchen(S.kid).def[d.f] = el.value;
    toast('Сохранено');
  }
};
C.kpay = (d, el) => {
  const k = kitchen(S.kid);
  if (el.checked) {
    if (!k.pay.includes(d.p)) k.pay.push(d.p);
  } else if (k.pay.length === 1) {
    toast('Нужен хотя бы один способ');
    render();
    return;
  } else k.pay = k.pay.filter(x => x !== d.p);
  toast('Сохранено');
  render();
};
C.kid = (d, el) => {
  S.kid = el.value;
  S.map.kitchen = null;
  S.map.sel = null;
  S.kpoint = 'all';
  S.mdoc = null;
  render();
};
