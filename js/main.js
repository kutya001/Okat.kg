'use strict';
/* ================= ЗАПУСК ================= */
MAP_BASE = buildMapBase();
render();
/* проверяем, доступна ли настоящая карта; если да — перерисовываем экран с картой */
probeTiles().then(t => {
  S.map.prov = t;
  S.map.real = !!t;
  if ($('#map')) render();
});
let rsT;
window.addEventListener('resize', () => {
  clearTimeout(rsT);
  rsT = setTimeout(mapMount, 160);
});
