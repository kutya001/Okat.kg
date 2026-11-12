'use strict';
/* перетаскивание карточек между столбцами доски */
const DND = { id: null };
const dndEl = e => (e.target && e.target.nodeType === 1 ? e.target : e.target && e.target.parentElement);
const dndEnd = () => {
  DND.id = null;
  $$('.col.over').forEach(x => x.classList.remove('over'));
  $$('.tkt.dragging').forEach(x => x.classList.remove('dragging'));
};
document.addEventListener('dragstart', e => {
  const t = dndEl(e) && dndEl(e).closest('.tkt[draggable]');
  if (!t) return;
  DND.id = t.dataset.id;
  e.dataTransfer.effectAllowed = 'move';
  try {
    e.dataTransfer.setData('text/plain', DND.id);
  } catch (_) {}
  setTimeout(() => t.classList.add('dragging'), 0);
});
document.addEventListener('dragover', e => {
  if (!DND.id) return;
  const c = dndEl(e) && dndEl(e).closest('.col[data-st]');
  $$('.col.over').forEach(x => {
    if (x !== c) x.classList.remove('over');
  });
  if (c) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    c.classList.add('over');
  }
});
document.addEventListener('drop', e => {
  if (!DND.id) return;
  const c = dndEl(e) && dndEl(e).closest('.col[data-st]');
  if (!c) return;
  e.preventDefault();
  const o = order(DND.id),
    s = c.dataset.st;
  dndEnd();
  moveOrder(o, s);
});
document.addEventListener('dragend', dndEnd);
