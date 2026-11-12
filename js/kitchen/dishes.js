'use strict';
/* ---------- блюда: каталог, себестоимость, фото ---------- */
const mgOf = d => Math.round(((d.price - d.cost) / Math.max(1, d.price)) * 100);
function kDishes(k) {
  const ds = DISHES.filter(d => d.kid === k.id);
  return `<div class="k-tools"><span class="muted">${ds.length} ${pl(ds.length, P_DISH)}</span><button class="btn pri sm" data-act="dishNew">${ic('plus', 18)}Блюдо</button></div>
  <div class="card dt"><div class="dt-h"><span></span><span>Блюдо</span><span>Себестоимость</span><span>Цена</span><span>Маржа</span><span></span></div>
  ${CATS.flatMap(c => ds.filter(d => d.cat === c.id))
    .map(d => {
      const mg = mgOf(d),
        m = `<span class="mg ${mg < 35 ? 'lowm' : ''}">${mg}%</span>`;
      return `<button class="dt-r" data-act="dishEdit" data-id="${d.id}">${ph(d, 'em')}<span class="dn"><b>${esc(d.name)}</b><small>${CATS.find(c => c.id === d.cat).n}${d.w ? ', ' + esc(d.w) : ''}</small></span><span class="dnum"><b>${som(d.price)}</b><small>${fmt(d.cost)}, ${m}</small></span><span class="dc">${som(d.cost)}</span><span class="dp">${som(d.price)}</span><span class="dm">${m}</span><span class="de">${ic('edit', 18)}</span></button>`;
    })
    .join('')}</div>`;
}
SHEETS.dish = () => {
  const d = S.sheet.id ? dish(S.sheet.id) : { name: '', cat: 'second', price: 200, cost: 100, w: '' };
  return `<h2>${S.sheet.id ? 'Блюдо' : 'Новое блюдо'}</h2>
  <form class="form" id="dishForm" onsubmit="return false">
   <div class="upl"><span id="dishPh">${ph({ img: S.sheet.img, em: S.sheet.em })}</span><label class="btn sec sm">${ic('camera', 18)}Фото<input type="file" accept="image/*" data-chg="dishImg" hidden></label>${S.sheet.img ? `<button type="button" class="btn ghost sm" data-act="dishImgOff">Убрать</button>` : ''}</div>
   <label class="fld"><small>Название</small><input name="dname" value="${esc(d.name)}" autocomplete="off"></label>
   <div class="f2"><label class="fld"><small>Категория</small><select name="cat">${CATS.map(c => `<option value="${c.id}" ${c.id === d.cat ? 'selected' : ''}>${c.n}</option>`).join('')}</select></label>
   <label class="fld"><small>Вес</small><input name="w" value="${esc(d.w)}" placeholder="350 г" autocomplete="off"></label></div>
   <div class="f2"><label class="fld"><small>Себестоимость</small><input name="cost" type="number" inputmode="numeric" min="0" value="${d.cost}" data-inp="dishCalc"></label>
   <label class="fld"><small>Цена</small><input name="price" type="number" inputmode="numeric" min="0" value="${d.price}" data-inp="dishCalc"></label></div>
   <p class="calc ${d.price > d.cost ? '' : 'bad'}" id="dishCalc">${calcTxt(d.price, d.cost)}</p>
   <div class="emo" role="group" aria-label="Значок, если нет фото">${EMO.map(e => `<button type="button" class="${e === S.sheet.em ? 'on' : ''}" data-act="dishEm" data-e="${e}" aria-label="Значок ${e}">${e}</button>`).join('')}</div>
   <button type="button" class="btn pri block" data-act="dishSave">Сохранить</button>
  </form>`;
};
A.dishNew = () => {
  S.sheet = { type: 'dish', id: null, em: '🍲', img: '' };
  render();
};
A.dishEdit = d => {
  const x = dish(d.id);
  S.sheet = { type: 'dish', id: d.id, em: x.em, img: x.img || '' };
  render();
};
const dishPhUpd = () => {
  const el = $('#dishPh');
  if (el) el.innerHTML = ph({ img: S.sheet.img, em: S.sheet.em });
};
A.dishEm = (d, el) => {
  S.sheet.em = d.e;
  $$('.emo button').forEach(b => b.classList.toggle('on', b === el));
  dishPhUpd();
};
A.dishImgOff = (d, el) => {
  S.sheet.img = '';
  el.remove();
  dishPhUpd();
};
/* фото уменьшаем до 640 px и храним прямо в данных блюда */
C.dishImg = (d, el) => {
  const f = el.files && el.files[0];
  if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 640 / Math.max(im.width, im.height)),
        cv = document.createElement('canvas');
      cv.width = Math.round(im.width * k);
      cv.height = Math.round(im.height * k);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      if (S.sheet && S.sheet.type === 'dish') {
        S.sheet.img = cv.toDataURL('image/jpeg', 0.82);
        dishPhUpd();
      }
    };
    im.onerror = () => toast('Не получилось открыть фото');
    im.src = rd.result;
  };
  rd.readAsDataURL(f);
};
I.dishCalc = () => {
  const f = $('#dishForm').elements,
    p = +f.price.value || 0,
    c = +f.cost.value || 0,
    el = $('#dishCalc');
  el.textContent = calcTxt(p, c);
  el.classList.toggle('bad', p <= c);
};
A.dishSave = () => {
  const f = $('#dishForm').elements,
    name = f.dname.value.trim(),
    price = Math.max(0, Math.round(+f.price.value || 0)),
    cost = Math.max(0, Math.round(+f.cost.value || 0));
  if (!name) {
    toast('Напишите название');
    f.dname.focus();
    return;
  }
  const isNew = !S.sheet.id,
    inDoc = isNew && S.ktab === 'menu' && S.mdoc != null && MENU[S.kid][S.mdoc] && MENU[S.kid][S.mdoc].day >= 0,
    base = { name, cat: f.cat.value, w: f.w.value.trim(), price, cost, em: S.sheet.em, img: S.sheet.img || '' };
  if (isNew) {
    const id = S.kid + 'd' + Date.now();
    DISHES.push({ id, kid: S.kid, desc: '', ...base });
    if (inDoc) curMenu().items.push({ dishId: id, price, limit: LIM[base.cat] });
  } else {
    const d = dish(S.sheet.id),
      old = d.price;
    Object.assign(d, base);
    if (old !== price)
      Object.values(MENU[d.kid]).forEach(m => {
        if (m.day < 0) return;
        const mi = m.items.find(i => i.dishId === d.id);
        if (mi && mi.price === old) mi.price = price;
      });
  }
  S.sheet = null;
  toast('Сохранено');
  render();
};
