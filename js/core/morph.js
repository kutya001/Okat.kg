'use strict';
/* ================= ОБНОВЛЕНИЕ БЕЗ ПЕРЕСБОРКИ =================
   Экран не пересоздаётся при каждом изменении: новая разметка сравнивается со старой, и в странице
   меняется только то, что отличается. Поэтому картинки не мигают, прокрутка и фокус остаются на месте,
   а переходы CSS срабатывают, когда у элемента просто меняется состояние.

   Узлы сопоставляются по порядку и тегу. Элемент с data-key, id или data-id считается «тем же самым»
   только при совпадении ключа — так карточка, переехавшая в списке, остаётся собой, а не превращается в соседа. */
const MORPH = { onInsert: null };
const morphKey = n => (n.nodeType === 1 ? n.getAttribute('data-key') || n.id || n.getAttribute('data-id') || '' : '');
const morphSame = (a, b) =>
  a.nodeType === b.nodeType && (a.nodeType !== 1 || (a.tagName === b.tagName && morphKey(a) === morphKey(b)));

function morph(root, html) {
  const t = document.createElement('template');
  t.innerHTML = html;
  morphKids(root, t.content);
}
function morphKids(old, neu) {
  let o = old.firstChild,
    n = neu.firstChild;
  while (n) {
    const next = n.nextSibling;
    let m = null;
    if (o && morphSame(o, n)) m = o;
    else if (morphKey(n)) {
      for (let c = o; c; c = c.nextSibling)
        if (morphSame(c, n)) {
          m = c;
          break;
        }
      if (m) old.insertBefore(m, o);
    }
    if (m) {
      morphNode(m, n);
      o = m.nextSibling;
    } else {
      old.insertBefore(n, o);
      if (n.nodeType === 1 && MORPH.onInsert) MORPH.onInsert(n);
    }
    n = next;
  }
  while (o) {
    const next = o.nextSibling;
    old.removeChild(o);
    o = next;
  }
}
const selAttr = s => [...s.options].findIndex(x => x.hasAttribute('selected'));
function morphNode(o, n) {
  if (o.nodeType !== 1) {
    if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
    return;
  }
  /* поле с data-chg хранит значение в состоянии — его всегда приводим к состоянию;
     остальные поля (формы в шторках) трогаем, только если изменилось само значение в разметке */
  const tag = o.tagName,
    managed = n.hasAttribute('data-chg'),
    was = { value: o.getAttribute('value'), checked: o.hasAttribute('checked') };
  for (const a of [...o.attributes]) if (!n.hasAttribute(a.name)) o.removeAttribute(a.name);
  for (const a of [...n.attributes]) if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value);
  if (tag === 'INPUT') {
    if (o.type === 'checkbox' || o.type === 'radio') {
      const c = n.hasAttribute('checked');
      if (managed || c !== was.checked) o.checked = c;
    } else if (o.type !== 'file') {
      const v = n.getAttribute('value') || '';
      if ((managed || v !== (was.value || '')) && o.value !== v) o.value = v;
    }
    return;
  }
  if (tag === 'TEXTAREA') {
    const v = n.textContent;
    if (managed || o.defaultValue !== v) {
      o.textContent = v;
      o.value = v;
    }
    return;
  }
  if (tag === 'SELECT') {
    const before = selAttr(o),
      cnt = o.options.length;
    morphKids(o, n);
    const after = selAttr(o);
    if (managed || before !== after || cnt !== o.options.length) o.selectedIndex = Math.max(0, after);
    return;
  }
  morphKids(o, n);
}
