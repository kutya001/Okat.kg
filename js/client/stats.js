'use strict';
/* ---------- статистика клиента: сколько, где, что и сколько калорий ---------- */
function cStats() {
  const days = +S.cstat,
    st = myStats(days),
    per = [
      ['7', '7 дней'],
      ['30', '30 дней'],
    ]
      .map(
        ([id, l]) => `<button class="chip ${S.cstat === id ? 'on' : ''}" data-act="cstat" data-p="${id}">${l}</button>`
      )
      .join('');
  if (!st.n)
    return `<div class="daytabs">${per}</div><div class="blank"><div class="blank-em">📊</div><b>За это время заказов не было</b></div>`;
  const tile = (v, l) => `<div><b>${v}</b><small>${l}</small></div>`,
    avg = x => (st.known ? Math.round(x / st.known) : 0),
    max = Math.max(1, ...Object.values(st.byDay)),
    bars = [];
  for (let off = -(days - 1); off <= 0; off++) {
    const v = st.byDay[off] || 0,
      d = dayDate(off);
    bars.push(
      `<div class="bar ${off === 0 ? 'today' : ''}" title="${dateLong(d)}: ${v ? v + ' ккал' : 'без заказа'}">${days <= 7 ? `<span>${v || ''}</span>` : ''}<i style="--h:${(v / max).toFixed(3)}"></i><small>${days <= 7 ? WD[d.getDay()] : d.getDay() === 1 ? d.getDate() : ''}</small></div>`
    );
  }
  /* доля калорий: белки и углеводы дают 4 ккал на грамм, жиры — 9 */
  const kp = st.p * 4,
    kf = st.f * 9,
    kc = st.c * 4,
    ks = Math.max(1, kp + kf + kc),
    pct = x => Math.round((x / ks) * 100);
  return `<div class="daytabs">${per}</div>
  <div class="nutr s3">${tile(st.n, pl(st.n, P_ORD))}${tile(fmt(st.sum), 'сом')}${tile(fmt(st.avg), 'средний чек')}</div>
  ${
    st.known
      ? `<section class="card"><div class="card-h"><h2>Калории</h2><span class="muted">в среднем ${fmt(avg(st.kcal))} за обед</span></div><div class="bars sm ${days > 7 ? 'n30' : ''}">${bars.join('')}</div></section>
  <section class="card"><div class="card-h"><h2>Белки, жиры, углеводы</h2><span class="muted">за обед</span></div>
    <div class="split" role="img" aria-label="Доля калорий: белки ${pct(kp)}%, жиры ${pct(kf)}%, углеводы ${pct(kc)}%"><i class="sp" style="flex:${kp}"></i><i class="sf" style="flex:${kf}"></i><i class="sc" style="flex:${kc}"></i></div>
    <div class="legend"><span><b><i class="sp"></i>${avg(st.p)} г</b>белки, ${pct(kp)}%</span><span><b><i class="sf"></i>${avg(st.f)} г</b>жиры, ${pct(kf)}%</span><span><b><i class="sc"></i>${avg(st.c)} г</b>углеводы, ${pct(kc)}%</span></div></section>`
      : ''
  }
  <section class="card"><div class="card-h"><h2>Заведения</h2></div><div class="rows flat">${st.kitchens
    .map(x => {
      const k = kitchen(x.kid);
      return `<button class="row" data-act="openK" data-id="${k.id}"><span class="ava">${k.em}</span><span><b>${esc(k.name)}</b><small>${x.n} ${pl(x.n, P_ORD)}</small></span><b>${som(x.sum)}</b></button>`;
    })
    .join('')}</div></section>
  <section class="card"><div class="card-h"><h2>Блюда</h2></div><div class="rows flat">${st.dishes
    .slice(0, 8)
    .map(
      x =>
        `<div class="row">${ph(x.d, 'em')}<span><b>${esc(x.name)}</b><small>${esc(kitchen(x.kid).name)}</small></span><b>× ${x.qty}</b></div>`
    )
    .join('')}</div></section>`;
}
A.otab = d => {
  S.otab = d.t;
  render();
};
A.cstat = d => {
  S.cstat = d.p;
  render();
};
