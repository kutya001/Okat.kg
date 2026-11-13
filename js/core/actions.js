'use strict';
/* общие действия */
A.start = d => {
  S.started = true;
  S.role = d.role;
  render();
};
A.home = () => {
  S.started = false;
  S.sheet = null;
  render();
};
A.role = d => {
  S.role = d.role;
  S.sheet = null;
  S.q = S.kq = '';
  S.qopen = S.kqopen = false;
  S.map.sel = null;
  render();
};
C.time = (d, el) => {
  S.time = el.value;
  render();
};
A.sheet = d => {
  S.sheet = { type: d.sheet };
  render();
};
A.closeBg = (d, el, e) => {
  if (e.target === el) {
    S.sheet = null;
    render();
  }
};
A.closeSheet = () => {
  S.sheet = null;
  render();
};
A.soon = () => toast('Эта часть появится на следующем шаге');
A.zoom = d => {
  const el = $('#map'),
    m = el && S.map.real && LM[el.dataset.mode];
  if (m) m.map[+d.f > 1 ? 'zoomIn' : 'zoomOut']();
  else if (MV.zoom) MV.zoom(+d.f);
};
A.locate = () => {
  const el = $('#map');
  if (!el) return;
  const p = el.dataset.mode === 'client' ? point(S.me.pointId) : kitchen(S.kid),
    m = S.map.real && LM[el.dataset.mode];
  if (m) m.map.flyTo(p.ll, Math.max(m.map.getZoom(), 15.5), { duration: 0.6 });
  else if (MV.center) MV.center(p.x, p.y, 0.95);
};
A.mapSel = d => {
  const me = $('#map') && $('#map').dataset.mode === 'client' && d.id === S.me.pointId;
  mapSelect(me || !d.id || S.map.sel === d.id ? null : d.id);
};
A.mapPick = d => mapSelect(d.id === 'me' ? null : d.id);
A.reset = () => location.reload();
