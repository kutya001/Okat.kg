'use strict';
/* ---------- меню: каждое меню — отдельный документ на один день ---------- */
const curMenu = () => MENU[S.kid][S.mdoc];
const dayName = d => (d === 0 ? 'сегодня' : d === 1 ? 'завтра' : d === -1 ? 'вчера' : '');
const shortDay = d => dayName(d) || WD[dayDate(d).getDay()] + ' ' + dateLong(dayDate(d));
const dayTitle = d => {
  const dt = dayDate(d),
    n = dayName(d),
    t = WD[dt.getDay()] + ', ' + dateLong(dt);
  return n ? n[0].toUpperCase() + n.slice(1) + ', ' + dateLong(dt) : t[0].toUpperCase() + t.slice(1);
};
const copyTarget = day => Math.max(day + 1, 1);
const menuPlan = m =>
  m.items.reduce(
    (a, i) => {
      const d = dish(i.dishId);
      if (d) {
        a.p += i.limit;
        a.r += i.limit * i.price;
        a.c += i.limit * d.cost;
      }
      return a;
    },
    { p: 0, r: 0, c: 0 }
  );
const menuPill = m =>
  m.day < 0
    ? `<span class="pill st-delivered">Прошло</span>`
    : m.published
      ? `<span class="pill st-confirmed">Опубликовано</span>`
      : `<span class="pill st-request">Черновик</span>`;
function kMenu(k) {
  const m = S.mdoc != null && MENU[k.id][S.mdoc];
  return m ? kMenuDoc(k, m) : kMenuList(k);
}
function kMenuList(k) {
  const docs = Object.keys(MENU[k.id])
    .map(Number)
    .sort((a, b) => b - a)
    .map(d => MENU[k.id][d]);
  let next = 1;
  while (MENU[k.id][next]) next++;
  const card = m => {
    const pn = menuPlan(m),
      its = m.items.map(i => dish(i.dishId)).filter(Boolean);
    return `<article class="mdoc ${m.day < 0 ? 'past' : ''}" data-act="mOpen" data-d="${m.day}" role="button" tabindex="0">
      <div class="mdoc-h"><div><h3>${dayTitle(m.day)}</h3><p>${its.length ? `${its.length} ${pl(its.length, P_DISH)}, ${pn.p} ${pl(pn.p, P_POR)}` : 'пусто'}</p></div>${menuPill(m)}</div>
      ${
        its.length
          ? `<div class="mdoc-em">${its
              .slice(0, 7)
              .map(d => ph(d))
              .join('')}${its.length > 7 ? `<i>+${its.length - 7}</i>` : ''}</div>`
          : ''
      }
      <div class="mdoc-f"><div><span class="tagc">${ic('clock', 14)}до ${m.to}</span><span class="tagc">${ic('truck', 14)}${m.dFrom}–${m.dTo}</span></div><button class="btn sm sec" data-act="mCopy" data-d="${m.day}" title="Копия на ${shortDay(copyTarget(m.day))}" ${its.length ? '' : 'disabled'}>${ic('copy', 16)}На ${shortDay(copyTarget(m.day))}</button></div>
    </article>`;
  };
  return `<div class="k-tools"><span></span><button class="btn pri sm" data-act="mNew" data-d="${next}">${ic('plus', 18)}Меню на ${shortDay(next)}</button></div>
  <div class="mdocs">${docs.map(card).join('')}</div>`;
}
function mCard(i, m) {
  const d = dish(i.dishId),
    live = m.day === 0,
    t = live ? taken(d.kid, d.id) : 0,
    mg = i.price > 0 ? Math.round(((i.price - d.cost) / i.price) * 100) : 0;
  return `<button class="dcard kc" data-act="mEdit" data-id="${d.id}" aria-label="${esc(d.name)}: изменить">${ph(d)}<b>${esc(d.name)}</b><span class="price">${som(i.price)}</span><small>${live ? t + ' / ' : ''}${i.limit} ${pl(i.limit, P_POR)}, <span class="mg ${mg < 35 ? 'lowm' : ''}">${mg}%</span></small></button>`;
}
function kMenuDoc(k, m) {
  const past = m.day < 0,
    live = m.day === 0,
    pn = menuPlan(m),
    dis = past ? 'disabled' : '';
  const cats = CATS.map(c => {
    const its = m.items.filter(i => {
      const d = dish(i.dishId);
      return d && d.cat === c.id;
    });
    return its.length
      ? `<h3 class="grp-h">${c.n}<span>${its.length}</span></h3><div class="dgrid kg">${its.map(i => mCard(i, m)).join('')}</div>`
      : '';
  }).join('');
  return `<button class="backlink" data-act="mBack">${ic('left', 18)}Все меню</button>
  <section class="card"><div class="ae-h"><h2>${dayTitle(m.day)}</h2>${menuPill(m)}</div>
    <label class="fld"><textarea data-chg="mnote" ${dis} placeholder="Объявление для клиентов" aria-label="Объявление для клиентов">${esc(m.note)}</textarea></label>
    <div class="ae-row">${[
      ['from', 'Заявки с'],
      ['to', 'до'],
      ['dFrom', 'Доставка с'],
      ['dTo', 'до'],
    ]
      .map(
        ([f, l]) =>
          `<label class="fld"><small>${l}</small><input type="time" value="${m[f]}" data-chg="mtime" data-f="${f}" ${dis}></label>`
      )
      .join('')}</div>
    <div class="ae-f">${past ? '' : `<button class="btn main ${m.published ? 'sec' : 'pri'}" data-act="mpub" ${m.items.length ? '' : 'disabled'}>${m.published ? 'Снять' : 'Опубликовать'}</button>`}<button class="btn sec" data-act="mCopy" data-d="${m.day}" ${m.items.length ? '' : 'disabled'}>${ic('copy', 18)}На ${shortDay(copyTarget(m.day))}</button><button class="btn sec ico" data-act="sheet" data-sheet="wa" title="Текст для WhatsApp" aria-label="Текст для WhatsApp" ${m.items.length ? '' : 'disabled'}>${ic('chat', 18)}</button>${live ? `<button class="btn sec ico" data-act="preview" title="Вид клиента" aria-label="Вид клиента">${ic('eye', 18)}</button>` : ''}</div>
  </section>
  <div class="k-tools"><span class="muted">${m.items.length ? `${m.items.length} ${pl(m.items.length, P_DISH)}, ${pn.p} ${pl(pn.p, P_POR)}, ≈ ${som(pn.r)}` : ''}</span>${past ? '' : `<button class="btn pri sm" data-act="sheet" data-sheet="madd">${ic('plus', 18)}Блюдо</button>`}</div>
  ${cats || `<div class="blank"><div class="blank-em">🍽️</div><b>В меню пока пусто</b>${past ? '' : `<button class="btn pri" data-act="sheet" data-sheet="madd">Добавить блюда</button>`}</div>`}
  ${!past && !live ? `<button class="btn ghost warn block" style="margin-top:14px" data-act="mDel">Удалить меню</button>` : ''}`;
}
A.mOpen = d => {
  S.ktab = 'menu';
  S.mdoc = +d.d;
  S.sheet = null;
  render();
};
A.mBack = () => {
  S.mdoc = null;
  render({ back: true });
};
A.mNew = d => {
  const day = +d.d;
  MENU[S.kid][day] = mkMenu(kitchen(S.kid), day);
  S.mdoc = day;
  render();
};
function doCopy(from, to) {
  const src = MENU[S.kid][from];
  MENU[S.kid][to] = { ...src, day: to, published: false, items: src.items.map(i => ({ ...i })) };
  S.sheet = null;
  S.ktab = 'menu';
  S.mdoc = to;
  toast(`Скопировано на ${shortDay(to)}`);
  render();
}
A.mCopy = d => {
  const from = +d.d,
    to = copyTarget(from),
    ex = MENU[S.kid][to];
  if (ex && ex.items.length) {
    S.sheet = { type: 'mcopy', from, to };
    render();
    return;
  }
  doCopy(from, to);
};
A.mCopyOk = () => doCopy(S.sheet.from, S.sheet.to);
SHEETS.mcopy = () =>
  `<h2>Заменить меню на ${shortDay(S.sheet.to)}?</h2><button class="btn pri block" data-act="mCopyOk">Заменить</button><button class="btn ghost block" data-act="closeSheet">Отмена</button>`;
A.mDel = () => {
  delete MENU[S.kid][S.mdoc];
  S.mdoc = null;
  toast('Меню удалено');
  render();
};
C.mnote = (d, el) => {
  curMenu().note = el.value;
};
C.mtime = (d, el) => {
  const m = curMenu();
  if (!el.value) return;
  m[d.f] = el.value;
  if (m.day === 0) kitchen(S.kid)[d.f] = el.value;
  render();
};
A.mpub = () => {
  const m = curMenu();
  m.published = !m.published;
  toast(m.published ? 'Опубликовано' : 'Снято с публикации');
  render();
};
A.mEdit = d => {
  if (curMenu().day < 0) {
    toast('Прошедшее меню не меняется');
    return;
  }
  S.sheet = { type: 'mitem', id: d.id };
  render();
};
A.mAdd = d => {
  const dd = dish(d.id);
  curMenu().items.push({ dishId: d.id, price: dd.price, limit: LIM[dd.cat] });
  render();
};
A.mOff = d => {
  const m = curMenu();
  m.items = m.items.filter(i => i.dishId !== d.id);
  S.sheet = null;
  render();
};
C.mprice = (d, el) => {
  const mi = curMenu().items.find(i => i.dishId === d.id);
  if (mi) {
    mi.price = Math.max(0, Math.round(+el.value || 0));
    render();
  }
};
A.mlim = d => {
  const m = curMenu(),
    mi = m.items.find(i => i.dishId === d.id);
  if (!mi) return;
  const t = m.day === 0 ? taken(S.kid, d.id) : 0;
  mi.limit = Math.max(t, 0, mi.limit + +d.d);
  render();
};
const calcTxt = (p, c) =>
  p > c ? `Маржа ${Math.round(((p - c) / p) * 100)}%, +${som(p - c)} с порции` : 'Цена ниже себестоимости';
SHEETS.mitem = () => {
  const m = curMenu(),
    d = dish(S.sheet.id),
    mi = m.items.find(i => i.dishId === d.id),
    live = m.day === 0,
    t = live ? taken(d.kid, d.id) : 0;
  if (!mi) return `<h2>${esc(d.name)}</h2><button class="btn pri block" data-act="closeSheet">Готово</button>`;
  return `<h2>${esc(d.name)}</h2>${live && t ? `<p class="muted">Заказано: ${t}</p>` : ''}
  <div class="form">
   <label class="fld"><small>Цена, сом</small><input type="number" inputmode="numeric" min="0" step="5" value="${mi.price}" data-chg="mprice" data-id="${d.id}"></label>
   <div class="fld"><small>Порций</small><div class="step big"><button data-act="mlim" data-id="${d.id}" data-d="-5" aria-label="Меньше порций">${ic('minus', 20)}</button><span>${mi.limit}</span><button data-act="mlim" data-id="${d.id}" data-d="5" aria-label="Больше порций">${ic('plus', 20)}</button></div></div>
   <p class="calc ${mi.price > d.cost ? '' : 'bad'}">${calcTxt(mi.price, d.cost)}</p>
   <button class="btn pri block" data-act="closeSheet">Готово</button>
   <button class="btn ghost warn block" data-act="mOff" data-id="${d.id}">Убрать из меню</button>
  </div>`;
};
SHEETS.madd = () => {
  const m = curMenu(),
    has = new Set(m.items.map(i => i.dishId)),
    rest = DISHES.filter(d => d.kid === S.kid && !has.has(d.id));
  return `<h2>Добавить блюда</h2>
  ${
    rest.length
      ? CATS.map(c => {
          const ds = rest.filter(d => d.cat === c.id);
          return ds.length
            ? `<h3 class="grp-h">${c.n}</h3><div class="list">${ds.map(d => `<button class="li" data-act="mAdd" data-id="${d.id}">${ph(d)}<span><b>${esc(d.name)}</b><small>${som(d.price)}</small></span>${ic('plus')}</button>`).join('')}</div>`
            : '';
        }).join('')
      : `<p class="empty">Все блюда уже в меню</p>`
  }
  <button class="btn sec block" data-act="dishNew">${ic('plus', 18)}Новое блюдо</button><button class="btn pri block" data-act="closeSheet">Готово</button>`;
};
A.preview = () => {
  S.role = 'client';
  S.ctab = 'home';
  S.cview = { kind: 'kitchen', id: S.kid };
  S.sheet = null;
  render();
};
function waText() {
  const k = kitchen(S.kid),
    m = curMenu(),
    d = dayDate(m.day),
    L = [`${k.em} ${k.name}: меню на ${WD[d.getDay()]}, ${dateLong(d)}`];
  if (m.note) L.push(m.note);
  CATS.forEach(c => {
    const its = m.items.filter(i => dish(i.dishId).cat === c.id);
    if (!its.length) return;
    L.push('', c.n + ':');
    its.forEach(i => L.push(`• ${dish(i.dishId).name} — ${i.price} сом`));
  });
  L.push('', `Заявки до ${m.to}, привезём ${m.dFrom}–${m.dTo}.`, 'Заказать в приложении: (ссылка на меню)');
  return L.join('\n');
}
SHEETS.wa = () =>
  `<h2>Текст для WhatsApp</h2><div class="watext">${esc(waText())}</div><button class="btn pri block" data-act="wacopy">${ic('copy', 18)}Скопировать</button>`;
A.wacopy = () => {
  const fail = () => toast('Не скопировалось — выделите текст вручную');
  try {
    navigator.clipboard.writeText(waText()).then(() => toast('Скопировано'), fail);
  } catch (e) {
    fail();
  }
};
