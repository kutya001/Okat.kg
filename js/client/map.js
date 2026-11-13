'use strict';
/* ---------- карта: метки и лента карточек ---------- */
function cMap() {
  const p = point(S.me.pointId),
    st = pointStats(p.id),
    sel = S.map.sel;
  const ks = KITCHENS.filter(k => S.typeFilter === 'all' || k.type === S.typeFilter).sort(
    (a, b) => (st.by[b.id] || 0) - (st.by[a.id] || 0) || distM(p, a) - distM(p, b)
  );
  const cards = ks
    .map(k => {
      const n = st.by[k.id] || 0,
        pub = MENU[k.id].today.published,
        ws = winState(k);
      return `<article class="mcard ${sel === k.id ? 'sel' : ''}" data-id="${k.id}" data-act="mapPick" role="button" tabindex="0"><span class="ava">${k.em}</span>
      <div class="mc-t"><h3>${esc(k.name)}</h3><p><span>${distTxt(distM(p, k))}</span>${n ? `<span>${ic('users', 14)}${n}</span>` : ''}<span>${!pub ? 'меню ещё нет' : ws === 'open' ? 'до ' + k.to : ws === 'closed' ? 'закрыто' : 'с ' + k.from}</span></p></div>
      <button class="rbtn acc" data-act="openK" data-id="${k.id}" aria-label="Открыть меню: ${esc(k.name)}">${ic('right')}</button></article>`;
    })
    .join('');
  return `<div class="mapwrap"><div id="map" class="map" data-mode="client">${S.map.real ? '' : mapSVG('client')}</div>
    <div class="map-top"><div class="chips" data-keep="mtypes">${typeChips()}</div>${mapNote()}</div>${mapCtl()}
    <div class="mcar" data-keep="mcar">${cards}</div></div>`;
}
