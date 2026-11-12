'use strict';
function cProfile() {
  const p = point(S.me.pointId);
  return `<h1 class="page-h">Профиль</h1>
  <div class="prof"><span class="ava">${esc(S.me.name[0])}</span><div><b>${esc(S.me.name)}</b><small>${S.me.phone}</small></div></div>
  <div class="list">
    <button class="li" data-act="sheet" data-sheet="points">${ic('pin')}<span><b>${esc(p.name)}</b><small>${esc(p.addr)}</small></span>${ic('right', 18)}</button>
    <div class="li">${ic('horn')}<span><b>Уведомления</b></span><label class="sw"><input type="checkbox" checked aria-label="Уведомления о заказе"><i></i></label></div>
  </div>
  <div class="list">
    <button class="li" data-act="role" data-role="kitchen">${ic('store')}<span><b>Кабинет заведения</b></span>${ic('right', 18)}</button>
    <button class="li" data-act="reset">${ic('repeat')}<span><b>Начать демо заново</b></span></button>
  </div>`;
}
