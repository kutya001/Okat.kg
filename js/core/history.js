'use strict';
/* ================= КНОПКА «НАЗАД» =================
   Каждый новый экран или шторка — запись в истории браузера, поэтому системная кнопка «Назад»
   возвращает на предыдущий экран, а не закрывает сайт. Кнопки «назад» и «закрыть» в интерфейсе
   делают тот же шаг по истории, чтобы в ней не копились лишние записи. */
const NAV = { sid: Date.now().toString(36), stack: [], pending: false, off: false, t: 0 };
const navSnap = () => ({
  started: S.started,
  role: S.role,
  ctab: S.ctab,
  cview: S.cview,
  ktab: S.ktab,
  mdoc: S.mdoc,
  sheet: !!S.sheet,
});
const navState = (snap, i) => ({ okat: snap, i, sid: NAV.sid });

/* вызывается в конце каждой отрисовки: сверяет экран с верхней записью истории */
function navSync() {
  if (NAV.off || NAV.pending) return;
  const snap = navSnap(),
    key = JSON.stringify(snap),
    n = NAV.stack.length;
  try {
    if (!n) {
      NAV.stack.push(key);
      history.replaceState(navState(snap, 0), '');
    } else if (key === NAV.stack[n - 1]) {
      return;
    } else if (n > 1 && key === NAV.stack[n - 2]) {
      // вернулись на предыдущий экран кнопкой в интерфейсе — шагаем по истории назад
      NAV.stack.pop();
      NAV.pending = true;
      clearTimeout(NAV.t);
      NAV.t = setTimeout(navSettle, 600);
      history.back();
    } else {
      NAV.stack.push(key);
      history.pushState(navState(snap, n), '');
    }
  } catch (err) {
    NAV.off = true; // история недоступна (например, страница встроена в чужой фрейм) — работаем без неё
  }
}
function navSettle() {
  if (!NAV.pending) return;
  NAV.pending = false;
  clearTimeout(NAV.t);
  navSync();
}
/* возвращаем экран из записи истории; то, чего уже нет (пустая корзина, удалённое меню), заменяем ближайшим */
function navApply(st) {
  S.started = !!st.started;
  S.role = st.role === 'kitchen' ? 'kitchen' : 'client';
  S.ctab = st.ctab || 'home';
  S.ktab = st.ktab || 'dash';
  let v = st.cview && kitchen(st.cview.id) ? st.cview : null;
  if (v && v.kind === 'checkout' && !cartCnt(v.id)) v = { kind: 'kitchen', id: v.id };
  S.cview = v;
  S.mdoc = st.mdoc != null && MENU[S.kid][st.mdoc] ? st.mdoc : null;
  S.sheet = null;
  S.map.sel = null;
}
window.addEventListener('popstate', e => {
  if (NAV.off) return;
  if (NAV.pending) return navSettle(); // это наш собственный шаг назад, экран уже отрисован
  const st = e.state;
  if (!st || !st.okat) return;
  const own = st.sid === NAV.sid,
    cur = NAV.stack.length - 1;
  if (own && st.okat.sheet && st.i > 0 && st.i < cur) {
    // запись со шторкой при движении назад пропускаем: под ней тот же экран
    NAV.stack.length = st.i + 1;
    history.back();
    return;
  }
  navApply(st.okat);
  const snap = navSnap(),
    key = JSON.stringify(snap),
    i = own ? st.i : 0;
  if (own) {
    NAV.stack.length = i + 1;
    NAV.stack[i] = key;
  } else NAV.stack = [key];
  if (!own || key !== JSON.stringify(st.okat)) history.replaceState(navState(snap, i), '');
  render({ back: true });
});
try {
  history.scrollRestoration = 'manual';
} catch (err) {}
