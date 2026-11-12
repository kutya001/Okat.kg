'use strict';
/* ---------- шторка: точка доставки ---------- */
SHEETS.points = () => `<h2>Точка доставки</h2>
  <div class="list">${POINTS.map(p => `<button class="li ${p.id === S.me.pointId ? 'sel' : ''}" data-act="setPoint" data-id="${p.id}">${ic('pin')}<span><b>${esc(p.name)}</b><small>${esc(p.addr)}</small></span>${p.id === S.me.pointId ? ic('check') : ''}</button>`).join('')}</div>
  <button class="btn sec block" data-act="soon">${ic('plus', 18)}Другой адрес</button>`;
