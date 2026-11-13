'use strict';
/* ---------- главная: заведения ---------- */
/* карточка заведения: шапка ведёт в меню, блюда листаются вбок и добавляются в корзину прямо отсюда */
function rcard(k, st) {
  const m = MENU[k.id].today,
    n = st.by[k.id] || 0,
    me = point(S.me.pointId),
    open = m.published && winState(k) === 'open';
  const head = `<button class="rc-h" data-act="openK" data-id="${k.id}"><span class="ava">${k.em}</span><span class="rc-t"><b>${esc(k.name)}</b><small>${TYPES[k.type].short}, ${distTxt(distM(me, k))}</small></span><span class="rate">${k.rating}</span></button>`;
  if (!m.published)
    return `<article class="rcard off" data-key="rc-${k.id}">${head}<p class="rc-more">Меню на сегодня ещё нет</p></article>`;
  const all = menuItems(k.id),
    main = i => ['combo', 'second', 'first'].includes(i.dish.cat),
    items = [...all.filter(main), ...all.filter(i => !main(i))],
    cart = S.carts[k.id] || {},
    cnt = cartCnt(k.id);
  const tile = i => {
    const d = i.dish;
    return `<div class="mini"><button class="mini-b" data-act="cdish" data-k="${k.id}" data-id="${d.id}" aria-label="${esc(d.name)}: подробнее">${ph(d, '', !open || i.left > 5 || i.left <= 0 ? '' : `<span class="bd b">осталось ${i.left}</span>`)}<b>${esc(d.name)}</b></button>${addCtl(i, cart[i.dishId] || 0, open)}</div>`;
  };
  return `<article class="rcard ${open ? '' : 'off'}" data-key="rc-${k.id}">${head}
    <div class="rc-wrap"><div class="rc-scroll" data-keep="rc-${k.id}">${items.map(tile).join('')}<button class="mini more" data-act="openK" data-id="${k.id}"><span class="rbtn fill">${ic('right')}</span><b>Всё меню</b></button></div>
    <button class="rc-nav l" data-act="rcScroll" data-dir="-1" aria-label="Назад по блюдам" tabindex="-1">${ic('left', 18)}</button><button class="rc-nav r" data-act="rcScroll" data-dir="1" aria-label="Дальше по блюдам" tabindex="-1">${ic('right', 18)}</button></div>
    <div class="rc-f">${cnt && k.id !== homeCartId() ? `<button class="tagc acc" data-act="checkout" data-id="${k.id}">${ic('bag', 14)}${cnt} · ${som(cartSum(k.id))}</button>` : ''}${peopleTag(n)}${dueTag(k)}${feeTag(feeFor(k, me.id))}</div>
  </article>`;
}
/* корзина на главной: заведение, из которого добавляли последним; у остальных корзина видна меткой в карточке */
const homeCartId = () =>
  [S.lastCart, ...Object.keys(S.carts)].find(
    x => x && cartCnt(x) > 0 && winState(kitchen(x)) === 'open' && MENU[x].today.published
  );
function homeCart() {
  const id = homeCartId(),
    k = id && kitchen(id);
  if (!k) return '';
  const total = cartSum(id);
  return `<div class="cartbar home">${
    total < k.min
      ? `<button class="cartbtn off" data-act="openK" data-id="${id}">Ещё ${som(k.min - total)} до заказа</button>`
      : `<button class="cartbtn" data-act="checkout" data-id="${id}"><span class="q">${cartCnt(id)}</span><span class="cb-l">${esc(k.name)}</span><span>${som(total)}</span></button>`
  }</div>`;
}
function cHome() {
  const p = point(S.me.pointId),
    st = pointStats(p.id),
    list = KITCHENS.filter(k => S.typeFilter === 'all' || k.type === S.typeFilter);
  const top = KITCHENS.filter(k => st.by[k.id]).sort((a, b) => st.by[b.id] - st.by[a.id]);
  return `<header class="top">${addrBtn(p)}</header>
  ${
    st.total
      ? `<button class="peers" data-act="tab" data-tab="map"><span class="stack">${top
          .slice(0, 5)
          .map(k => `<i style="--c:${k.color}"></i>`)
          .join(
            ''
          )}</span><span><b>${st.total} ${pl(st.total, P_ORD)}</b> с вашей точки</span>${ic('right', 18)}</button>`
      : ''
  }
  <div class="chips" data-keep="types">${typeChips()}</div>
  <div class="feed">${list.length ? list.map(k => rcard(k, st)).join('') : '<p class="empty">Пока пусто</p>'}</div>
  ${homeCart()}`;
}
