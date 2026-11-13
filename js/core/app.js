'use strict';
/* ================= РЕНДЕР ================= */
const A = {},
  C = {},
  I = {},
  SC = {},
  SHEETS = {};
let lastKey = '',
  toastT;
const viewKey = () =>
  !S.started
    ? 'w'
    : S.role === 'client'
      ? 'c:' + (S.cview ? S.cview.kind + S.cview.id : S.ctab)
      : 'k:' + S.ktab + (S.ktab === 'menu' ? ':' + S.mdoc : '');
function demoBar() {
  const nreq = ORDERS.filter(o => o.kid === S.kid && o.day === 0 && o.status === 'request' && o.isNew).length;
  return `<div class="demo"><div class="seg" role="group" aria-label="Роль в прототипе"><button class="${S.role === 'client' ? 'on' : ''}" data-act="role" data-role="client">Клиент</button><button class="${S.role === 'kitchen' ? 'on' : ''}" data-act="role" data-role="kitchen">Кухня${nreq && S.role === 'client' ? `<i class="bdg">${nreq}</i>` : ''}</button></div>
  <label class="demo-time" title="Демо-время">${ic('clock', 15)}<select data-chg="time" aria-label="Демо-время">${['08:40', '09:52', '10:20'].map(t => `<option ${t === S.time ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>`;
}
/* глубина экрана: по ней выбирается направление анимации при переходе */
const viewDepth = () =>
  !S.started
    ? 0
    : S.role === 'client'
      ? S.cview
        ? S.cview.kind === 'checkout'
          ? 3
          : 2
        : 1
      : S.mdoc != null && S.ktab === 'menu'
        ? 2
        : 1;
let lastDepth = 0,
  sheetOpen = null;
function render(opt = {}) {
  const key = viewKey(),
    same = key === lastKey,
    depth = viewDepth(),
    sy = window.scrollY,
    keep = {};
  $$('[data-keep]').forEach(e => (keep[e.dataset.keep] = [e.scrollLeft, e.scrollTop]));
  if (!same) SC[lastKey] = sy;
  for (const k in LM) LM[k].el.remove();
  document.body.dataset.role = S.started ? S.role : 'welcome';
  document.body.dataset.kw = S.kw;
  document.body.dataset.ks = S.kside;
  FX.dir = same ? '' : opt.back || depth < lastDepth ? 'back' : depth > lastDepth ? 'fwd' : '';
  morph($('#app'), !S.started ? welcome() : demoBar() + (S.role === 'client' ? clientApp() : kitchenApp()));
  renderSheet();
  document.body.classList.toggle('lock', !!S.sheet);
  $$('[data-keep]').forEach(e => {
    const v = keep[e.dataset.keep];
    if (v) {
      e.scrollLeft = v[0];
      e.scrollTop = v[1];
    }
  });
  window.scrollTo(0, same ? sy : opt.back ? SC[key] || 0 : 0);
  lastKey = key;
  lastDepth = depth;
  mapMount();
  navSync();
}
/* шторка: появляется и исчезает с анимацией, а пока открыта — обновляется на месте */
function renderSheet() {
  const root = $('#sheet-root'),
    cur = root.firstElementChild,
    live = cur && !cur.classList.contains('out');
  if (S.sheet) {
    const html = `<div class="sheet-bg" data-act="closeBg"><div class="sheet" role="dialog" aria-modal="true"><button class="sheet-x" data-act="closeSheet" aria-label="Закрыть">${ic('x', 18)}</button>${SHEETS[S.sheet.type]()}</div></div>`;
    if (live && sheetOpen === S.sheet.type) morph(root, html);
    else root.innerHTML = html;
    sheetOpen = S.sheet.type;
  } else if (live) {
    sheetOpen = null;
    cur.classList.add('out');
    setTimeout(() => cur.remove(), FX.off() ? 0 : 190);
  }
}
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), 3000);
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  if (el.dataset.act === 'mapSel' && MV.dragged && el.closest('.map')) return;
  const fn = A[el.dataset.act];
  if (fn) fn(el.dataset, el, e);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && S.sheet) {
    S.sheet = null;
    render();
    return;
  }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role=button][data-act]')) {
    e.preventDefault();
    e.target.click();
  }
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-chg]');
  if (el && C[el.dataset.chg]) C[el.dataset.chg](el.dataset, el);
});
document.addEventListener('input', e => {
  const el = e.target.closest('[data-inp]');
  if (el && I[el.dataset.inp]) I[el.dataset.inp](el.dataset, el);
});
