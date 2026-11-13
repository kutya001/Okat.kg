'use strict';
/* ---------- клиенты: кто, когда и что заказывал ---------- */
const KCL_SORT = { last: 'Недавние', n: 'Частые', sum: 'По сумме', name: 'По имени' };
function kClients(k) {
  const f = S.kcl,
    days = +f.period,
    all = clientBook(k.id, days),
    q = f.q.trim().toLowerCase(),
    pts = (SERVES[k.id] || []).map(point),
    list = all
      .filter(
        c => (f.point === 'all' || c.pointId === f.point) && (!q || (c.name + ' ' + c.phone).toLowerCase().includes(q))
      )
      .sort(
        {
          last: (a, b) => b.last - a.last || b.n - a.n,
          n: (a, b) => b.n - a.n || b.sum - a.sum,
          sum: (a, b) => b.sum - a.sum,
          name: (a, b) => a.name.localeCompare(b.name, 'ru'),
        }[f.sort]
      ),
    shown = f.all ? list : list.slice(0, 30),
    orders = sumBy(all, c => c.n),
    kpi = (l, v, sub) => `<div class="kpi"><small>${l}</small><b>${v}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;
  return `<div class="daytabs">${[
    ['7', '7 дней'],
    ['30', '30 дней'],
  ]
    .map(
      ([id, l]) =>
        `<button class="chip ${f.period === id ? 'on' : ''}" data-act="kclPeriod" data-p="${id}">${l}</button>`
    )
    .join('')}</div>
  <div class="kpis k4">${kpi('Клиентов', all.length)}${kpi('Постоянных', all.filter(c => c.n >= (days > 7 ? 4 : 2)).length, `от ${days > 7 ? 4 : 2} заказов`)}${kpi('Новых за неделю', all.filter(c => c.first > -7).length)}${kpi('Средний чек', fmt(orders ? sumBy(all, c => c.sum) / orders : 0) + '<u>сом</u>')}</div>
  <div class="k-bar kcl-bar"><label class="dq">${ic('search', 19)}<input type="search" value="${esc(f.q)}" data-inp="kclQ" placeholder="Имя или телефон" aria-label="Найти клиента"></label>
    <label class="selw">${ic('pin', 18)}<select data-chg="kclF" data-f="point" aria-label="Точка"><option value="all">Все точки</option>${pts.map(p => `<option value="${p.id}" ${f.point === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
    <label class="selw">${ic('sort', 18)}<select data-chg="kclF" data-f="sort" aria-label="Порядок">${Object.entries(
      KCL_SORT
    )
      .map(([id, l]) => `<option value="${id}" ${f.sort === id ? 'selected' : ''}>${l}</option>`)
      .join('')}</select></label></div>
  <section class="card">${
    shown.length
      ? `<div class="tblw"><table class="ctbl"><thead><tr><th>Клиент</th><th class="opt">Точка</th><th>Заказов</th><th>Сумма</th><th class="opt">Средний чек</th><th>Последний</th><th class="opt">Чаще всего</th></tr></thead><tbody>${shown
          .map(
            c =>
              `<tr data-act="kclient" data-id="${c.id}" tabindex="0"><td><b>${esc(c.name)}</b><small>${c.phone}</small></td><td class="opt">${esc(point(c.pointId).name)}</td><td>${c.n}</td><td>${fmt(c.sum)}</td><td class="opt">${fmt(c.avg)}</td><td>${dayShort(c.last)}</td><td class="opt">${esc(c.top[0].name)}</td></tr>`
          )
          .join(
            ''
          )}</tbody></table></div>${list.length > shown.length ? `<button class="btn sec block" data-act="kclAll">Показать всех (${list.length})</button>` : ''}`
      : '<p class="empty">Никого не нашлось</p>'
  }</section>`;
}
A.kclPeriod = d => {
  S.kcl.period = d.p;
  render();
};
I.kclQ = (d, el) => {
  S.kcl.q = el.value;
  render();
};
C.kclF = (d, el) => {
  S.kcl[d.f] = el.value;
  render();
};
A.kclAll = () => {
  S.kcl.all = true;
  render();
};
A.kclient = d => {
  S.sheet = { type: 'kclient', id: d.id };
  render();
};
/* шторка клиента: итоги и вся история заказов у этого заведения */
SHEETS.kclient = () => {
  const c = clientBook(S.kid, 30).find(x => x.id === S.sheet.id);
  if (!c) return `<h2>Заказов нет</h2>`;
  const tile = (v, l) => `<div><b>${v}</b><small>${l}</small></div>`;
  return `<div class="prof"><span class="ava">${esc(c.name[0])}</span><div><b>${esc(c.name)}</b><small>${esc(point(c.pointId).name)}</small></div><a class="rbtn fill" href="tel:${c.phone.replace(/\s/g, '')}" aria-label="Позвонить: ${c.phone}">${ic('phone', 18)}</a></div>
  <div class="nutr s3">${tile(c.n, pl(c.n, P_ORD))}${tile(fmt(c.sum), 'сом')}${tile(fmt(c.avg), 'средний чек')}</div>
  <div class="ds-tags">${c.top
    .slice(0, 4)
    .map(t => `<span class="tagc">${esc(t.name)} × ${t.qty}</span>`)
    .join('')}</div>
  <p class="cap">История за 30 дней</p>
  <div class="rows hist">${c.orders
    .map(
      o =>
        `<div class="row"><span><b>${dayShort(o.day)}, ${WD[dayDate(o.day).getDay()]}</b><small>${o.items.map(i => esc(dishName(i.dishId)) + (i.qty > 1 ? ' × ' + i.qty : '')).join(', ')}</small></span><b>${som(o.total)}</b></div>`
    )
    .join('')}</div>`;
};
