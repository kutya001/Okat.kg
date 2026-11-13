'use strict';
/* ================= ДВИЖЕНИЕ =================
   Анимируется только то, что появилось в ответ на действие: новый экран, кнопка количества, корзина,
   карточка заказа в новой колонке. Всё остальное меняется переходами CSS. */
const FX = {
  dir: '', // направление смены экрана: 'fwd' — вглубь, 'back' — назад, '' — соседняя вкладка
  ease: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  off: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  shells: '.c-shell, .k-main, .welcome',
  /* [селектор, начальный кадр, длительность] — конечный кадр берётся из стилей элемента */
  rules: [
    ['.stepper, .addbtn', { opacity: 0.3, transform: 'scale(0.92)' }, 170],
    ['.cartbar', { opacity: 0, transform: 'translate(-50%, 100%)' }, 280],
    ['.bulkbar', { opacity: 0, transform: 'translateY(100%)' }, 260],
    ['.tkt, .ord, .rcpt, .pay-box', { opacity: 0, transform: 'translateY(8px)' }, 240],
    ['.tagc, .pill, .bd', { opacity: 0, transform: 'scale(0.9)' }, 180],
  ],
};
function fxEnter(sh) {
  const x = FX.dir === 'fwd' ? 18 : FX.dir === 'back' ? -18 : 0,
    opt = { duration: x ? 260 : 180, easing: FX.ease };
  sh.animate([{ opacity: 0 }, { opacity: 1 }], opt);
  /* сдвигаем содержимое, а не сам экран: закреплённые панели внутри него должны остаться на месте */
  if (x && !sh.matches('.is-map'))
    for (const c of sh.children)
      if (!c.matches('.cartbar, .bulkbar, .kp-h, .tabs'))
        c.animate([{ transform: `translateX(${x}px)` }, { transform: 'none' }], opt);
}
MORPH.onInsert = el => {
  if (FX.off() || !el.animate) return;
  const sh = el.matches(FX.shells) ? el : el.querySelector(FX.shells);
  if (sh) return fxEnter(sh);
  for (const [sel, from, ms] of FX.rules)
    if (el.matches(sel)) return el.animate([from, {}], { duration: ms, easing: FX.ease });
};
/* короткий «толчок» элемента, у которого изменилось число */
function fxBump(sel) {
  if (FX.off()) return;
  for (const el of $$(sel))
    el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(1)' }], {
      duration: 220,
      easing: 'ease-out',
    });
}
