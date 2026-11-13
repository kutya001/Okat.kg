'use strict';
/* ---------- заказы: доска или таблица ---------- */
const FLOW = [
  ['request', 'Заявки'],
  ['confirmed', 'Приняты'],
  ['cooking', 'Готовятся'],
  ['delivering', 'В пути'],
  ['delivered', 'Доставлены'],
];
const FLOWIDS = FLOW.map(f => f[0]);
const NEXT = {
  request: ['confirmed', 'Принять'],
  confirmed: ['cooking', 'Готовить'],
  cooking: ['delivering', 'В доставку'],
  delivering: ['delivered', 'Доставлен'],
};
const BULK = {
  request: 'Принять наличные',
  confirmed: 'Все готовить',
  cooking: 'Все в доставку',
  delivering: 'Все доставлены',
};
const REASONS = ['Закончились продукты', 'Не успеваем', 'Не возим на эту точку', 'Другое'];
const isDesk = () => window.matchMedia('(min-width:960px)').matches;
/* разом можно двигать только то, что не ждёт проверки чека */
const bulkable = list => list.filter(o => !needsCheck(o));
/* оплата на карточке заказа: наличные отмечаются вручную, перевод — только через проверку чека */
function payBtn(o) {
  const n = PAY[o.pay].s,
    chk = checkOf(o);
  if (o.pay !== 'cash') {
    const due = dueSum(o),
      st =
        chk === 'wait'
          ? 'чек ждёт проверки'
          : chk === 'bad'
            ? 'чек отклонён'
            : !chk
              ? 'чека нет'
              : due
                ? 'оплачен частично'
                : 'оплачен',
      cls = chk === 'wait' ? 'chk' : chk === 'bad' ? 'bad' : chk === 'ok' && !due ? 'paid' : '';
    return `<button class="tkt-pay ${cls}" data-act="rcpt" data-id="${o.id}" title="${n}, ${st}" aria-label="${n}, ${st}. Открыть чеки">${ic(cls === 'paid' ? 'check' : 'clip', 14)}${n}</button>`;
  }
  const full = n + (o.paid ? ', оплачен' : ', не оплачен');
  return `<button class="tkt-pay ${o.paid ? 'paid' : ''}" data-act="ordPaid" data-id="${o.id}" title="${full}" aria-label="Оплата: ${full}. Нажмите, чтобы изменить">${o.paid ? ic('check', 14) : ''}${n}</button>`;
}
/* главное действие по заказу: заявку с переводом сначала проверяют по чеку */
function nextBtn(o, cls) {
  const nx = NEXT[o.status];
  if (!nx) return '';
  if (needsCheck(o))
    return checkOf(o) === 'wait'
      ? `<button class="btn sm ok" data-act="rcpt" data-id="${o.id}">Проверить чек</button>`
      : `<span class="tagc">${dueSum(o) > 0 && checkOf(o) === 'ok' ? 'Ждём доплату' : 'Ждём чек'}</span>`;
  return `<button class="btn sm ${o.status === 'request' ? 'ok' : cls}" data-act="ordNext" data-id="${o.id}">${nx[1]}</button>`;
}
/* клиент прислал уточнение к принятому заказу — кнопка открывает сравнение «было — стало» */
const chgBtn = o =>
  isActive(o) && o.change && o.change.st === 'wait'
    ? `<button class="btn sm amber" data-act="kchange" data-id="${o.id}">Уточнение</button>`
    : '';
const telLink = o => `<a class="tel" href="tel:${o.phone.replace(/\s/g, '')}">${esc(o.phone)}</a>`;
function ticket(o) {
  const p = point(o.pointId),
    off = !isActive(o);
  return `<article class="tkt st-${o.status}" data-id="${o.id}" ${!off && isDesk() ? 'draggable="true"' : ''}>
    <div class="tkt-h"><b>№ ${o.num}</b><span>${o.t}</span>${o.isNew ? '<i class="newb" title="Новая"></i>' : ''}${o.edited && o.status === 'request' ? `<span class="tkt-ed" title="Клиент изменил заявку в ${o.edited}">изменена</span>` : ''}${off ? `<span class="pill st-${o.status}" style="margin-left:auto">${STATUS[o.status]}</span>` : payBtn(o)}</div>
    <div class="tkt-c"><b>${esc(o.clientName)}</b>${telLink(o)}</div>
    <div class="tkt-p">${ic('pin', 15)}${esc(p.name)}</div>
    <ul class="tkt-i">${o.items.map(i => `<li><span>${i.qty} ×</span><span>${esc(i.name)}</span><b>${fmt(i.price * i.qty)}</b></li>`).join('')}${o.fee ? `<li><span></span><span>Доставка</span><b>${o.fee}</b></li>` : ''}</ul>
    ${o.comment ? `<p class="tkt-cm">${esc(o.comment)}</p>` : ''}${o.reason ? `<p class="tkt-cm">${esc(o.reason)}</p>` : ''}
    <div class="tkt-f"><b>${som(o.total)}</b><div class="acts">${o.status === 'request' ? `<button class="btn sm sec x" data-act="rejectAsk" data-id="${o.id}" aria-label="Отклонить заявку № ${o.num}" title="Отклонить">${ic('x', 18)}</button>` : ''}${chgBtn(o)}${nextBtn(o, 'pri')}</div></div>
  </article>`;
}
function kOrders(k, st) {
  const pts = byPoint(k.id);
  if (S.kpoint !== 'all' && !st.os.some(o => o.pointId === S.kpoint)) S.kpoint = 'all';
  const os = st.os.filter(o => S.kpoint === 'all' || o.pointId === S.kpoint);
  const bar = `<div class="k-bar"><div class="vseg" role="group" aria-label="Вид"><button class="${S.kview === 'board' ? 'on' : ''}" data-act="kview" data-v="board" aria-pressed="${S.kview === 'board'}">${ic('grid', 16)}Доска</button><button class="${S.kview === 'table' ? 'on' : ''}" data-act="kview" data-v="table" aria-pressed="${S.kview === 'table'}">${ic('list', 16)}Таблица</button></div>
   <label class="selw">${ic('pin', 18)}<select data-chg="kpoint" aria-label="Точка доставки"><option value="all">Все точки</option>${pts.map(x => `<option value="${x.p.id}" ${S.kpoint === x.p.id ? 'selected' : ''}>${esc(x.p.name)} (${x.orders})</option>`).join('')}</select></label></div>`;
  return bar + (S.kview === 'table' ? kOrdersTable(os) : kOrdersBoard(os));
}
function kOrdersBoard(os) {
  const off = os.filter(o => !isActive(o)),
    cols = off.length ? [...FLOW, ['off', 'Отклонены']] : FLOW;
  if (!cols.some(c => c[0] === S.kst)) S.kst = 'request';
  const inCol = id =>
    (id === 'off' ? off.slice() : os.filter(o => o.status === id)).sort(
      (a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || a.num - b.num
    );
  return `<div class="chips st-tabs" data-keep="sttabs">${cols.map(([id, l]) => `<button class="chip ${S.kst === id ? 'on' : ''}" data-act="kst" data-st="${id}">${l}<b>${inCol(id).length}</b></button>`).join('')}</div>
  <div class="board" data-keep="board" style="--cols:${cols.length}">${cols
    .map(([id, l]) => {
      const list = inCol(id);
      return `<section class="col ${S.kst === id ? 'on' : ''}" data-st="${id}" data-keep="col-${id}"><header><h3>${l}</h3><span class="cnt">${list.length}</span>${BULK[id] && bulkable(list).length > 1 ? `<button class="btn sm ${id === 'request' ? 'ok' : 'sec'}" data-act="ordAll" data-from="${id}">${BULK[id]}</button>` : ''}</header>${list.length ? list.map(ticket).join('') : `<p class="empty">Пусто</p>`}</section>`;
    })
    .join('')}</div>
  ${BULK[S.kst] && bulkable(inCol(S.kst)).length > 1 ? `<div class="bulkbar"><button class="btn block ${S.kst === 'request' ? 'ok' : 'pri'}" data-act="ordAll" data-from="${S.kst}">${BULK[S.kst]} (${bulkable(inCol(S.kst)).length})</button></div>` : ''}`;
}
const SORTS = {
  num: (a, b) => a.num - b.num,
  client: (a, b) => a.clientName.localeCompare(b.clientName, 'ru') || a.num - b.num,
  point: (a, b) => point(a.pointId).name.localeCompare(point(b.pointId).name, 'ru') || a.num - b.num,
  sum: (a, b) => b.total - a.total || a.num - b.num,
  status: (a, b) => Object.keys(STATUS).indexOf(a.status) - Object.keys(STATUS).indexOf(b.status) || a.num - b.num,
};
function kOrdersTable(os) {
  const cnt = id =>
    id === 'all'
      ? os.length
      : id === 'off'
        ? os.filter(o => !isActive(o)).length
        : os.filter(o => o.status === id).length;
  if (S.ktf !== 'all' && !cnt(S.ktf)) S.ktf = 'all';
  const f = S.ktf,
    list = os.filter(o => f === 'all' || (f === 'off' ? !isActive(o) : o.status === f)).sort(SORTS[S.ksort]);
  const th = (id, l, cls = '') =>
    `<th class="${cls}"><button class="thb ${S.ksort === id ? 'on' : ''}" data-act="ksort" data-s="${id}">${l}${S.ksort === id ? ic('down', 13) : ''}</button></th>`;
  const stSel = o =>
    isActive(o)
      ? `<select class="stsel st-${o.status}" data-chg="ordSt" data-id="${o.id}" aria-label="Статус заказа № ${o.num}">${FLOWIDS.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${STATUS[s]}</option>`).join('')}<option value="rejected">Отклонить…</option></select>`
      : `<span class="pill st-${o.status}">${STATUS[o.status]}</span>`;
  const row = o => {
    const p = point(o.pointId),
      items = o.items.map(i => esc(i.name) + (i.qty > 1 ? ' × ' + i.qty : '')).join(', ');
    return `<tr class="${o.isNew ? 'isnew' : ''}" data-id="${o.id}"><td class="c-num"><b>${o.num}</b><small>${o.t}</small></td>
     <td class="c-cl"><b>${esc(o.clientName)}</b><small>${telLink(o)}</small><small class="tc-m">${esc(p.name)}</small><small class="tc-m">${items}</small>${o.comment ? `<small class="cm">${esc(o.comment)}</small>` : ''}</td>
     <td class="tc-d">${esc(p.name)}</td><td class="tc-d c-it">${items}</td><td class="c-sum"><b>${fmt(o.total)}</b></td><td class="tc-d">${isActive(o) ? payBtn(o) : ''}</td><td class="c-st">${stSel(o)}</td>
     <td class="tc-d c-act">${chgBtn(o)}${nextBtn(o, 'sec')}</td></tr>`;
  };
  return `<div class="chips tf" data-keep="tf">${[['all', 'Все'], ...FLOW, ['off', 'Отклонены']].map(([id, l]) => (id === 'off' && !cnt(id) ? '' : `<button class="chip ${f === id ? 'on' : ''}" data-act="ktf" data-f="${id}">${l}<b>${cnt(id)}</b></button>`)).join('')}</div>
  <div class="card tcard"><table class="otbl"><thead><tr>${th('num', '№')}${th('client', 'Клиент')}${th('point', 'Точка', 'tc-d')}<th class="tc-d">Состав</th>${th('sum', 'Сумма', 'c-sum')}<th class="tc-d">Оплата</th>${th('status', 'Статус')}<th class="tc-d"></th></tr></thead>
  <tbody>${list.length ? list.map(row).join('') : `<tr><td colspan="8"><p class="empty">Пусто</p></td></tr>`}</tbody>
  <tfoot><tr><td></td><td>${list.length} ${pl(list.length, P_ORD)}</td><td class="tc-d"></td><td class="tc-d"></td><td class="c-sum">${fmt(sumBy(list, o => o.total))}</td><td class="tc-d"></td><td></td><td class="tc-d"></td></tr></tfoot></table></div>`;
}
function setStatus(o, s, reason) {
  o.status = s;
  o.log.push([s, S.time]);
  o.isNew = false;
  if (reason) o.reason = reason;
}
function moveOrder(o, s) {
  if (!o || o.status === s) {
    render();
    return;
  }
  if (s === 'off' || s === 'rejected') {
    S.sheet = { type: 'reject', id: o.id, reason: REASONS[0] };
    render();
    return;
  }
  if (needsCheck(o)) {
    if (checkOf(o) === 'wait') S.sheet = { type: 'rcpt', id: o.id };
    else toast(dueSum(o) > 0 && checkOf(o) === 'ok' ? 'Ждём от клиента доплату' : 'Ждём от клиента чек');
    render();
    return;
  }
  setStatus(o, s);
  toast(`№ ${o.num}: ${STATUS[s].toLowerCase()}`);
  render();
}
A.ktab = d => {
  S.kq = '';
  S.kqopen = false;
  if (d.tab === 'menu' && S.ktab === 'menu') S.mdoc = null;
  S.ktab = d.tab;
  S.map.sel = null;
  render();
};
A.kw = d => {
  S.kw = d.w;
  saveUi();
  render();
};
A.kst = d => {
  S.kst = d.st;
  render();
};
A.kview = d => {
  S.kview = d.v;
  render();
};
A.ktf = d => {
  S.ktf = d.f;
  render();
};
A.ksort = d => {
  S.ksort = d.s;
  render();
};
C.kpoint = (d, el) => {
  S.kpoint = el.value;
  render();
};
C.ordSt = (d, el) => moveOrder(order(d.id), el.value);
A.ordNext = d => {
  const o = order(d.id),
    nx = NEXT[o.status];
  if (!nx) return;
  if (needsCheck(o)) return A.rcpt(d);
  setStatus(o, nx[0]);
  toast(`№ ${o.num}: ${STATUS[nx[0]].toLowerCase()}`);
  render();
};
A.ordAll = d => {
  const to = NEXT[d.from][0],
    list = bulkable(
      ORDERS.filter(
        o => o.kid === S.kid && o.day === 0 && o.status === d.from && (S.kpoint === 'all' || o.pointId === S.kpoint)
      )
    );
  list.forEach(o => setStatus(o, to));
  toast(`${list.length} ${pl(list.length, P_ORD)}: ${STATUS[to].toLowerCase()}`);
  render();
};
A.ordPaid = d => {
  const o = order(d.id);
  o.paid = !o.paid;
  toast(o.paid ? `№ ${o.num} оплачен` : `№ ${o.num}: оплата снята`);
  render();
};
A.rejectAsk = d => {
  S.sheet = { type: 'reject', id: d.id, reason: REASONS[0] };
  render();
};
A.reason = d => {
  S.sheet.reason = d.r;
  render();
};
A.reject = () => {
  const o = order(S.sheet.id);
  setStatus(o, 'rejected', S.sheet.reason);
  S.sheet = null;
  toast(`№ ${o.num} отклонён`);
  render();
};
SHEETS.reject = () => {
  const o = order(S.sheet.id);
  return `<h2>Отклонить № ${o.num}?</h2><div class="pays" style="margin-bottom:14px">${REASONS.map(r => `<button class="chip ${S.sheet.reason === r ? 'on' : ''}" data-act="reason" data-r="${r}">${r}</button>`).join('')}</div><button class="btn block pri" style="background:var(--bad)" data-act="reject">Отклонить</button><button class="btn block ghost" data-act="closeSheet">Отмена</button>`;
};
/* ---------- чек об оплате: кухня смотрит и подтверждает, клиент видит свой ---------- */
A.rcpt = d => {
  S.sheet = { type: 'rcpt', id: d.id };
  render();
};
A.rcptOk = () => {
  const o = order(S.sheet.id);
  waitRcpts(o).forEach(r => (r.st = 'ok'));
  syncPay(o);
  o.isNew = false;
  S.sheet = null;
  const due = dueSum(o);
  if (o.status === 'request' && !due) {
    setStatus(o, 'confirmed');
    toast(`№ ${o.num}: оплата подтверждена, заказ принят`);
  } else toast(`№ ${o.num}: оплата подтверждена${due ? `, ждём доплату ${som(due)}` : ''}`);
  render();
};
A.rcptBad = () => {
  const o = order(S.sheet.id);
  waitRcpts(o).forEach(r => (r.st = 'bad'));
  syncPay(o);
  o.isNew = false;
  S.sheet = null;
  toast(`№ ${o.num}: клиент пришлёт новый чек`);
  render();
};
SHEETS.rcpt = () => {
  const o = S.sheet.id && order(S.sheet.id),
    mine = !o || S.role === 'client',
    pic = (img, alt) =>
      `<a class="rcpt" href="${img}" target="_blank" rel="noopener" aria-label="Открыть чек целиком"><img src="${img}" alt="${alt}"></a>`;
  if (!o) return `<h2>Чек</h2>${pic(S.sheet.img, 'Чек об оплате')}`;
  const ST = { wait: ['', 'Ждёт проверки'], ok: ['ok', 'Принят'], bad: ['bad', 'Отклонён'] },
    wait = waitRcpts(o),
    due = dueSum(o),
    over = overSum(o),
    /* сначала чеки, которые ждут проверки, затем остальные от новых к старым */
    list = [...wait, ...o.receipts.filter(r => r.st !== 'wait').reverse()];
  return `<h2>${list.length > 1 ? 'Чеки' : 'Чек'}, № ${o.num}</h2>
  ${
    list.length
      ? `<div class="rcpt-list ${list.length > 1 ? 'many' : ''}">${list
          .map(
            r =>
              `<figure class="rcpt-i ${r.st}">${pic(receiptSrc(o, r), 'Чек об оплате на ' + som(r.sum))}<figcaption><b>${som(r.sum)}</b><span>${r.t}</span><span class="tagc ${ST[r.st][0]}">${ST[r.st][1]}</span></figcaption></figure>`
          )
          .join('')}</div>`
      : `<p class="empty">Чека пока нет</p>`
  }
  <div class="rows rcpt-sum"><div class="row"><span><small>Заказ</small><b>${som(o.total)}</b></span>${
    due
      ? `<span class="tagc warn">Не хватает ${som(due)}</span>`
      : over
        ? `<span class="tagc warn">Переплата ${som(over)}</span>`
        : o.paid
          ? `<span class="tagc ok">${ic('check', 14)}Оплачен</span>`
          : ''
  }</div>
  <div class="row"><span><small>${PAY[o.pay].s}</small><b>${esc(o.clientName)}</b></span>${mine ? '' : `<a class="rbtn fill" href="tel:${o.phone.replace(/\s/g, '')}" aria-label="Позвонить клиенту">${ic('phone', 18)}</a>`}</div></div>
  ${
    mine
      ? due > 0 || checkOf(o) === 'bad'
        ? `<button class="btn block pri big" data-act="opay" data-id="${o.id}">${ic('clip', 20)}Прикрепить чек</button>`
        : ''
      : wait.length
        ? `<button class="btn block ok big" data-act="rcptOk">${o.status === 'request' && due === 0 ? 'Оплата пришла, принять' : 'Оплата пришла'}</button><button class="btn block ghost warn" data-act="rcptBad">Чек не подходит</button>`
        : ''
  }`;
};

/* ---------- уточнение к принятому заказу: что клиент просит изменить ---------- */
A.kchange = d => {
  S.sheet = { type: 'kchange', id: d.id };
  render();
};
A.chgOk = () => {
  const o = order(S.sheet.id),
    c = o.change;
  setItems(o, c.items);
  if (c.note) o.comment = [o.comment, c.note].filter(Boolean).join('. ');
  c.st = 'ok';
  o.log.push(['changed', S.time]);
  S.sheet = null;
  toast(`№ ${o.num}: заказ изменён`);
  render();
};
A.chgNo = () => {
  const o = order(S.sheet.id);
  o.change.st = 'no';
  S.sheet = null;
  toast(`№ ${o.num}: заказ оставлен прежним`);
  render();
};
SHEETS.kchange = () => {
  const o = order(S.sheet.id),
    c = o.change,
    diff = orderDiff(o, c.items),
    sum = mapSum(o, c.items) + o.fee,
    delta = sum - o.total;
  /* хватит ли порций на то, что клиент добавляет */
  const short = diff.filter(x => x.to > x.from && x.to > roomFor(o, x.id));
  return `<h2>Уточнение, № ${o.num}</h2>
  <p class="ds-meta">${esc(o.clientName)}, ${c.t}</p>
  ${c.note ? `<p class="tkt-cm">${esc(c.note)}</p>` : ''}
  ${
    diff.length
      ? `<div class="rows">${diff
          .map(
            x =>
              `<div class="row"><span><b>${esc(x.name)}</b><small>${x.from ? (x.to ? 'изменить количество' : 'убрать') : 'добавить'}</small></span><b class="chg ${x.to > x.from ? 'up' : 'dn'}">${x.from} → ${x.to}</b></div>`
          )
          .join('')}</div>
  <div class="totals"><div><span>Было</span><b>${som(o.total)}</b></div><div class="sum"><span>Станет</span><b>${som(sum)}${delta ? `<i class="${delta > 0 ? 'up' : 'dn'}">${delta > 0 ? '+' : '−'}${fmt(Math.abs(delta))}</i>` : ''}</b></div></div>`
      : ''
  }
  ${short.length ? `<p class="fine bad">Не хватает порций: ${short.map(x => esc(x.name)).join(', ')}</p>` : ''}
  <button class="btn block ok big" data-act="chgOk" ${short.length ? 'disabled' : ''}>${diff.length ? 'Принять изменения' : 'Понятно'}</button>
  <button class="btn block ghost warn" data-act="chgNo">Оставить как было</button>`;
};
