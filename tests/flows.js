'use strict';
// Сценарии: заявка → подтверждение → чек, отказ, меню по дням, блюда, лимиты, карта.
const { URL, SHOTS, launch, receiptFile } = require('./lib/env.js');
const assert = (c, m) => {
  if (!c) {
    console.log('FAIL: ' + m);
    process.exitCode = 1;
  } else console.log('ok: ' + m);
};
(async () => {
  const b = await launch();
  const errs = [];
  const ctx = await b.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await ctx.route(/openstreetmap/, r => r.abort());
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await p.goto(URL);
  await p.waitForTimeout(300);
  const c = s => p.locator(s).first().click(),
    ev = (f, a) => p.evaluate(f, a);
  await c('[data-act=start][data-role=client]');
  assert((await ev(() => pointStats('p1').total)) === 21, 'seed: 21 person from p1');
  // order in kitchen with delivery fee & free threshold (k3: 3 orders from p1, freeFrom 5 -> fee 50)
  await c('.rc-h[data-id=k3]');
  await c('[data-act=add][data-id=k3d1]');
  await c('[data-act=checkout]');
  assert((await p.locator('.totals').innerText()).includes('50'), 'k3 delivery fee 50 shown');
  await c('[data-act=pay][data-p=mbank]');
  assert((await p.locator('.pb-to').innerText()).includes('+996 770 11 22 33'), 'transfer details shown');
  assert((await p.locator('[data-act=submit]').count()) === 0, 'cannot send a transfer request without a receipt');
  await p.locator('[data-chg=coReceipt]').first().setInputFiles(receiptFile());
  await p.waitForSelector('.pb-r');
  await c('[data-act=submit]');
  assert(
    (await ev(() => {
      const o = ORDERS.find(o => o.clientId === 'me' && o.day === 0);
      return o.check === 'wait' && o.receipt.img.startsWith('data:image/') && !o.paid;
    })) === true,
    'request carries the receipt, waits for check'
  );
  assert(
    (await ev(() => pointStats('p1').by.k3)) === 4 && (await ev(() => pointStats('p1').total)) === 22,
    'counter grew after own request'
  );
  assert((await ev(() => S.kid)) === 'k3', 'kitchen cabinet switched to k3');
  // kitchen confirms -> client sees confirmed + receipt
  await c('[data-act=role][data-role=kitchen]');
  await c('.k-tabbar [data-tab=orders]');
  const mine = () => p.locator('.tkt', { hasText: 'Азамат' });
  assert((await mine().locator('[data-act=ordNext]').count()) === 0, 'no plain accept for a transfer request');
  // кухня отклоняет чек → клиент присылает новый → кухня принимает
  await mine().locator('.btn[data-act=rcpt]').click();
  assert((await p.locator('.sheet .rcpt img').count()) === 1, 'kitchen opens the receipt');
  await c('[data-act=rcptBad]');
  assert((await mine().innerText()).includes('Ждём новый чек'), 'kitchen waits for a new receipt');
  await c('[data-act=role][data-role=client]');
  assert((await p.locator('.ord').first().innerText()).includes('Нужен новый чек'), 'client asked for a new receipt');
  await p.locator('[data-chg=reReceipt]').setInputFiles(receiptFile());
  await p.waitForFunction(() => ORDERS.find(o => o.clientId === 'me' && o.day === 0).check === 'wait');
  assert((await p.locator('.ord').first().innerText()).includes('Чек на проверке'), 'new receipt sent');
  await c('[data-act=role][data-role=kitchen]');
  await mine().locator('.btn[data-act=rcpt]').click();
  await c('[data-act=rcptOk]');
  assert(
    (await ev(() => {
      const o = ORDERS.find(o => o.clientId === 'me' && o.day === 0);
      return o.status === 'confirmed' && o.paid && o.check === 'ok';
    })) === true,
    'receipt accepted: order confirmed and paid'
  );
  await c('[data-act=role][data-role=client]');
  const mineCard = await p.locator('.ord').first().innerText();
  assert(mineCard.includes('Заказ принят') && mineCard.includes('Оплачен'), 'client sees confirmed and paid');
  await c('[data-act=role][data-role=kitchen]');
  // наличные: заявку принимают без чека, оплату отмечают вручную
  const cash = await ev(() => {
    const o = ORDERS.find(
      o => o.kid === 'k3' && o.day === 0 && o.pay === 'cash' && ['request', 'confirmed'].includes(o.status)
    );
    return o && { id: o.id, st: o.status };
  });
  if (!cash) console.log('FAIL: no cash order of k3 in demo data');
  else {
    if (cash.st === 'request') {
      await c('[data-act=kst][data-st=request]');
      await c(`.tkt[data-id=${cash.id}] [data-act=ordNext]`);
      assert((await ev(id => order(id).status, cash.id)) === 'confirmed', 'cash request accepted without a receipt');
    }
    await c('[data-act=kst][data-st=confirmed]');
    await c(`[data-act=ordPaid][data-id=${cash.id}]`);
    assert((await ev(id => order(id).paid, cash.id)) === true, 'cash marked as paid by hand');
  }
  // reject flow on another request
  await c('[data-act=kst][data-st=request]');
  const before = await ev(() => kStats('k3').req.length);
  await c('[data-act=rejectAsk]');
  await c('[data-act=reason][data-r="Не успеваем"]');
  await c('[data-act=reject]');
  assert(
    (await ev(() => kStats('k3').req.length)) === before - 1 &&
      (await ev(() => ORDERS.some(o => o.status === 'rejected' && o.reason === 'Не успеваем'))),
    'reject with reason'
  );
  // orders: table view + status change from the table
  await c('.k-tabbar [data-tab=orders]');
  await c('[data-act=kview][data-v=table]');
  assert(
    (await p.locator('.otbl tbody tr').count()) === (await ev(() => kStats('k3').os.length)),
    'table view lists all orders'
  );
  const tid = await ev(() => kStats('k3').os.find(o => o.status === 'confirmed' && o.clientId !== 'me').id);
  await p.selectOption(`select.stsel[data-id=${tid}]`, 'cooking');
  assert((await p.evaluate(id => order(id).status, tid)) === 'cooking', 'status changed from table');
  await c('[data-act=ksort][data-s=sum]');
  assert((await ev(() => S.ksort)) === 'sum', 'table sort');
  await c('[data-act=kview][data-v=board]');
  // menu documents: open today, edit, per-day times and prices, copy to the next day
  await c('.k-tabbar [data-tab=menu]');
  assert((await p.locator('.mdoc').count()) >= 3, 'menu documents list');
  await c('.mdoc[data-d="0"]');
  const n0 = await ev(() => MENU.k3[0].items.length);
  assert((await p.locator('.dcard.kc').count()) === n0, 'menu opens as dish cards');
  await c('.dcard.kc[data-id=k3d10]');
  await c('.sheet [data-act=mOff]');
  assert((await ev(() => MENU.k3[0].items.length)) === n0 - 1, 'dish removed from day menu');
  await c('.dcard.kc[data-id=k3d1]');
  await p.locator('.sheet input[data-chg=mprice]').fill('333');
  await p.locator('.sheet input[data-chg=mprice]').blur();
  assert((await ev(() => MENU.k3[0].items.find(i => i.dishId === 'k3d1').price)) === 333, 'day price changed');
  await c('.sheet [data-act=mlim][data-d="5"]');
  assert((await ev(() => MENU.k3[0].items.find(i => i.dishId === 'k3d1').limit)) === 30, 'limit +5');
  await c('.sheet .btn[data-act=closeSheet]');
  await p.locator('input[data-chg=mtime][data-f=to]').fill('09:45');
  await p.locator('input[data-chg=mtime][data-f=to]').blur();
  assert(
    await ev(() => MENU.k3[0].to === '09:45' && kitchen('k3').to === '09:45'),
    'per-day deadline changed and applied to today'
  );
  await c('.ae-f [data-act=mCopy]');
  assert(
    await ev(
      () =>
        S.mdoc === 1 &&
        MENU.k3[1].items.length === MENU.k3[0].items.length &&
        MENU.k3[1].to === '09:45' &&
        !MENU.k3[1].published
    ),
    'copied to tomorrow as a draft'
  );
  await c('.dcard.kc[data-id=k3d1]');
  await p.locator('.sheet input[data-chg=mprice]').fill('350');
  await p.locator('.sheet input[data-chg=mprice]').blur();
  await c('.sheet .btn[data-act=closeSheet]');
  await p.locator('input[data-chg=mtime][data-f=dFrom]').fill('13:00');
  await p.locator('input[data-chg=mtime][data-f=dFrom]').blur();
  assert(
    await ev(
      () =>
        MENU.k3[1].items.find(i => i.dishId === 'k3d1').price === 350 &&
        MENU.k3[0].items.find(i => i.dishId === 'k3d1').price === 333 &&
        MENU.k3[1].dFrom === '13:00' &&
        MENU.k3[0].dFrom !== '13:00' &&
        kitchen('k3').dFrom !== '13:00'
    ),
    'tomorrow has its own price and delivery time'
  );
  await c('[data-act=sheet][data-sheet=madd]');
  await c('.sheet [data-act=mAdd][data-id=k3d10]');
  await c('.sheet .btn.pri[data-act=closeSheet]');
  assert(await ev(() => MENU.k3[1].items.some(i => i.dishId === 'k3d10')), 'dish added from catalogue');
  await c('[data-act=mpub]');
  assert(await ev(() => MENU.k3[1].published), 'tomorrow published');
  await c('[data-act=mBack]');
  await c('.mdoc[data-d="0"] [data-act=mCopy]');
  assert((await p.locator('.sheet [data-act=mCopyOk]').count()) === 1, 'asks before replacing an existing menu');
  await c('.sheet [data-act=closeSheet]');
  await c('.mdoc[data-d="-1"]');
  assert(await p.locator('input[data-chg=mtime][data-f=to]').isDisabled(), 'past menu is read-only');
  await c('[data-act=mBack]');
  // dishes: add new + edit
  await c('.mseg [data-tab=dishes]');
  await c('[data-act=dishNew]');
  await p.fill('input[name=dname]', 'Бешбармак');
  await p.fill('input[name=cost]', '190');
  await p.fill('input[name=price]', '380');
  assert((await p.locator('#dishCalc').innerText()).includes('50%'), 'margin calc live');
  await c('[data-act=dishSave]');
  assert(
    await ev(() => DISHES.some(d => d.kid === 'k3' && d.name === 'Бешбармак' && d.price === 380)),
    'new dish saved'
  );
  // reports + profile
  await c('.k-tabbar [data-tab=reports]');
  await c('[data-act=rep][data-p=today]');
  await c('[data-act=rep][data-p="30"]');
  await c('.k-top [data-tab=profile]');
  await p.locator('input[data-f=freeFrom]').fill('3');
  await p.locator('input[data-f=freeFrom]').blur();
  assert((await ev(() => kitchen('k3').freeFrom)) === 3, 'profile freeFrom saved');
  // client: price change visible, free delivery now, cancel flow, repeat, change point
  await c('[data-act=role][data-role=client]');
  await c('.tabbar [data-tab=home]');
  assert((await p.locator('.rcard[data-key=rc-k3]').innerText()).includes('333'), 'client sees new price');
  assert((await p.locator('.rcard[data-key=rc-k3]').innerText()).includes('бесплатно'), 'free delivery reached');
  await c('.rc-h[data-id=k1]');
  await c('[data-act=add][data-id=k1d5]');
  await c('[data-act=add][data-id=k1d5]');
  assert((await ev(() => S.carts.k1.k1d5)) === 2, 'manty: 2 in cart (only 2 left)');
  assert(await p.locator('[data-act=add][data-id=k1d5]').isDisabled(), 'plus disabled at stock limit');
  await c('[data-act=checkout]');
  await c('[data-act=submit]');
  await c('[data-act=cancel]');
  assert(
    (await ev(() => ORDERS.filter(o => o.clientId === 'me' && o.status === 'cancelled').length)) === 1,
    'request cancelled'
  );
  await p.locator('.ord', { hasText: 'вчера' }).locator('[data-act=again]').click();
  assert(
    (await ev(() => S.cview && S.cview.id === 'k2' && S.carts.k2 && Object.keys(S.carts.k2).length)) === 2,
    'repeat fills cart'
  );
  await c('[data-act=back]');
  await c('.tabbar [data-tab=profile]');
  await c('[data-sheet=points]');
  await c('[data-act=setPoint][data-id=p4]');
  assert(
    (await ev(() => {
      const own = ORDERS.filter(o => o.day === 0 && o.pointId === 'p4' && isActive(o)).length;
      return S.me.pointId === 'p4' && own > 0 && pointStats('p4').total === own && own < pointStats('p1').total;
    })) === true,
    'p4 shows only its own orders'
  );
  // map drag does not select, tap selects
  await c('.tabbar [data-tab=map]');
  await p.waitForTimeout(200);
  const t0 = await ev(() => document.querySelector('#world').getAttribute('transform'));
  await p.mouse.move(200, 500);
  await p.mouse.down();
  await p.mouse.move(260, 560, { steps: 5 });
  await p.mouse.up();
  assert((await ev(() => document.querySelector('#world').getAttribute('transform'))) !== t0, 'map pans on drag');
  await c('.pin[data-id=k5]');
  await p.waitForTimeout(400);
  assert((await p.locator('.mcard.sel[data-id=k5]').count()) === 1, 'pin tap selects card');
  // closed window
  await p.selectOption('select[data-chg=time]', '10:20');
  await c('.mcard[data-id=k5] [data-act=openK]');
  assert((await p.locator('[data-act=add]').count()) === 0, 'no ordering after cutoff');
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO JS ERRORS');
  await b.close();
})().catch(e => {
  console.error('TEST CRASHED', e.message);
  process.exit(1);
});
