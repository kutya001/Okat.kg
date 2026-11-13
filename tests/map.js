'use strict';
// Карта: настоящие тайлы, запасной провайдер, схема без сети; доска заказов на компьютере.
const { URL, SHOTS, launch, ui } = require('./lib/env.js');
const tile = require('./lib/tile.js')();
const assert = (c, m) => {
  if (!c) {
    console.log('FAIL: ' + m);
    process.exitCode = 1;
  } else console.log('ok: ' + m);
};
const out = SHOTS;
async function page(b, mode, vp) {
  const ctx = await b.newContext(
    vp || { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  );
  const p = await ctx.newPage();
  p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message));
  const ok = r =>
    r.fulfill({ status: 200, contentType: 'image/png', body: tile, headers: { 'access-control-allow-origin': '*' } });
  await ctx.route(/tile\.openstreetmap\.org/, r =>
    mode === 'osm'
      ? ok(r)
      : mode === 'hot'
        ? r.fulfill({
            status: 403,
            contentType: 'image/png',
            body: tile,
            headers: { 'access-control-allow-origin': '*' },
          })
        : r.abort()
  );
  await ctx.route(/openstreetmap\.fr/, r => (mode === 'hot' ? ok(r) : r.abort()));
  await ctx.route(/openstreetmap\.de/, r => r.abort());
  await p.goto(URL);
  await p.waitForTimeout(500);
  return p;
}
(async () => {
  const b = await launch();
  // A. настоящая карта (тайлы OSM подменены)
  let p = await page(b, 'osm');
  const c = s => p.locator(s).first().click(),
    ev = f => p.evaluate(f);
  await p.screenshot({ path: out + 'v01-welcome.png' });
  const U = ui(() => p);
  await c('[data-act=start][data-role=client]');
  await p.waitForTimeout(300);
  await p.screenshot({ path: out + 'v02-home.png', fullPage: true });
  assert((await ev(() => S.map.real === true && S.map.prov.id)) === 'osm', 'A: provider = osm');
  await c('[data-act=tab][data-tab=map]');
  await p.waitForTimeout(900);
  assert((await p.locator('.lmap .leaflet-marker-icon').count()) === 7, 'A: 6 kitchens + my point as markers');
  assert((await p.locator('.lmap img.leaflet-tile-loaded').count()) > 3, 'A: tiles rendered');
  assert((await p.locator('.lmap path.lflow').count()) === 5, 'A: 5 flow lines');
  assert((await p.locator('.map-note').count()) === 0, 'A: no fallback note');
  await p.screenshot({ path: out + 'v03-map-real.png' });
  const inView = async id =>
    ev(
      `(()=>{const r=document.querySelector('.lmap .pin[data-id=${id}]').getBoundingClientRect(),m=document.querySelector('#map').getBoundingClientRect();return r.left>m.left&&r.right<m.right&&r.top>m.top+100&&r.bottom<m.bottom-150})()`
    );
  for (const id of ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'p1'])
    assert(await inView(id), 'A: pin ' + id + ' inside the free map area');
  await p.locator('.lmap .pin[data-id=k3]').click();
  await p.waitForTimeout(700);
  assert(
    (await ev(() => S.map.sel)) === 'k3' && (await p.locator('.mcard.sel[data-id=k3]').count()) === 1,
    'A: pin tap selects card'
  );
  const cardCentered = await ev(() => {
    const c = document.querySelector('.mcard.sel'),
      r = c.getBoundingClientRect();
    return Math.abs(r.left + r.width / 2 - innerWidth / 2) < 12;
  });
  assert(cardCentered, 'A: selected card scrolled to centre');
  await p.screenshot({ path: out + 'v04-map-selected.png' });
  // листаем ленту -> выбирается другая кухня
  await ev(() => {
    const car = document.querySelector('.mcar'),
      c = car.querySelector('.mcard[data-id=k1]');
    car.scrollTo({ left: c.offsetLeft - (car.clientWidth - c.offsetWidth) / 2 });
  });
  await p.waitForTimeout(500);
  assert(
    (await ev(() => S.map.sel)) === 'k1' && (await p.locator('.lmap .pin.sel[data-id=k1]').count()) === 1,
    'A: swiping the cards selects the pin'
  );
  await c('.mcard[data-id=k1] [data-act=openK]');
  assert((await ev(() => S.cview && S.cview.id)) === 'k1', 'A: card button opens menu');
  await p.screenshot({ path: out + 'v05-kitchen.png' });
  await c('[data-act=back]');
  await p.waitForTimeout(500);
  assert((await p.locator('.lmap .leaflet-marker-icon').count()) === 7, 'A: map survives navigation');
  await c('.map-top [data-act=type][data-t=cafe]');
  await p.waitForTimeout(300);
  assert((await p.locator('.lmap .leaflet-marker-icon').count()) === 2, 'A: type filter updates markers');
  await U.role('kitchen');
  await p.waitForTimeout(700);
  await p.screenshot({ path: out + 'v06-k-dash.png', fullPage: true });
  assert(
    (await p.locator('.kmap .lmap .leaflet-marker-icon').count()) === 5,
    'A: kitchen mini-map: 4 points + kitchen'
  );
  await c('.pt');
  await p.waitForTimeout(300);
  assert((await p.locator('.kmap .pin.sel').count()) === 1, 'A: list row selects point pin');
  await c('.k-tabbar [data-tab=orders]');
  await p.screenshot({ path: out + 'v07-k-orders.png' });
  assert(await p.locator('.bulkbar .btn').isVisible(), 'A: bulk bar visible on phone');
  await c('[data-act=kview][data-v=table]');
  await p.waitForTimeout(350);
  await p.screenshot({ path: out + 'v07b-k-orders-table.png' });
  await c('[data-act=kview][data-v=board]');
  await c('.k-tabbar [data-tab=menu]');
  await p.waitForTimeout(350);
  await p.screenshot({ path: out + 'v08-k-menu-list.png', fullPage: true });
  await c('.mdoc[data-d="0"]');
  await p.waitForTimeout(350);
  await p.screenshot({ path: out + 'v08b-k-menu-doc.png', fullPage: true });
  await c('.dcard.kc[data-id=k1d4]');
  await p.waitForTimeout(300);
  await p.screenshot({ path: out + 'v09-k-menu-sheet.png' });
  await c('.sheet [data-act=mlim][data-d="5"]');
  assert((await ev(() => MENU.k1.today.items.find(i => i.dishId === 'k1d4').limit)) === 30, 'A: sheet stepper works');
  await c('.sheet .btn[data-act=closeSheet]');
  await c('[data-act=mBack]');
  await c('.mseg [data-tab=dishes]');
  assert((await ev(() => S.ktab)) === 'dishes', 'A: dishes via segmented control');
  await U.go('profile');
  assert((await ev(() => S.ktab)) === 'profile', 'A: profile via header button');
  console.log(p.errs.length ? 'ERRORS A: ' + p.errs.join(' | ') : 'A: no JS errors');
  // B. OSM отвечает 403 -> запасной сервер
  p = await page(b, 'hot');
  await p.waitForTimeout(400);
  assert(
    (await p.evaluate(() => S.map.real === true && S.map.prov.id)) === 'hot',
    'B: falls back to second tile server when OSM returns 403'
  );
  // C. тайлы недоступны -> схема
  p = await page(b, 'none');
  await p.locator('[data-act=start][data-role=client]').click();
  await p.locator('.tabbar [data-tab=map]').click();
  await p.waitForTimeout(500);
  assert(
    (await p.evaluate(() => S.map.real)) === false &&
      (await p.locator('#map svg #world').count()) === 1 &&
      (await p.locator('.map-note').count()) === 1,
    'C: schematic fallback with note'
  );
  await p.screenshot({ path: out + 'v10-map-scheme.png' });
  await p.locator('#map .pin[data-id=k2]').click();
  await p.waitForTimeout(500);
  assert((await p.locator('.mcard.sel[data-id=k2]').count()) === 1, 'C: scheme pin selects card');
  console.log(p.errs.length ? 'ERRORS C: ' + p.errs.join(' | ') : 'C: no JS errors');
  // D. десктоп с настоящей картой
  p = await page(b, 'osm', { viewport: { width: 1440, height: 900 } });
  await p.locator('[data-act=start][data-role=kitchen]').click();
  await p.waitForTimeout(800);
  await p.screenshot({ path: out + 'v11-desktop-dash.png' });
  assert((await p.locator('.kmap .lmap .leaflet-marker-icon').count()) === 5, 'D: desktop mini-map ok');
  await p.locator('.k-side [data-tab=orders]').click();
  await p.waitForTimeout(300);
  const rid = await p.evaluate(() => kStats('k1').req[0].id);
  await p.locator(`.tkt[data-id=${rid}]`).dragTo(p.locator('.col[data-st=cooking]'));
  await p.waitForTimeout(300);
  assert(
    (await p.evaluate(id => order(id).status, rid)) === 'cooking',
    'D: drag and drop moves a card to another column'
  );
  await p.screenshot({ path: out + 'v12-desktop-board.png' });
  await p.locator('[data-act=kview][data-v=table]').click();
  await p.waitForTimeout(300);
  await p.screenshot({ path: out + 'v13-desktop-table.png' });
  await p.locator('.k-side [data-tab=menu]').click();
  await p.waitForTimeout(300);
  await p.screenshot({ path: out + 'v14-desktop-menu-list.png' });
  await p.locator('.mdoc[data-d="0"]').click();
  await p.waitForTimeout(300);
  await p.screenshot({ path: out + 'v15-desktop-menu-doc.png', fullPage: true });
  console.log(p.errs.length ? 'ERRORS D: ' + p.errs.join(' | ') : 'D: no JS errors');
  await b.close();
})().catch(e => {
  console.error('TEST CRASHED', e.message);
  process.exit(1);
});
