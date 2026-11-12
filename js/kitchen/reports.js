'use strict';
/* ---------- выручка ---------- */
const fmtK = n =>
  n >= 10000
    ? Math.round(n / 1000) + 'к'
    : n >= 1000
      ? (n / 1000).toFixed(1).replace('.', ',') + 'к'
      : String(Math.round(n));
function kReports(k) {
  const R = repData(k.id, S.rep),
    max = Math.max(1, ...R.days.map(d => d.rev)),
    n = R.days.length;
  const kpi = (l, v, sub, cls = '') =>
    `<div class="kpi ${cls}"><small>${l}</small><b>${v}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;
  return `<div class="daytabs">${[
    ['today', 'Сегодня'],
    ['7', '7 дней'],
    ['30', '30 дней'],
  ]
    .map(([id, l]) => `<button class="chip ${S.rep === id ? 'on' : ''}" data-act="rep" data-p="${id}">${l}</button>`)
    .join('')}</div>
  <div class="kpis">${kpi('Выручка', fmt(R.rev) + '<u>сом</u>', R.orders + ' ' + pl(R.orders, P_ORD))}${kpi('Себестоимость', fmt(R.cost) + '<u>сом</u>')}${kpi('Прибыль', fmt(R.profit) + '<u>сом</u>', R.margin + '%', 'good')}${kpi('Средний чек', fmt(R.avg) + '<u>сом</u>')}</div>
  ${n > 1 ? `<section class="card"><div class="bars ${n > 7 ? 'n30' : ''}">${R.days.map(d => `<div class="bar ${d.off === 0 ? 'today' : ''}" title="${dateLong(d.date)}: ${som(d.rev)}">${n <= 7 ? `<span>${d.rev ? fmtK(d.rev) : ''}</span>` : ''}<i style="--h:${(d.rev / max).toFixed(3)}"></i><small>${n <= 7 ? WD[d.date.getDay()] : d.date.getDay() === 1 ? d.date.getDate() : ''}</small></div>`).join('')}</div></section>` : ''}
  <section class="card">${R.rows.length ? `<div class="tblw"><table><thead><tr><th>Блюдо</th><th>Порций</th><th>Выручка</th><th class="opt">Себест.</th><th class="opt">Прибыль</th><th>Маржа</th></tr></thead><tbody>${R.rows.map(x => `<tr><td>${esc(x.name)}</td><td>${x.qty}</td><td>${fmt(x.rev)}</td><td class="opt">${fmt(x.cost)}</td><td class="opt">${fmt(x.rev - x.cost)}</td><td>${x.rev ? Math.round(((x.rev - x.cost) / x.rev) * 100) : 0}%</td></tr>`).join('')}</tbody><tfoot><tr><td>Итого</td><td>${sumBy(R.rows, x => x.qty)}</td><td>${fmt(R.rev)}</td><td class="opt">${fmt(R.cost)}</td><td class="opt">${fmt(R.profit)}</td><td>${R.margin}%</td></tr></tfoot></table></div>` : '<p class="empty">Пусто</p>'}</section>`;
}
A.rep = d => {
  S.rep = d.p;
  render();
};
