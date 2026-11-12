'use strict';
/* ================= КАРТА: общее ================= */
function mapMount() {
  const el = $('#map');
  if (!el) return;
  if (S.map.real) {
    try {
      leafletMount(el.dataset.mode, el);
    } catch (e) {
      S.map.real = false;
      S.map.note = 'err';
      render();
      return;
    }
  } else schemeMount(el);
  const car = $('.mcar');
  if (car)
    car.onscroll = () => {
      clearTimeout(car._t);
      car._t = setTimeout(() => {
        const mid = car.scrollLeft + car.clientWidth / 2;
        let best = null,
          bd = 1e9;
        $$('.mcard', car).forEach(c => {
          const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
          if (d < bd) {
            bd = d;
            best = c;
          }
        });
        if (!best) return;
        const id = best.dataset.id === 'me' ? null : best.dataset.id;
        if (id !== S.map.sel) mapSelect(id, { fromScroll: true });
      }, 130);
    };
}
function mapSelect(id, o = {}) {
  S.map.sel = id || null;
  const el = $('#map');
  if (!el) return;
  const mode = el.dataset.mode,
    m = S.map.real && LM[mode];
  $$('.pin', el).forEach(g => g.classList.toggle('sel', !!id && g.dataset.id === id));
  $$('.mcard,.pt').forEach(c => c.classList.toggle('sel', !!id && c.dataset.id === id));
  if (m)
    for (const k in m.marks) if (m.marks[k].options.zIndexOffset < 600) m.marks[k].setZIndexOffset(k === id ? 400 : 0);
  const t = id && (kitchen(id) || point(id));
  if (t) {
    if (m)
      m.map.panInside(
        t.ll,
        mode === 'client'
          ? { paddingTopLeft: [60, 150], paddingBottomRight: [60, 150], animate: true }
          : { paddingTopLeft: [56, 60], paddingBottomRight: [56, 44], animate: true }
      );
    else if (MV.center) MV.center(t.x, t.y);
  }
  if (!o.fromScroll) {
    const c = $(`.mcard[data-id="${id || 'me'}"]`);
    if (c && c.parentNode)
      c.parentNode.scrollTo({
        left: c.offsetLeft - (c.parentNode.clientWidth - c.offsetWidth) / 2,
        behavior: 'smooth',
      });
  }
}
const mapCtl = () =>
  `<div class="map-ctl"><button class="zb" data-act="zoom" data-f="1.4" aria-label="Приблизить">${ic('plus')}</button><button class="zb" data-act="zoom" data-f="0.714" aria-label="Отдалить">${ic('minus')}</button><button data-act="locate" aria-label="${S.role === 'client' ? 'Показать мою точку' : 'Показать заведение'}">${ic('target')}</button></div>`;
const mapNote = () =>
  S.map.real === false ? `<p class="map-note">Схема. Настоящая карта откроется в браузере.</p>` : '';
