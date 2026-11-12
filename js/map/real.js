'use strict';
/* ================= НАСТОЯЩАЯ КАРТА: Leaflet + тайлы OpenStreetMap =================
   Пробуем по очереди несколько серверов тайлов. Если ни один недоступен
   (нет интернета или страница открыта там, где внешние картинки запрещены), показываем схему. */
const TILES = [
  {
    id: 'osm',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    att: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    max: 19,
    probe: 'fetch',
  },
  {
    id: 'hot',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    sub: 'abc',
    att: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>, стиль HOT, сервер OSM France',
    max: 19,
    probe: 'img',
  },
  {
    id: 'de',
    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    att: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    max: 18,
    probe: 'img',
  },
];
function probeTiles() {
  if (typeof L === 'undefined') return Promise.resolve(null);
  const n = 2 ** 14,
    lat = (42.875 * Math.PI) / 180,
    x = Math.floor(((74.603 + 180) / 360) * n),
    y = Math.floor(((1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2) * n);
  const u = t =>
    t.url
      .replace('{s}', (t.sub || 'a')[0])
      .replace('{z}', 14)
      .replace('{x}', x)
      .replace('{y}', y);
  const lim = p => Promise.race([p, new Promise(r => setTimeout(() => r(false), 4500))]);
  /* tile.openstreetmap.org при блокировке отдаёт картинку с ошибкой и кодом 403, поэтому проверяем код ответа */
  const one = t =>
    lim(
      t.probe === 'fetch'
        ? fetch(u(t), { mode: 'cors' })
            .then(r => r.ok && /image/.test(r.headers.get('content-type') || ''))
            .catch(() => false)
        : new Promise(r => {
            const i = new Image();
            i.onload = () => r(i.naturalWidth >= 128);
            i.onerror = () => r(false);
            i.src = u(t);
          })
    );
  const ps = TILES.map(one);
  return (async () => {
    for (let i = 0; i < TILES.length; i++) if (await ps[i]) return TILES[i];
    return null;
  })();
}
const LM = {};
const coarse = () => window.matchMedia && window.matchMedia('(hover:none)').matches;
function curveLL(a, b) {
  const kx = Math.cos((42.875 * Math.PI) / 180),
    ax = a.ll[1] * kx,
    ay = a.ll[0],
    bx = b.ll[1] * kx,
    by = b.ll[0],
    dx = bx - ax,
    dy = by - ay,
    cx = (ax + bx) / 2 - dy * 0.14,
    cy = (ay + by) / 2 + dx * 0.14,
    out = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18,
      u = 1 - t;
    out.push([u * u * ay + 2 * u * t * cy + t * t * by, (u * u * ax + 2 * u * t * cx + t * t * bx) / kx]);
  }
  return out;
}
function leafletMount(mode, holder) {
  let m = LM[mode];
  if (!m) {
    const el = document.createElement('div');
    el.className = 'lmap';
    holder.appendChild(el);
    const still = mode === 'kitchen' && coarse(); /* мини-карта в сводке не должна перехватывать прокрутку страницы */
    const map = L.map(el, {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.25,
      minZoom: 12,
      maxZoom: 18,
      dragging: !still,
      maxBounds: [
        [42.78, 74.45],
        [42.97, 74.76],
      ],
      maxBoundsViscosity: 0.8,
    });
    L.control.attribution({ prefix: false, position: 'bottomright' }).addTo(map);
    const pv = S.map.prov;
    L.tileLayer(pv.url, { subdomains: pv.sub || 'abc', attribution: pv.att, maxZoom: 19, maxNativeZoom: pv.max }).addTo(
      map
    );
    m = LM[mode] = { el, map, layer: L.layerGroup().addTo(map), marks: {}, fitKey: '' };
    map.on('click', () => {
      if (S.map.sel) mapSelect(null);
    });
  } else holder.appendChild(m.el);
  m.map.invalidateSize({ pan: false });
  const it = mapItems(mode),
    fk = mode + ':' + (mode === 'client' ? S.me.pointId : S.kid + it.fit.length) + ':' + holder.clientWidth;
  if (m.fitKey !== fk) {
    m.fitKey = fk;
    m.map.fitBounds(
      L.latLngBounds(it.fit.map(p => p.ll)),
      mode === 'client'
        ? { paddingTopLeft: [30, 120], paddingBottomRight: [40, 120], animate: false }
        : { paddingTopLeft: [52, 58], paddingBottomRight: [52, 40], animate: false }
    );
  }
  m.layer.clearLayers();
  m.marks = {};
  it.flows.forEach(f =>
    L.polyline(curveLL(f.a, f.b), {
      color: f.color,
      weight: Math.min(8, 3 + f.n * 0.8),
      opacity: 0.9,
      dashArray: '1 11',
      lineCap: 'round',
      className: 'lflow',
      interactive: false,
    }).addTo(m.layer)
  );
  it.pins.forEach(p => {
    const [w, h, ax, ay] = p.box,
      sel = S.map.sel === p.id;
    const mk = L.marker(p.o.ll, {
      icon: L.divIcon({
        className: 'lpin',
        iconSize: [w, h],
        iconAnchor: [ax, ay],
        html: `<svg width="${w}" height="${h}" viewBox="${-ax} ${-ay} ${w} ${h}"><g class="pin ${p.cls} ${sel ? 'sel' : ''}" data-id="${p.id}">${p.html}</g></svg>`,
      }),
      zIndexOffset: p.top ? 600 : sel ? 400 : 0,
      keyboard: false,
      title: p.o.name,
    }).addTo(m.layer);
    if (!p.still) mk.on('click', () => A.mapSel({ id: p.id }));
    m.marks[p.id] = mk;
  });
}
