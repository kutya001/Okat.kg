'use strict';
function rcard(k, st) {
  const m = MENU[k.id].today,
    n = st.by[k.id] || 0,
    me = point(S.me.pointId),
    open = m.published && winState(k) === 'open';
  const head = `<div class="rc-h"><span class="ava">${k.em}</span><div class="rc-t"><h3>${esc(k.name)}</h3><p>${TYPES[k.type].short}, ${distTxt(distM(me, k))}</p></div><span class="rate">${k.rating}</span></div>`;
  if (!m.published)
    return `<article class="rcard off" data-act="openK" data-id="${k.id}" role="button" tabindex="0">${head}<p class="rc-more">Меню на сегодня ещё нет</p></article>`;
  const items = menuItems(k.id),
    mains = items.filter(i => ['combo', 'second', 'first'].includes(i.dish.cat)),
    two = (mains.length >= 2 ? mains : items).slice(0, 2),
    rest = items.filter(i => !two.includes(i));
  return `<article class="rcard ${open ? '' : 'off'}" data-act="openK" data-id="${k.id}" role="button" tabindex="0">${head}
    <div class="rc-two">${two.map(i => `<div class="mini">${ph(i.dish)}<b>${esc(i.dish.name)}</b><span>${som(i.price)}</span></div>`).join('')}</div>
    ${
      rest.length
        ? `<p class="rc-more">Ещё ${rest.length}: ${rest
            .slice(0, 6)
            .map(i => esc(i.dish.name))
            .join(', ')}</p>`
        : ''
    }
    <div class="rc-f">${peopleTag(n)}${dueTag(k)}${feeTag(feeFor(k, me.id))}</div>
  </article>`;
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
  <div class="feed">${list.length ? list.map(k => rcard(k, st)).join('') : '<p class="empty">Пока пусто</p>'}</div>`;
}
