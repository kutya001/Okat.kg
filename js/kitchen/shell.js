'use strict';
/* ================= КАБИНЕТ КУХНИ ================= */
const KTABS = [
  ['dash', 'grid', 'Сводка', 1],
  ['orders', 'receipt', 'Заказы', 1],
  ['menu', 'book', 'Меню', 1],
  ['dishes', 'bowl', 'Блюда', 0],
  ['reports', 'chart', 'Выручка', 1],
  ['clients', 'users', 'Клиенты', 0],
  ['profile', 'store', 'Заведение', 0],
];
const KTITLE = {
  dash: 'Сегодня',
  orders: 'Заказы',
  menu: 'Меню',
  dishes: 'Блюда',
  reports: 'Выручка',
  clients: 'Клиенты',
  profile: 'Заведение',
};
function kitchenApp() {
  const k = kitchen(S.kid),
    st = kStats(S.kid),
    find = searching(),
    on = id => !find && S.ktab === id;
  const todo = st.req.length + st.chg.length; // заявки и уточнения, которые ждут ответа
  const bdg = id => (id === 'orders' && todo ? `<i class="bdg">${todo}</i>` : '');
  const side = KTABS.map(
    ([id, i, l]) =>
      `<button class="k-nav ${on(id) ? 'on' : ''}" data-act="ktab" data-tab="${id}" title="${l}">${ic(i, 20)}<span>${l}</span>${bdg(id)}</button>`
  ).join('');
  const tabs = KTABS.filter(t => t[3])
    .map(([id, i, l]) => {
      const a = on(id) || (id === 'menu' && on('dishes')) || (id === 'reports' && on('clients'));
      return `<button class="${a ? 'on' : ''}" data-act="ktab" data-tab="${id}" ${a ? 'aria-current="page"' : ''}>${ic(i, 23)}<span>${l}</span>${bdg(id)}</button>`;
    })
    .join('');
  const body = find
    ? kSearch(k, st)
    : {
        dash: kDash,
        orders: kOrders,
        menu: kMenu,
        dishes: kDishes,
        reports: kReports,
        clients: kClients,
        profile: kProfile,
      }[S.ktab](k, st);
  const mseg =
    (on('menu') && S.mdoc == null) || on('dishes')
      ? `<div class="mseg only-m"><button class="${on('menu') ? 'on' : ''}" data-act="ktab" data-tab="menu">По дням</button><button class="${on('dishes') ? 'on' : ''}" data-act="ktab" data-tab="dishes">Все блюда</button></div>`
      : on('reports') || on('clients')
        ? `<div class="mseg only-m"><button class="${on('reports') ? 'on' : ''}" data-act="ktab" data-tab="reports">Выручка</button><button class="${on('clients') ? 'on' : ''}" data-act="ktab" data-tab="clients">Клиенты</button></div>`
        : '';
  const mini = S.kside === 'mini';
  const bar = topBar({
    main: tbMain(k.name, `${WD[NOW.getDay()]}, ${dateLong(NOW)}`),
    search: 'kq',
    q: S.kq,
    qopen: find,
    ph: 'Заказ, клиент или блюдо',
  });
  return `<div class="k-shell"><aside class="k-side"><div class="k-id"><span class="ava">${k.em}</span><b>${esc(k.name)}</b></div><nav aria-label="Разделы">${side}</nav><button class="k-prev" data-act="preview" title="Вид клиента">${ic('eye', 18)}<span>Вид клиента</span></button><button class="k-prev k-fold" data-act="kside" title="${mini ? 'Раскрыть панель' : 'Свернуть панель'}" aria-label="${mini ? 'Раскрыть панель' : 'Свернуть панель'}" aria-expanded="${!mini}">${ic('side', 18)}<span>Свернуть</span></button></aside>
  <div class="k-col">${bar}<main class="k-main" data-key="${viewKey()}"><header class="k-top"><h1>${find ? 'Поиск' : KTITLE[S.ktab]}</h1><div class="wseg" role="group" aria-label="Ширина"><button class="${S.kw === 'full' ? 'on' : ''}" data-act="kw" data-w="full" title="Во всю ширину" aria-label="Во всю ширину" aria-pressed="${S.kw === 'full'}">${ic('wide', 18)}</button><button class="${S.kw === 'center' ? 'on' : ''}" data-act="kw" data-w="center" title="По центру" aria-label="По центру" aria-pressed="${S.kw === 'center'}">${ic('center', 18)}</button></div></header>${find ? '' : mseg}${body}</main></div></div>
  <nav class="tabbar k-tabbar glass" aria-label="Разделы">${tabs}</nav>`;
}
/* левая панель: раскрыта или свёрнута до значков; выбор запоминается */
A.kside = () => {
  S.kside = S.kside === 'mini' ? 'open' : 'mini';
  saveUi();
  render();
};
