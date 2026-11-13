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
  const n = PAY[o.pay].s;
  if (o.receipt) {
    const st = o.check === 'ok' ? 'оплачен' : o.check === 'bad' ? 'чек отклонён' : 'чек ждёт проверки';
    return `<button class="tkt-pay ${o.check === 'ok' ? 'paid' : o.check === 'bad' ? 'bad' : 'chk'}" data-act="rcpt" data-id="${o.id}" title="${n}, ${st}" aria-label="${n}, ${st}. Открыть чек">${ic(o.check === 'ok' ? 'check' : 'clip', 14)}${n}</button>`;
  }
  const full = n + (o.paid ? ', оплачен' : ', не оплачен');
  return `<button class="tkt-pay ${o.paid ? 'paid' : ''}" data-act="ordPaid" data-id="${o.id}" title="${full}" aria-label="Оплата: ${full}. Нажмите, чтобы изменить">${o.paid ? ic('check', 14) : ''}${n}</button>`;
}
/* главное действие по заказу: заявку с переводом сначала проверяют по чеку */
function nextBtn(o, cls) {
  const nx = NEXT[o.status];
  if (!nx) return '';
  if (needsCheck(o))
    return o.check === 'bad'
      ? `<span class="tagc">Ждём новый чек</span>`
      : `<button class="btn sm ok" data-act="rcpt" data-id="${o.id}">Проверить чек</button>`;
  return `<button class="btn sm ${o.status === 'request' ? 'ok' : cls}" data-act="ordNext" data-id="${o.id}">${nx[1]}</button>`;
}
const telLink = o => `<a class="tel" href="tel:${o.phone.replace(/\s/g, '')}">${esc(o.phone)}</a>`;
function ticket(o) {
  const p = point(o.pointId),
    off = !isActive(o);
  return `<article class="tkt st-${o.status}" data-id="${o.id}" ${!off && isDesk() ? 'draggable="true"' : ''}>
    <div class="tkt-h"><b>№ ${o.num}</b><span>${o.t}</span>${o.isNew ? '<i class="newb" title="Новая"></i>' : ''}${off ? `<span class="pill st-${o.status}" style="margin-left:auto">${STATUS[o.status]}</span>` : payBtn(o)}</div>
    <div class="tkt-c"><b>${esc(o.clientName)}</b>${telLink(o)}</div>
    <div class="tkt-p">${ic('pin', 15)}${esc(p.name)}</div>
    <ul class="tkt-i">${o.items.map(i => `<li><span>${i.qty} ×</span><span>${esc(i.name)}</span><b>${fmt(i.price * i.qty)}</b></li>`).join('')}${o.fee ? `<li><span></span><span>Доставка</span><b>${o.fee}</b></li>` : ''}</ul>
    ${o.comment ? `<p class="tkt-cm">${esc(o.comment)}</p>` : ''}${o.reason ? `<p class="tkt-cm">${esc(o.reason)}</p>` : ''}
    <div class="tkt-f"><b>${som(o.total)}</b><div class="acts">${o.status === 'request' ? `<button class="btn sm sec x" data-act="rejectAsk" data-id="${o.id}" aria-label="Отклонить заявку № ${o.num}" title="Отклонить">${ic('x', 18)}</button>` : ''}${nextBtn(o, 'pri')}</div></div>
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
     <td class="tc-d c-act">${nextBtn(o, 'sec')}</td></tr>`;
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
    if (o.check === 'bad') toast('Ждём от клиента новый чек');
    else S.sheet = { type: 'rcpt', id: o.id };
    render();
    return;
  }
  setStatus(o, s);
  toast(`№ ${o.num}: ${STATUS[s].toLowerCase()}`);
  render();
}
A.ktab = d => {
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
  o.check = 'ok';
  o.paid = true;
  if (o.status === 'request') setStatus(o, 'confirmed');
  S.sheet = null;
  toast(`№ ${o.num}: оплата подтверждена, заказ принят`);
  render();
};
A.rcptBad = () => {
  const o = order(S.sheet.id);
  o.check = 'bad';
  o.paid = false;
  o.isNew = false;
  S.sheet = null;
  toast(`№ ${o.num}: клиент пришлёт новый чек`);
  render();
};
SHEETS.rcpt = () => {
  const o = S.sheet.id && order(S.sheet.id),
    img = o ? receiptSrc(o) : S.sheet.img,
    mine = !o || S.role === 'client';
  const pic = `<a class="rcpt" href="${img}" target="_blank" rel="noopener" aria-label="Открыть чек целиком"><img src="${img}" alt="Чек об оплате"></a>`;
  if (!o) return `<h2>Чек</h2>${pic}`;
  const state =
    o.check === 'ok'
      ? `<span class="tagc ok">${ic('check', 14)}Оплата подтверждена</span>`
      : o.check === 'bad'
        ? `<span class="tagc bad">Чек отклонён</span>`
        : `<span class="tagc">Ждёт проверки</span>`;
  return `<h2>Чек, № ${o.num}</h2>${pic}
  <div class="rows rc-sum"><div class="row"><span><small>К оплате</small><b>${som(o.total)}</b></span>${state}</div>
  <div class="row"><span><small>${PAY[o.pay].s}, ${o.receipt.t}</small><b>${esc(o.clientName)}</b></span>${mine ? '' : `<a class="rbtn fill" href="tel:${o.phone.replace(/\s/g, '')}" aria-label="Позвонить клиенту">${ic('phone', 18)}</a>`}</div></div>
  ${
    mine || o.check !== 'wait'
      ? ''
      : `<button class="btn block ok big" data-act="rcptOk">${o.status === 'request' ? 'Оплата пришла, принять' : 'Оплата пришла'}</button><button class="btn block ghost warn" data-act="rcptBad">Чек не подходит</button>`
  }`;
};
