'use strict';
// Кнопка «Назад» браузера: возврат по экранам, закрытие шторки, порядок в истории.
const { URL, launch } = require('./lib/env.js');
const assert = (c, m) => {
  if (!c) {
    console.log('FAIL: ' + m);
    process.exitCode = 1;
  } else console.log('ok: ' + m);
};
(async () => {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route(/openstreetmap/, r => r.abort());
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL);
  await p.waitForTimeout(300);
  const c = s => p.locator(s).first().click(),
    ev = f => p.evaluate(f),
    back = async () => {
      await ev(() => history.back());
      await p.waitForTimeout(200);
    },
    view = () =>
      ev(
        () =>
          (!S.started
            ? 'welcome'
            : S.role === 'client'
              ? S.cview
                ? S.cview.kind
                : S.ctab
              : 'k:' + S.ktab + (S.mdoc != null ? ':doc' : '')) + (S.sheet ? '+sheet' : '')
      );

  await c('[data-act=start][data-role=client]');
  await c('.rc-h[data-id=k1]');
  await c('[data-act=add][data-id=k1d1]');
  await c('[data-act=checkout]');
  assert((await view()) === 'checkout', 'opened cart');
  await back();
  assert((await view()) === 'kitchen', 'Back: cart -> kitchen menu');
  await back();
  assert((await view()) === 'home', 'Back: kitchen menu -> home');
  await back();
  assert((await view()) === 'welcome', 'Back: home -> welcome');
  await ev(() => history.forward());
  await p.waitForTimeout(200);
  assert((await view()) === 'home', 'Forward: welcome -> home');

  // кнопка «назад» в интерфейсе не плодит записи
  await c('.rc-h[data-id=k1]');
  const len = await ev(() => history.length);
  await c('[data-act=back]');
  await p.waitForTimeout(200);
  assert((await view()) === 'home', 'in-app back -> home');
  await c('.rc-h[data-id=k1]');
  await p.waitForTimeout(100);
  assert((await ev(() => history.length)) === len, 'in-app back keeps history tidy');

  // шторка: «Назад» закрывает её и остаётся на экране
  await c('[data-act=back]');
  await p.waitForTimeout(200);
  await c('[data-act=sheet][data-sheet=points]');
  assert((await view()) === 'home+sheet', 'points sheet opened');
  await back();
  assert((await view()) === 'home', 'Back closes the sheet');
  assert((await p.locator('.sheet').count()) === 0, 'sheet removed from the page');

  // после отправки заявки «Назад» не возвращает в пустую корзину
  await c('.rc-h[data-id=k1]');
  await c('[data-act=checkout]');
  await c('[data-act=submit]');
  assert((await view()) === 'orders', 'request sent -> orders');
  await back();
  assert((await view()) === 'kitchen', 'Back after submit -> kitchen menu, not an empty cart');

  // кабинет кухни: документ меню
  await c('[data-act=role][data-role=kitchen]');
  await c('.k-tabbar [data-tab=menu]');
  await c('.mdoc[data-d="0"]');
  assert((await view()) === 'k:menu:doc', 'menu document opened');
  await c('.dcard.kc');
  assert((await view()) === 'k:menu:doc+sheet', 'dish sheet opened');
  await back();
  assert((await view()) === 'k:menu:doc', 'Back closes dish sheet');
  await back();
  assert((await view()) === 'k:menu', 'Back: document -> menu list');

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO JS ERRORS');
  await b.close();
})().catch(e => {
  console.error('TEST FAILED', e.message);
  process.exit(1);
});
