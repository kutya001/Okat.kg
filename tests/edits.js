'use strict';
// Панели и меню-гамбургер, поиск, правка заявки, уточнение к заказу, чек из карточки заказа.
const { URL, SHOTS, launch, receiptFile, ui } = require('./lib/env.js');
const assert = (c, m) => {
  if (!c) {
    console.log('FAIL: ' + m);
    process.exitCode = 1;
  } else console.log('ok: ' + m);
};
(async () => {
  const b = await launch();
  const ctx = await b.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await ctx.route(/openstreetmap/, r => r.abort());
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL);
  await p.waitForTimeout(300);
  const c = s => p.locator(s).first().click(),
    ev = (f, a) => p.evaluate(f, a),
    shot = n => p.screenshot({ path: SHOTS + 'e-' + n + '.png' }),
    my = () => ev(() => ORDERS.find(o => o.clientId === 'me' && o.day === 0)),
    U = ui(() => p);

  await c('[data-act=start][data-role=client]');

  // ---------- панели и меню
  assert((await p.locator('.demo').count()) === 0, 'demo bar is gone from the screen');
  assert(
    (await p.locator('.topbar.glass').count()) === 1 && (await p.locator('.tabbar.glass').count()) === 1,
    'floating top and bottom panels'
  );
  const dock = await ev(() => {
    const r = document.querySelector('.tabbar').getBoundingClientRect(),
      cs = getComputedStyle(document.querySelector('.tabbar'));
    return {
      gap: innerHeight - r.bottom,
      left: r.left,
      radius: parseFloat(cs.borderRadius),
      blur: cs.backdropFilter || cs.webkitBackdropFilter,
    };
  });
  assert(
    dock.gap >= 8 && dock.left >= 8 && dock.radius >= 20 && /blur/.test(dock.blur),
    'bottom panel floats: rounded, off the edges, blurred'
  );
  await c('.topbar [data-act=menu]');
  await p.waitForTimeout(350);
  const drawer = await p.locator('.sheet-bg.side .sheet').innerText();
  assert(
    drawer.includes('Демо-режим') && drawer.includes('Клиент') && drawer.includes('Кухня') && drawer.includes('Время'),
    'menu holds the demo settings'
  );
  await p.selectOption('.sheet select[data-chg=time]', '09:52');
  assert(
    (await ev(() => S.time)) === '09:52' && (await p.locator('.sheet-bg.side').count()) === 1,
    'time changes from the menu, menu stays open'
  );
  await p.selectOption('.sheet select[data-chg=time]', '08:40');
  await c('.sheet [data-act=go][data-tab=orders][data-o=stats]');
  await p.waitForTimeout(250);
  assert((await ev(() => S.ctab + ':' + S.otab)) === 'orders:stats', 'menu navigates to a section');
  await U.role('kitchen');
  assert(
    (await ev(() => S.role)) === 'kitchen' &&
      (await p.locator('.topbar .tb-main').innerText()).includes('Кухня Айгуль-эже'),
    'role switched from the menu, top panel shows the kitchen'
  );
  await U.go('clients');
  assert((await ev(() => S.ktab)) === 'clients', 'kitchen sections are reachable from the menu');

  // ---------- поиск в кабинете
  await c('[data-act=qOpen]');
  await p.locator('.tb-q input').fill('лагман');
  assert(
    (await p.locator('.tix .tkt').count()) > 0 && (await p.locator('.k-main').innerText()).includes('Блюда'),
    'kitchen search: orders and dishes'
  );
  await ev(() => history.back());
  await p.waitForTimeout(250);
  assert((await ev(() => S.kqopen)) === false && (await ev(() => S.ktab)) === 'clients', 'Back closes the search');
  await U.role('client');

  // ---------- поиск клиента
  await c('.tabbar [data-tab=home]');
  await c('[data-act=qOpen]');
  assert((await p.locator('.chips.wrap .chip').count()) >= 4, 'search suggests what is cooked today');
  await p.locator('.tb-q input').fill('плов');
  const found = await p.locator('.c-shell').innerText();
  assert(
    found.includes('Заведения') &&
      found.includes('Дом плова') &&
      (await p.locator('.ogroup h3').first().innerText()) === 'Плов',
    'search finds kitchens and dishes'
  );
  await shot('search');
  await c('[data-act=qClose]');
  assert((await p.locator('.topbar.q').count()) === 0 && (await ev(() => S.q)) === '', 'search closed');

  // ---------- заявка с переводом и чеком
  await c('.rc-h[data-id=k1]');
  await c('[data-act=add][data-id=k1d1]');
  await c('[data-act=add][data-id=k1d1]');
  await c('[data-act=add][data-id=k1d12]');
  await c('[data-act=checkout]');
  assert((await ev(() => payOf(kitchen('k1')))) === 'mbank', 'transfer is the default payment');
  await p.locator('[data-chg=coReceipt]').first().setInputFiles(receiptFile());
  await p.waitForSelector('.pb-r');
  await c('[data-act=submit]');
  let o = await my();
  assert(
    o.total === 740 && o.receipts.length === 1 && o.receipts[0].sum === 740,
    'request sent: 2 complexes and a compote, receipt for 740'
  );

  // ---------- правка заявки до подтверждения: две порции вместо одной
  await c(`.ord [data-act=oedit][data-id=${o.id}]`);
  await p.waitForTimeout(350);
  assert((await p.locator('.sheet h2').innerText()) === 'Изменить заявку', 'edit sheet for a request');
  assert((await p.locator('[data-act=oeSave]').isDisabled()) === true, 'nothing to save until something changes');
  await c('.sheet [data-act=oeSub][data-id=k1d1]');
  await shot('edit-request');
  await c('[data-act=oeSave]');
  o = await my();
  assert(
    o.total === 390 && o.items.find(i => i.dishId === 'k1d1').qty === 1 && o.edited === '08:40',
    'request changed by the client: one complex, 390'
  );
  assert((await p.locator('.sheet-bg:not(.out)').count()) === 0, 'no extra payment asked when the sum went down');
  assert((await p.locator('.ord').first().innerText()).includes('Переплата 350'), 'client sees the overpayment');

  // забыл блюдо: добавляет лагман — нужна доплата
  await p.waitForTimeout(250);
  await c(`.ord [data-act=oedit][data-id=${o.id}]`);
  await c('.sheet .oe-more [data-act=oeAdd][data-id=k1d4]');
  await c('.sheet [data-act=oeAdd][data-id=k1d4]');
  await c('.sheet [data-act=oeAdd][data-id=k1d1]');
  await p.locator('.sheet .cmt').fill('Лагман без лука');
  assert((await p.locator('.sheet .cmt').inputValue()) === 'Лагман без лука', 'note typed');
  await c('[data-act=oeSave]');
  o = await my();
  assert(o.total === 1220 && o.comment === 'Лагман без лука', 'items added: total 1220, note saved');
  await p.waitForTimeout(350);
  assert(
    (await p.locator('.sheet h2').innerText()) === 'Оплата переводом' &&
      (await p.locator('.sheet .pb-to').innerText()).includes('480'),
    'asked to pay the difference: 480'
  );
  await shot('pay-more');
  await p.locator('[data-chg=oReceipt]').setInputFiles(receiptFile());
  await p.waitForFunction(() => ORDERS.find(o => o.clientId === 'me' && o.day === 0).receipts.length === 2);
  o = await my();
  assert(
    o.receipts[1].sum === 480 && (await ev(id => dueSum(order(id)), o.id)) === 0,
    'second receipt covers the difference'
  );
  await p.waitForTimeout(250);
  await shot('order-card');

  // ---------- кухня: видит правку и оба чека
  await U.role('kitchen');
  await ev(() => {
    S.kid = 'k1';
    S.ktab = 'orders';
    S.kst = 'request';
    render();
  });
  const tk = p.locator(`.tkt[data-id=${o.id}]`);
  assert(
    (await tk.innerText()).includes('изменена') && (await tk.innerText()).includes('Лагман без лука'),
    'kitchen sees the request was edited and the note'
  );
  await tk.locator('.btn[data-act=rcpt]').click();
  await p.waitForTimeout(350);
  assert((await p.locator('.sheet .rcpt-i').count()) === 2, 'kitchen sees both receipts');
  await shot('k-receipts');
  await c('[data-act=rcptOk]');
  o = await my();
  assert(o.status === 'confirmed' && o.paid === true, 'both receipts accepted: order confirmed and paid');

  // ---------- уточнение к принятому заказу
  await U.role('client');
  await c('.tabbar [data-tab=orders]');
  await c(`.ord [data-act=oedit][data-id=${o.id}]`);
  await p.waitForTimeout(350);
  assert(
    (await p.locator('.sheet h2').innerText()) === 'Уточнить заказ',
    'confirmed order: clarification instead of edit'
  );
  await c('.sheet [data-act=oeSub][data-id=k1d4]');
  await c('.sheet .oe-more [data-act=oeAdd]');
  await p.locator('.sheet .cmt').fill('Один лагман лишний');
  await shot('clarify');
  await c('[data-act=oeSave]');
  o = await my();
  assert(o.total === 1220 && o.change && o.change.st === 'wait', 'clarification sent, the order itself is untouched');
  assert(
    (await p.locator('.ord').first().innerText()).includes('Уточнение у кухни'),
    'client sees it is with the kitchen'
  );
  assert(
    (await p.locator(`.ord [data-act=oedit][data-id=${o.id}]`).count()) === 0,
    'no second clarification while the first one waits'
  );

  await U.role('kitchen');
  await ev(() => {
    S.kst = 'confirmed';
    render();
  });
  assert((await p.locator('.tabbar .bdg').first().innerText()) !== '', 'kitchen badge counts the clarification');
  await p.locator(`.tkt[data-id=${o.id}] [data-act=kchange]`).click();
  await p.waitForTimeout(350);
  const ch = await p.locator('.sheet').innerText();
  assert(
    ch.includes('Один лагман лишний') && ch.includes('2 → 1') && ch.includes('0 → 1'),
    'kitchen sees what changes: 2 → 1 and a new dish'
  );
  await shot('k-clarify');
  await c('[data-act=chgOk]');
  o = await my();
  assert(
    o.change.st === 'ok' &&
      o.items.find(i => i.dishId === 'k1d4').qty === 1 &&
      o.comment.includes('Один лагман лишний'),
    'kitchen accepted: order changed'
  );
  await U.role('client');
  assert(
    (await p.locator('.ord').first().innerText()).includes('Изменения приняты'),
    'client sees the changes were accepted'
  );

  // кухня может оставить заказ прежним
  await c(`.ord [data-act=oedit][data-id=${o.id}]`);
  await c('.sheet [data-act=oeAdd][data-id=k1d1]');
  await c('[data-act=oeSave]');
  const before = (await my()).total;
  await ev(id => {
    S.sheet = { type: 'kchange', id };
    A.chgNo();
  }, o.id);
  o = await my();
  assert(o.total === before && o.change.st === 'no', 'kitchen declined: order stays as it was');
  assert((await p.locator('.ord').first().innerText()).includes('Кухня не изменила заказ'), 'client sees the decline');

  // ---------- заказ за наличные: клиент решил перевести и прикрепляет чек
  const cash = await ev(() => {
    const x = mkOrder({
      kid: 'k2',
      pointId: 'p1',
      clientId: 'me',
      clientName: S.me.name,
      phone: S.me.phone,
      items: [['k2d1', 1]],
      status: 'confirmed',
      t: '08:41',
      pay: 'cash',
    });
    render();
    return x.id;
  });
  await c(`.ord [data-act=opay][data-id=${cash}]`);
  await p.locator('[data-chg=oReceipt]').setInputFiles(receiptFile());
  await p.waitForFunction(id => order(id).receipts.length === 1, cash);
  assert(
    (await ev(id => order(id).pay !== 'cash' && checkOf(order(id)) === 'wait', cash)) === true,
    'cash order switched to transfer with a receipt'
  );
  await ev(id => {
    S.sheet = { type: 'rcpt', id };
    A.rcptOk();
  }, cash);
  assert((await ev(id => order(id).paid, cash)) === true, 'kitchen confirmed the payment');

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO JS ERRORS');
  await b.close();
})().catch(e => {
  console.error('TEST FAILED', e.message);
  process.exit(1);
});
