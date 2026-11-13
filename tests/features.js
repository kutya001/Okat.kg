'use strict';
// Лента блюд в карточке заведения, шторка блюда с БЖУ, форма блюда у кухни, плавное обновление экрана.
const { URL, launch, ui } = require('./lib/env.js');
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
    ev = (f, a) => p.evaluate(f, a),
    card = '.rcard[data-key=rc-k1] ';

  const U = ui(() => p);
  await c('[data-act=start][data-role=client]');
  // лента блюд: все блюда меню, листается вбок, заказ прямо из карточки
  const tiles = await p.locator(card + '.mini:not(.more)').count();
  assert(tiles === (await ev(() => menuItems('k1').length)), 'card shows the whole menu as tiles');
  assert(
    (await ev(() => {
      const sc = document.querySelector('.rcard[data-key=rc-k1] .rc-scroll');
      return sc.scrollWidth > sc.clientWidth + 100;
    })) === true,
    'dish strip scrolls sideways'
  );
  await ev(() => (document.querySelector('.rcard[data-key=rc-k1] .rc-scroll').scrollLeft = 300));
  const node = await p.locator(card + '.rc-scroll').elementHandle();
  await c(card + '[data-act=add][data-id=k1d6]');
  assert(
    (await ev(() => S.carts.k1.k1d6)) === 1 && (await ev(() => S.cview)) === null,
    'added from the card, stayed on home'
  );
  assert(
    (await ev(el => el.isConnected && el.scrollLeft > 200, node)) === true,
    'screen updated in place: strip kept its node and scroll position'
  );
  assert((await p.locator(card + '.stepper').count()) === 1, 'price button became a stepper');
  assert((await p.locator('.cartbar.home .cartbtn').innerText()).includes('260'), 'cart bar appeared on home');

  // шторка блюда: описание, калории, БЖУ, метки, заказ
  await ev(() => (document.querySelector('.rcard[data-key=rc-k1] .rc-scroll').scrollLeft = 0));
  const pick = await ev(() => {
    const d = menuItems('k1').find(i => i.dish.tags.length && i.dish.desc && i.left > 0).dish;
    return { id: d.id, desc: d.desc, kcal: d.kcal, p: d.p, tags: d.tags.map(t => TAGS[t]) };
  });
  await c(card + `[data-act=cdish][data-id=${pick.id}]`);
  const sheet = await p.locator('.sheet').innerText();
  assert(
    sheet.includes(pick.desc) && sheet.includes(String(pick.kcal)) && sheet.includes(pick.p + ' г'),
    'dish sheet: description, kcal, protein'
  );
  assert(
    pick.tags.every(t => sheet.includes(t)),
    'dish sheet: benefit tags'
  );
  await c('.sheet [data-act=add]');
  assert(
    (await ev(id => S.carts.k1[id], pick.id)) === 1 && (await p.locator('.sheet .stepper').count()) === 1,
    'ordered from the dish sheet'
  );
  await c('[data-act=closeSheet]');
  assert((await p.locator('.sheet-bg.out').count()) === 1, 'sheet plays its closing animation');
  await p.waitForTimeout(260);
  assert((await p.locator('.sheet-bg').count()) === 0, 'sheet removed after the animation');

  // вторая корзина видна меткой в своей карточке
  await c('.rcard[data-key=rc-k2] [data-act=add][data-id=k2d1]');
  assert((await p.locator('.rcard[data-key=rc-k1] .tagc.acc').count()) === 1, 'other cart shown as a chip in its card');
  assert((await p.locator('.cartbar.home').innerText()).includes('Тоо-Ашы'), 'bar follows the last used kitchen');

  // поле не теряет фокус и текст при обновлении экрана
  await c('.cartbar.home [data-act=checkout]');
  await p.locator('.cmt').fill('Без лука');
  await p.locator('.cmt').focus();
  await c('[data-act=add][data-id=k2d1]');
  assert((await p.locator('.cmt').inputValue()) === 'Без лука', 'comment survives a re-render');

  // кухня: описание, БЖУ и метки в форме блюда → видит клиент
  await U.role('kitchen');
  await ev(() => {
    S.kid = 'k1';
    S.ktab = 'dishes';
    render();
  });
  const tg = await ev(() => {
    const d = menuItems('k1').find(i => i.dish.cat === 'second' && !i.dish.tags.includes('protein')).dish;
    return { id: d.id, name: d.name };
  });
  await c(`[data-act=dishEdit][data-id=${tg.id}]`);
  await p.locator('[name=desc]').fill('Домашняя котлета из говядины, пюре на молоке');
  await p.locator('[name=kcal]').fill('');
  await p.locator('[name=p]').fill('30');
  await p.locator('[name=f]').fill('20');
  await p.locator('[name=c]').fill('40');
  await c('[data-act=dishTag][data-t=protein]');
  assert(
    (await p.locator('[name=desc]').inputValue()).startsWith('Домашняя'),
    'form keeps typed text when a tag is toggled'
  );
  await c('[data-act=dishSave]');
  assert(
    (await ev(id => {
      const d = dish(id);
      return d.kcal === 460 && d.p === 30 && d.tags.includes('protein') && d.desc.startsWith('Домашняя');
    }, tg.id)) === true,
    'dish saved: kcal counted from protein, fat and carbs'
  );
  await U.role('client');
  await ev(() => {
    S.cview = { kind: 'kitchen', id: 'k1' };
    render();
  });
  assert(
    (await p.locator('.dcard', { hasText: tg.name }).first().innerText()).includes('460 ккал'),
    'client sees calories on the dish card'
  );

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'NO JS ERRORS');
  await b.close();
})().catch(e => {
  console.error('TEST FAILED', e.message);
  process.exit(1);
});
