'use strict';
/* ---------- поиск в кабинете: сегодняшние заказы, клиенты, блюда ---------- */
function kSearch(k, st) {
  const q = S.kq.trim().toLowerCase();
  if (!q) return `<p class="empty">Номер заказа, имя или телефон клиента, название блюда</p>`;
  const digits = q.replace(/\D/g, ''),
    hit = (...t) => t.join(' ').toLowerCase().includes(q),
    tel = p => digits.length >= 3 && p.replace(/\D/g, '').includes(digits);
  const os = st.os.filter(o => hit('№' + o.num, o.clientName, ...o.items.map(i => i.name)) || tel(o.phone)),
    cl = clientBook(k.id, 30)
      .filter(c => hit(c.name) || tel(c.phone))
      .sort((a, b) => b.last - a.last)
      .slice(0, 8),
    ds = DISHES.filter(d => d.kid === k.id && hit(d.name, kindOf(d)));
  if (!os.length && !cl.length && !ds.length)
    return `<div class="blank"><div class="blank-em">🔎</div><b>Ничего не нашлось</b></div>`;
  return `${os.length ? `<h2 class="cat-h">Заказы сегодня <span class="cnt">${os.length}</span></h2><div class="tix">${os.map(ticket).join('')}</div>` : ''}
  ${
    cl.length
      ? `<h2 class="cat-h">Клиенты</h2><div class="rows">${cl
          .map(
            c =>
              `<button class="row" data-act="kclient" data-id="${c.id}"><span class="ava">${esc(c.name[0])}</span><span><b>${esc(c.name)}</b><small>${c.phone}, ${esc(point(c.pointId).name)}</small></span><b>${c.n} ${pl(c.n, P_ORD)}</b></button>`
          )
          .join('')}</div>`
      : ''
  }
  ${
    ds.length
      ? `<h2 class="cat-h">Блюда</h2><div class="rows">${ds
          .map(
            d =>
              `<button class="row" data-act="dishEdit" data-id="${d.id}">${ph(d, 'em')}<span><b>${esc(d.name)}</b><small>${CATS.find(c => c.id === d.cat).n}</small></span><b>${som(d.price)}</b></button>`
          )
          .join('')}</div>`
      : ''
  }`;
}
