'use strict';
/* ================= КАБИНЕТ КУХНИ ================= */
const KTABS = [
  ['dash', 'grid', 'Сводка', 1],
  ['orders', 'receipt', 'Заказы', 1],
  ['menu', 'book', 'Меню', 1],
  ['dishes', 'bowl', 'Блюда', 0],
  ['reports', 'chart', 'Выручка', 1],
  ['profile', 'store', 'Заведение', 0],
];
const KTITLE = {
  dash: 'Сегодня',
  orders: 'Заказы',
  menu: 'Меню',
  dishes: 'Блюда',
  reports: 'Выручка',
  profile: 'Заведение',
};
function kitchenApp() {
  const k = kitchen(S.kid),
    st = kStats(S.kid),
    on = id => S.ktab === id;
  const bdg = id => (id === 'orders' && st.req.length ? `<i class="bdg">${st.req.length}</i>` : '');
  const side = KTABS.map(
    ([id, i, l]) =>
      `<button class="k-nav ${on(id) ? 'on' : ''}" data-act="ktab" data-tab="${id}">${ic(i, 20)}<span>${l}</span>${bdg(id)}</button>`
  ).join('');
  const tabs = KTABS.filter(t => t[3])
    .map(([id, i, l]) => {
      const a = on(id) || (id === 'menu' && on('dishes'));
      return `<button class="${a ? 'on' : ''}" data-act="ktab" data-tab="${id}" ${a ? 'aria-current="page"' : ''}>${ic(i, 23)}<span>${l}</span>${bdg(id)}</button>`;
    })
    .join('');
  const body = { dash: kDash, orders: kOrders, menu: kMenu, dishes: kDishes, reports: kReports, profile: kProfile }[
    S.ktab
  ](k, st);
  const mseg =
    (on('menu') && S.mdoc == null) || on('dishes')
      ? `<div class="mseg only-m"><button class="${on('menu') ? 'on' : ''}" data-act="ktab" data-tab="menu">По дням</button><button class="${on('dishes') ? 'on' : ''}" data-act="ktab" data-tab="dishes">Все блюда</button></div>`
      : '';
  return `<div class="k-shell"><aside class="k-side"><div class="k-id"><span class="ava">${k.em}</span><b>${esc(k.name)}</b></div><nav aria-label="Разделы">${side}</nav><button class="k-prev" data-act="preview">${ic('eye', 18)}Вид клиента</button></aside>
  <main class="k-main"><header class="k-top"><div><h1>${KTITLE[S.ktab]}</h1><small>${WD[NOW.getDay()]}, ${dateLong(NOW)}</small></div><div class="wseg" role="group" aria-label="Ширина"><button class="${S.kw === 'full' ? 'on' : ''}" data-act="kw" data-w="full" title="Во всю ширину" aria-label="Во всю ширину" aria-pressed="${S.kw === 'full'}">${ic('wide', 18)}</button><button class="${S.kw === 'center' ? 'on' : ''}" data-act="kw" data-w="center" title="По центру" aria-label="По центру" aria-pressed="${S.kw === 'center'}">${ic('center', 18)}</button></div><button class="rbtn only-m ${on('profile') ? 'on' : ''}" data-act="ktab" data-tab="profile" aria-label="Заведение">${ic('store')}</button></header>${mseg}${body}</main></div>
  <nav class="tabbar k-tabbar" aria-label="Разделы">${tabs}</nav>`;
}
