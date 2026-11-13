'use strict';
// Проходит по всем экранам на телефоне и компьютере: ошибки в консоли, горизонтальная прокрутка, снимки экранов.
const { URL, SHOTS, launch, receiptFile } = require('./lib/env.js');
const tile = require('./lib/tile.js')();
const path = URL,
  out = SHOTS;
(async () => {
  const b = await launch();
  const errs = [];
  const mk = async o => {
    const ctx = await b.newContext(o);
    await ctx.route(/tile\.openstreetmap\.org/, r =>
      r.fulfill({ status: 200, contentType: 'image/png', body: tile, headers: { 'access-control-allow-origin': '*' } })
    );
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
    p.on('console', m => {
      if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text());
    });
    await p.goto(path);
    await p.waitForTimeout(400);
    return p;
  };
  for (const [name, vp] of [
    ['m360', { viewport: { width: 360, height: 700 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
    ['m390', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
    ['d1366', { viewport: { width: 1366, height: 860 } }],
  ]) {
    const p = await mk(vp),
      c = s => p.locator(s).first().click(),
      desk = name[0] === 'd';
    const ov = async n => {
      const d = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (d > 0) console.log(name, n, 'OVERFLOW-X', d);
    };
    const shot = async n => {
      await p.waitForTimeout(450);
      await p.screenshot({ path: out + name + '-' + n + '.png' });
    };
    await ov('welcome');
    await c('[data-act=start][data-role=client]');
    await ov('home');
    await shot('home');
    // заказ прямо из карточки заведения: лента блюд, шторка блюда, корзина на главной
    await c('.rcard[data-key=rc-k1] [data-act=add][data-id=k1d1]');
    await c('.rcard[data-key=rc-k1] [data-act=cdish][data-id=k1d4]');
    await ov('dish-sheet');
    await shot('dish-sheet');
    await c('.sheet [data-act=add]');
    await c('[data-act=closeSheet]');
    await ov('home-cart');
    await shot('home-cart');
    await c('.rc-h[data-id=k1]');
    await ov('kitchen');
    await c('[data-act=add][data-id=k1d12]');
    await shot('kitchen');
    await c('[data-act=checkout]');
    await c('[data-act=pay][data-p=mbank]');
    await ov('checkout-pay');
    await shot('checkout-pay');
    await p.locator('[data-chg=coReceipt]').first().setInputFiles(receiptFile());
    await p.waitForSelector('.pb-r');
    await ov('checkout');
    await shot('checkout');
    await c('[data-act=submit]');
    await ov('orders');
    await shot('orders');
    await c('.tabbar [data-tab=map]');
    await ov('map');
    await shot('map');
    await c('.tabbar [data-tab=profile]');
    await ov('profile');
    await c('[data-act=role][data-role=kitchen]');
    await ov('k-dash');
    await shot('k-dash');
    const nav = t =>
      desk
        ? c(`.k-side [data-tab=${t}]`)
        : t === 'dishes'
          ? c('.mseg [data-tab=dishes]')
          : t === 'profile'
            ? c('.k-top [data-tab=profile]')
            : c(`.k-tabbar [data-tab=${t}]`);
    for (const t of ['orders', 'menu', 'dishes', 'reports', 'profile']) {
      await nav(t);
      await ov('k-' + t);
      await shot('k-' + t);
    }
    await nav('orders');
    await c('.btn[data-act=rcpt]');
    await ov('k-receipt');
    await shot('k-receipt');
    await c('[data-act=closeSheet]');
    await p.waitForTimeout(250);
    await nav('menu');
    await nav('dishes');
    await c('[data-act=dishEdit]');
    await ov('k-dish-form');
    await shot('k-dish-form');
    await c('[data-act=closeSheet]');
    await p.waitForTimeout(250);
    await nav('orders');
    await c('[data-act=kview][data-v=table]');
    await ov('k-table');
    await nav('menu');
    await c('.mdoc[data-d="0"]');
    await ov('k-menudoc');
    await c('.dcard.kc');
    await ov('k-menusheet');
    await p.context().close();
  }
  console.log(errs.length ? errs.join('\n') : 'NO ERRORS');
  await b.close();
})().catch(e => {
  console.error('TEST FAILED', e.message);
  process.exit(1);
});
