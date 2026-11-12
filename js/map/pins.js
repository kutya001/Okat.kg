'use strict';
/* ================= МЕТКИ (общие для настоящей карты и схемы) ================= */
const shortName = n => {
  const m = n.match(/«(.+)»/);
  return m ? m[1] : n.replace(/^Кухня /, '');
};
const GT = 'font-family="Golos Text,sans-serif"';
function kPinIn(k, n) {
  return `<g class="pin-b"><ellipse cx="0" cy="1" rx="7" ry="2.5" fill="rgba(17,25,56,.2)"/><path d="M0 0C-5-9-16-15-16-28a16 16 0 1 1 32 0C16-15 5-9 0 0z" fill="${k.color}" stroke="#fff" stroke-width="2"/><circle cx="0" cy="-28" r="11" fill="#fff"/><text x="0" y="-27.5" text-anchor="middle" dominant-baseline="central" font-size="13">${TYPES[k.type].icon}</text>${n ? `<g transform="translate(14 -42)"><circle r="10.5" fill="#111938" stroke="#fff" stroke-width="2"/><text text-anchor="middle" dominant-baseline="central" font-size="11.5" font-weight="700" fill="#fff" ${GT}>${n}</text></g>` : ''}</g><text class="pin-t" y="15" text-anchor="middle">${esc(shortName(k.name))}</text>`;
}
function mePinIn(p, n) {
  const t = n ? n + ' ' + pl(n, P_ORD) : 'вы здесь',
    w = t.length * 6.5 + 18;
  return `<circle class="pulse" r="22"/><g class="pin-b"><circle r="10" fill="#2443B4" stroke="#fff" stroke-width="3.5"/><g transform="translate(0 -27)"><rect x="${(-w / 2).toFixed(1)}" y="-11" width="${w.toFixed(1)}" height="22" rx="11" fill="#111938"/><text text-anchor="middle" dominant-baseline="central" font-size="11.5" font-weight="600" fill="#fff" ${GT}>${t}</text></g></g><text class="pin-t" y="24" text-anchor="middle">${esc(shortName(p.name))}</text>`;
}
const homePinIn = k =>
  `<g class="pin-b"><circle r="17" fill="#fff" stroke="${k.color}" stroke-width="3.5"/><text text-anchor="middle" dominant-baseline="central" font-size="16">${k.em}</text></g>`;
const pPinIn = (p, n) =>
  `<g class="pin-b"><circle r="14" fill="#111938" stroke="#fff" stroke-width="3"/><text text-anchor="middle" dominant-baseline="central" font-size="12.5" font-weight="700" fill="#fff" ${GT}>${n}</text></g><text class="pin-t" y="27" text-anchor="middle">${esc(shortName(p.name))}</text>`;
/* что рисуем на карте в каждом режиме */
function mapItems(mode) {
  if (mode === 'client') {
    const me = point(S.me.pointId),
      st = pointStats(me.id),
      ks = KITCHENS.filter(k => S.typeFilter === 'all' || k.type === S.typeFilter);
    return {
      flows: ks.filter(k => st.by[k.id]).map(k => ({ a: me, b: k, n: st.by[k.id], color: k.color })),
      pins: [
        ...ks.map(k => ({
          o: k,
          id: k.id,
          html: kPinIn(k, st.by[k.id] || 0),
          cls: MENU[k.id].today.published ? '' : 'dim',
          box: [120, 84, 60, 62],
        })),
        { o: me, id: me.id, html: mePinIn(me, st.total), cls: 'me', box: [150, 74, 75, 40], top: true },
      ],
      fit: [me, ...KITCHENS],
    };
  }
  const k = kitchen(S.kid),
    bp = byPoint(S.kid);
  return {
    flows: bp.map(x => ({ a: k, b: x.p, n: x.orders, color: k.color })),
    pins: [
      ...bp.map(x => ({ o: x.p, id: x.p.id, html: pPinIn(x.p, x.orders), cls: '', box: [120, 56, 60, 18] })),
      { o: k, id: k.id, html: homePinIn(k), cls: 'home', box: [60, 44, 30, 22], top: true, still: true },
    ],
    fit: [k, ...bp.map(x => x.p)],
  };
}
