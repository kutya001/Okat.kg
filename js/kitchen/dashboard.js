'use strict';
/* ---------- сводка ---------- */
function kDash(k, st) {
  const m = MENU[k.id].today,
    ws = winState(k),
    items = menuItems(k.id),
    bp = byPoint(k.id);
  const line = !m.published
    ? `<button class="tagc warn" data-act="mOpen" data-d="0">Меню не опубликовано${ic('right', 14)}</button>`
    : `<span class="tagc ${ws === 'open' ? 'ok' : ''}">${ic('clock', 14)}${ws === 'open' ? 'приём до ' + k.to : ws === 'closed' ? 'приём закрыт' : 'приём с ' + k.from}</span><span class="tagc">${ic('truck', 14)}${k.dFrom}–${k.dTo}</span>`;
  const prod = items
    .map(i => ({ i, c: qtyBy(k.id, i.dishId, isReal), r: qtyBy(k.id, i.dishId, o => o.status === 'request') }))
    .sort((a, b) => b.c + b.r - (a.c + a.r));
  const kpi = (l, v, sub, cls = '') =>
    `<div class="kpi ${cls}"><small>${l}</small><b>${v}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;
  return `<div class="statline">${line}</div>
  <div class="kpis">
    <button class="kpi kpi-main ${st.req.length ? 'act' : ''}" data-act="ktab" data-tab="orders"><small>Новые заявки</small><b>${st.req.length}</b>${st.req.length ? `<span>${som(st.reqSum)}</span>` : ''}${ic('right')}</button>
    ${kpi('Заказы', st.real.length)}${kpi('Порции', st.por, st.porReq ? '+' + st.porReq + ' в заявках' : '')}${kpi('Выручка', fmt(st.rev) + '<u>сом</u>', 'оплачено ' + fmt(st.paid))}${kpi('Себестоимость', fmt(st.cost) + '<u>сом</u>')}${kpi('Прибыль', fmt(st.profit) + '<u>сом</u>', st.margin + '%', 'good wide')}
  </div>
  <div class="k-grid">
   <section class="card"><div class="card-h"><h2>Готовим</h2><div class="lg"><span><i class="c"></i>заказы</span><span><i class="r"></i>заявки</span></div></div>
    ${prod.length ? prod.map(({ i, c, r }) => `<div class="prow">${ph(i.dish, 'em')}<div class="pn"><b>${esc(i.dish.name)}</b><div class="pbar"><i class="c" style="width:${Math.min(100, (c / Math.max(1, i.limit)) * 100).toFixed(1)}%"></i><i class="r" style="width:${Math.min(100, (r / Math.max(1, i.limit)) * 100).toFixed(1)}%"></i></div></div><div class="pq"><b>${c}</b>${r ? `<em>+${r}</em>` : ''}<small>/ ${i.limit}</small></div></div>`).join('') : '<p class="empty">Пусто</p>'}
   </section>
   <section class="card"><div class="card-h"><h2>Доставка</h2></div>
    ${
      bp.length
        ? `<div class="kmap"><div id="map" class="map" data-mode="kitchen">${S.map.real ? '' : mapSVG('kitchen')}</div>${mapCtl()}</div>${mapNote()}
    ${bp.map(x => `<button class="pt ${S.map.sel === x.p.id ? 'sel' : ''}" data-act="mapSel" data-id="${x.p.id}"><span class="pt-n">${x.orders}</span><span><b>${esc(x.p.name)}</b><small>${x.por} ${pl(x.por, P_POR)}</small></span><b class="pt-s">${som(x.sum)}</b></button>`).join('')}`
        : '<p class="empty">Пусто</p>'
    }
   </section>
  </div>`;
}
