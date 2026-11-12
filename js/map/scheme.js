'use strict';
/* ================= СХЕМА (запасной вариант без интернета) ================= */
const MAPW = 860,
  MAPH = 1000;
const HS = [
  ['ул. Жибек Жолу', 100, 12, 480],
  ['ул. Фрунзе', 230, 12, 195],
  ['пр. Чуй', 360, 18, 690],
  ['ул. Киевская', 490, 12, 195],
  ['ул. Токтогула', 620, 12, 530],
  ['ул. Московская', 750, 12, 230],
  ['ул. Боконбаева', 880, 12, 640],
];
const VS = [
  ['пр. Манаса', 110, 18, 820],
  ['ул. Исанова', 280, 12, 430],
  ['ул. Раззакова', 450, 12, 690],
  ['бул. Эркиндик', 600, 22, 555],
  ['ул. Абдрахманова', 750, 12, 640],
];
const HM = [35, 165, 295, 425, 555, 685, 815, 945],
  VM = [30, 195, 365, 525, 675, 820];
const PARKS = [
  [462, 242, 128, 106, 'парк Панфилова'],
  [612, 242, 126, 106, 'Дубовый парк'],
  [122, 762, 146, 106, 'сквер'],
];
const PLAZA = [470, 372, 118, 52, 'пл. Ала-Тоо'];
let MAP_BASE = '';
function buildMapBase() {
  const r = rng(7),
    o = [],
    X0 = -700,
    X1 = MAPW + 700,
    Y0 = -700,
    Y1 = MAPH + 700;
  o.push(`<rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" fill="#E9EDF3"/>`);
  const xs = [...VS.map(v => v[1]), ...VM, -45, MAPW + 45].sort((a, b) => a - b),
    ys = [...HS.map(h => h[1]), ...HM, -45, MAPH + 45].sort((a, b) => a - b);
  const inPark = (x, y) =>
    [...PARKS, PLAZA].some(p => x > p[0] - 8 && x < p[0] + p[2] + 8 && y > p[1] - 8 && y < p[1] + p[3] + 8);
  let b = '';
  for (let i = 0; i < xs.length - 1; i++)
    for (let j = 0; j < ys.length - 1; j++) {
      const x0 = xs[i] + 12,
        x1 = xs[i + 1] - 12,
        y0 = ys[j] + 12,
        y1 = ys[j + 1] - 12;
      if (x1 - x0 < 16 || y1 - y0 < 16 || inPark((x0 + x1) / 2, (y0 + y1) / 2)) continue;
      const cols = x1 - x0 > 50 && r() > 0.35 ? 2 : 1,
        rows = y1 - y0 > 40 && r() > 0.45 ? 2 : 1,
        cw = (x1 - x0 - (cols - 1) * 6) / cols,
        ch = (y1 - y0 - (rows - 1) * 6) / rows;
      for (let c = 0; c < cols; c++)
        for (let q = 0; q < rows; q++) {
          if (r() < 0.13) continue;
          const w = r() < 0.3 ? cw * (0.55 + r() * 0.3) : cw,
            h = r() < 0.3 ? ch * (0.55 + r() * 0.3) : ch;
          b += `<rect x="${(x0 + c * (cw + 6)).toFixed(1)}" y="${(y0 + q * (ch + 6)).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2.5"/>`;
        }
    }
  o.push(`<g fill="#DAE0EA">${b}</g>`);
  o.push(
    `<g stroke="#F8F9FC" stroke-width="7">${HM.map(y => `<path d="M${X0} ${y}H${X1}"/>`).join('')}${VM.map(x => `<path d="M${x} ${Y0}V${Y1}"/>`).join('')}</g>`
  );
  o.push(
    PARKS.map(p => `<rect x="${p[0]}" y="${p[1]}" width="${p[2]}" height="${p[3]}" rx="10" fill="#CDE7CF"/>`).join('')
  );
  o.push(`<rect x="${PLAZA[0]}" y="${PLAZA[1]}" width="${PLAZA[2]}" height="${PLAZA[3]}" rx="6" fill="#FBEFC8"/>`);
  const ds = [...HS.map(h => [`M${X0} ${h[1]}H${X1}`, h[2]]), ...VS.map(v => [`M${v[1]} ${Y0}V${Y1}`, v[2]])];
  let blv = '';
  for (let i = 2; i < HS.length - 1; i++) blv += `M600 ${HS[i][1] + 14}V${HS[i + 1][1] - 14}`;
  o.push(
    `<g fill="none">${ds.map(d => `<path d="${d[0]}" stroke="#CDD4E0" stroke-width="${d[1] + 3}"/>`).join('')}${ds.map(d => `<path d="${d[0]}" stroke="#fff" stroke-width="${d[1]}"/>`).join('')}<path d="${blv}" stroke="#CDE7CF" stroke-width="8" stroke-linecap="round"/></g>`
  );
  const lab = (t, x, y, rot, cls) =>
    `<g class="lbl ${cls || ''}" data-x="${x}" data-y="${y}" data-r="${rot}"><text text-anchor="middle" dominant-baseline="central">${t}</text></g>`;
  o.push(HS.map(h => lab(h[0], h[3], h[1], 0)).join('') + VS.map(v => lab(v[0], v[1], v[3], -90, 'minor')).join(''));
  o.push(
    PARKS.map(p => lab(p[4], p[0] + p[2] / 2, p[1] + p[3] / 2, 0, 'park minor')).join('') +
      lab(PLAZA[4], PLAZA[0] + PLAZA[2] / 2, PLAZA[1] + PLAZA[3] / 2, 0, 'minor')
  );
  return o.join('');
}
function mapSVG(mode) {
  const it = mapItems(mode);
  const flows = it.flows
    .map(f => {
      const a = f.a,
        b = f.b,
        dx = b.x - a.x,
        dy = b.y - a.y;
      return `<path class="flow" d="M${a.x} ${a.y}Q${((a.x + b.x) / 2 - dy * 0.14).toFixed(1)} ${((a.y + b.y) / 2 + dx * 0.14).toFixed(1)} ${b.x} ${b.y}" stroke="${f.color}" stroke-width="${Math.min(9, 3 + f.n * 0.8).toFixed(1)}"/>`;
    })
    .join('');
  const pins = it.pins
    .map(
      p =>
        `<g class="pin ${p.cls} ${S.map.sel === p.id ? 'sel' : ''}" data-x="${p.o.x}" data-y="${p.o.y}" data-id="${p.id}" ${p.still ? '' : 'data-act="mapSel" role="button"'} aria-label="${esc(p.o.name)}">${p.html}</g>`
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Схема: заведения и точки доставки"><g id="world">${MAP_BASE}${flows}${pins}</g></svg>`;
}
const MV = { dragged: false };
function fitView(mode, W, H) {
  const zmin = Math.min(W / MAPW, H / MAPH) * 0.9,
    pts = mapItems(mode).fit;
  const padT = mode === 'client' ? (S.map.real === false ? 150 : 112) : 44,
    padB = mode === 'client' ? 124 : 36,
    padL = 48,
    padR = 52,
    xs = pts.map(p => p.x),
    ys = pts.map(p => p.y);
  const x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    y0 = Math.min(...ys),
    y1 = Math.max(...ys);
  const z = Math.max(
    zmin,
    Math.min(1.25, (W - padL - padR) / Math.max(1, x1 - x0), (H - padT - padB) / Math.max(1, y1 - y0))
  );
  return {
    W,
    H,
    zmin,
    z,
    tx: padL + (W - padL - padR) / 2 - ((x0 + x1) / 2) * z,
    ty: padT + (H - padT - padB) / 2 - ((y0 + y1) / 2) * z,
  };
}
function schemeMount(el) {
  const mode = el.dataset.mode,
    world = $('#world', el),
    bb = el.getBoundingClientRect(),
    W = bb.width,
    H = bb.height;
  if (!W || !H || !world) return;
  let v = S.map[mode];
  if (!v || Math.abs(v.W - W) > 1 || Math.abs(v.H - H) > 1) v = S.map[mode] = fitView(mode, W, H);
  const marks = $$('.pin,.lbl', el);
  const apply = () => {
    world.setAttribute('transform', `translate(${v.tx.toFixed(1)} ${v.ty.toFixed(1)}) scale(${v.z.toFixed(4)})`);
    const iz = (1 / v.z).toFixed(4);
    el.classList.toggle('far', v.z < 0.72);
    for (const g of marks)
      g.setAttribute(
        'transform',
        `translate(${g.dataset.x} ${g.dataset.y}) scale(${iz})` +
          (g.dataset.r && g.dataset.r !== '0' ? ` rotate(${g.dataset.r})` : '')
      );
  };
  const clamp = () => {
    v.z = Math.max(v.zmin, Math.min(2.6, v.z));
    const cx = Math.max(0, Math.min(MAPW, (W / 2 - v.tx) / v.z)),
      cy = Math.max(0, Math.min(MAPH, (H / 2 - v.ty) / v.z));
    v.tx = W / 2 - cx * v.z;
    v.ty = H / 2 - cy * v.z;
  };
  const zoomAt = (px, py, f) => {
    const wx = (px - v.tx) / v.z,
      wy = (py - v.ty) / v.z;
    v.z = Math.max(v.zmin, Math.min(2.6, v.z * f));
    v.tx = px - wx * v.z;
    v.ty = py - wy * v.z;
    clamp();
    apply();
  };
  MV.zoom = f => zoomAt(W / 2, H / 2, f);
  MV.center = (x, y, z) => {
    if (z) v.z = Math.max(v.z, z);
    v.tx = W / 2 - x * v.z;
    v.ty = H * (mode === 'client' ? 0.42 : 0.5) - y * v.z;
    clamp();
    apply();
  };
  apply();
  if (mode === 'kitchen' && coarse()) {
    el.style.touchAction = 'pan-y';
    return;
  }
  const pts = new Map();
  let moved = 0,
    pd = 0;
  el.onpointerdown = e => {
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) {
      moved = 0;
      MV.dragged = false;
    }
    pd = 0;
  };
  el.onpointermove = e => {
    const p = pts.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p[0],
      dy = e.clientY - p[1];
    if (pts.size === 1) {
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 7) {
        MV.dragged = true;
        v.tx += dx;
        v.ty += dy;
        clamp();
        apply();
        pts.set(e.pointerId, [e.clientX, e.clientY]);
      }
    } else {
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      const [a, c] = [...pts.values()],
        d = Math.hypot(a[0] - c[0], a[1] - c[1]),
        r = el.getBoundingClientRect();
      if (pd) {
        MV.dragged = true;
        zoomAt((a[0] + c[0]) / 2 - r.left, (a[1] + c[1]) / 2 - r.top, d / pd);
      }
      pd = d;
    }
  };
  const up = e => {
    pts.delete(e.pointerId);
    pd = 0;
  };
  el.onpointerup = up;
  el.onpointercancel = up;
  el.onpointerleave = up;
  el.onwheel = e => {
    e.preventDefault();
    const r = el.getBoundingClientRect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.15 : 1 / 1.15);
  };
}
