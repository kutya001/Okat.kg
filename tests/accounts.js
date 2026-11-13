'use strict';
// Лента блюд, статистика клиента, учёт клиентов кухни, минимальная сумма в меню дня, сворачивание панели.
const { URL, launch, ui } = require('./lib/env.js');
const assert = (c, m) => {
  if (!c) {
    console.log('FAIL: ' + m);
    process.exitCode = 1;
  } else console.log('ok: ' + m);
};
(async () => {
  const b = await launch();
  const errs = [];
  const open = async vp => {
    const ctx = await b.newContext(vp);
    await ctx.route(/openstreetmap/, r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL);
    await p.waitForTimeout(300);
    return p;
  };
  let p = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const c = s => p.locator(s).first().click(),
    ev = (f, a) => p.evaluate(f, a);

  // ---------- лента блюд
  const U = ui(() => p);
  await c('[data-act=start][data-role=client]');
  await c('.tabbar [data-tab=dishes]');
  const plov = p.locator('.ogroup', { has: p.locator('h3', { hasText: /^Плов$/ }) });
  const offers = await plov.locator('.offer').count();
  assert(offers >= 3, 'plov is offered by several kitchens: ' + offers + ' offers');
  assert(new Set(await plov.locator('.of-t b').allInnerTexts()).size >= 2, 'offers come from different kitchens');
  const prices = async () => (await plov.locator('.addbtn span').allInnerTexts()).map(t => +t.replace(/\D/g, ''));
  let pr = await prices();
  assert(
    pr.every((x, i) => !i || pr[i - 1] <= x),
    'offers sorted by price: ' + pr.join(', ')
  );
  assert((await plov.locator('header span').innerText()).includes('от ' + pr[0]), 'group shows the lowest price');
  assert((await plov.locator('.rate').count()) === offers, 'every offer shows a rating');
  await p.locator('[data-chg=dsort]').selectOption('rating');
  const rt = (await plov.locator('.rate').allInnerTexts()).map(t => +t.replace(',', '.'));
  assert(
    rt.every((x, i) => !i || rt[i - 1] >= x),
    'sorted by rating: ' + rt.join(', ')
  );
  await plov.locator('[data-act=add]').first().click();
  assert(
    (await ev(() => Object.keys(S.carts).length)) === 1 && (await p.locator('.cartbar.home').count()) === 1,
    'ordered from the dish feed'
  );
  await c('[data-act=qOpen]');
  await p.locator('.tb-q input').fill('лагман');
  const first = await p.locator('.ogroup h3').first().innerText();
  assert(
    first === 'Лагман' && (await p.locator('.tb-q input').evaluate(el => el === document.activeElement)),
    'search finds the dish and keeps focus'
  );
  await c('[data-act=qClose]');
  await c('.tabbar [data-tab=dishes]');
  await c('[data-act=dcat][data-c=drink]');
  assert((await p.locator('.cat-h').allInnerTexts()).join() === 'Напитки', 'category filter');

  // ---------- статистика клиента
  await c('.tabbar [data-tab=orders]');
  await c('[data-act=otab][data-t=stats]');
  const mine = await ev(() => {
    const os = ORDERS.filter(o => o.clientId === 'me' && isReal(o) && o.day > -30);
    return { n: os.length, sum: sumBy(os, o => o.total), kitchens: new Set(os.map(o => o.kid)).size };
  });
  const tiles = await p.locator('.nutr.s3 b').allInnerTexts();
  assert(
    +tiles[0] === mine.n && +tiles[1].replace(/\D/g, '') === mine.sum,
    `stats match orders: ${mine.n} orders, ${mine.sum} som`
  );
  assert(mine.n >= 8, 'demo history is long enough to be useful');
  assert((await p.locator('.bars .bar').count()) === 30, 'calories chart: a bar per day');
  assert((await p.locator('.legend b').count()) === 3, 'protein, fat and carbs shown');
  assert((await p.locator('.rows.flat').first().locator('.row').count()) === mine.kitchens, 'kitchens list');
  await c('[data-act=cstat][data-p="7"]');
  assert((await p.locator('.bars .bar').count()) === 7, '7-day period');

  // ---------- минимальная сумма в меню дня
  await U.role('kitchen');
  await ev(() => {
    S.kid = 'k1';
    S.ktab = 'menu';
    S.mdoc = 0;
    render();
  });
  await p.locator('[data-chg=mmin]').fill('900');
  await p.locator('[data-chg=mmin]').blur();
  assert(
    (await ev(() => MENU.k1.today.min)) === 900 && (await ev(() => kitchen('k1').def.min)) === 200,
    'today has its own minimum, the default is untouched'
  );
  await U.role('client');
  await ev(() => {
    S.carts = { k1: { k1d1: 1 } };
    S.lastCart = 'k1';
    S.ctab = 'home';
    S.cview = null;
    render();
  });
  assert((await p.locator('.cartbar.home').innerText()).includes('Ещё 550'), 'client must reach the day minimum');
  await ev(() => {
    A.role({ role: 'kitchen' });
    S.ktab = 'menu';
    S.mdoc = null;
    render();
  });
  await c('[data-act=mCopy][data-d="0"]');
  assert((await ev(() => MENU.k1[1].min)) === 900, 'copied menu keeps its minimum');
  await ev(() => {
    A.mNew({ d: 2 });
  });
  assert((await ev(() => MENU.k1[2].min)) === 200, 'new menu starts from the default minimum');

  // ---------- учёт клиентов кухни
  await ev(() => {
    S.ktab = 'clients';
    S.mdoc = null;
    render();
  });
  const book = await ev(() => {
    const cb = clientBook('k1', 30);
    return {
      n: cb.length,
      sum: sumBy(cb, c => c.sum),
      rev: repData('k1', '30').rev,
      me: !!cb.find(c => c.id === 'me'),
    };
  });
  assert(book.n > 50 && book.me, `client book: ${book.n} clients, current user among them`);
  assert(book.sum === book.rev, 'clients total equals 30-day revenue: ' + book.sum);
  assert((await p.locator('.kpis.k4 .kpi b').first().innerText()) === String(book.n), 'KPI shows client count');
  await p.locator('.kcl-bar .dq input').fill('азамат');
  assert((await p.locator('.ctbl tbody tr').count()) === 1, 'search by name');
  await c('.ctbl tbody tr');
  const hist = await p.locator('.sheet .rows.hist .row').count(),
    myOrders = await ev(() => clientBook('k1', 30).find(c => c.id === 'me').n);
  assert(hist === myOrders && hist > 0, `client sheet lists every order: ${hist}`);
  await c('[data-act=closeSheet]');
  await p.context().close();

  // ---------- левая панель: сворачивается и запоминается
  p = await open({ viewport: { width: 1366, height: 860 } });
  await c('[data-act=start][data-role=kitchen]');
  const sideW = () => ev(() => Math.round(document.querySelector('.k-side').getBoundingClientRect().width));
  assert((await sideW()) === 220, 'side panel is open by default');
  await c('[data-act=kside]');
  await p.waitForTimeout(400);
  assert(
    (await sideW()) === 68 && (await ev(() => document.body.dataset.ks)) === 'mini',
    'side panel collapsed to icons'
  );
  await c('.k-side [data-tab=clients]');
  assert((await ev(() => S.ktab)) === 'clients', 'collapsed panel still navigates');
  await p.reload();
  await p.waitForTimeout(300);
  await c('[data-act=start][data-role=kitchen]');
  assert((await sideW()) === 68, 'collapsed state survives a reload');
  await c('[data-act=kside]');
  await p.waitForTimeout(400);
  assert((await sideW()) === 220, 'side panel expands back');

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO JS ERRORS');
  await b.close();
})().catch(e => {
  console.error('TEST FAILED', e.message);
  process.exit(1);
});
