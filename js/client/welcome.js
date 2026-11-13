'use strict';
/* ================= СТАРТОВЫЙ ЭКРАН ================= */
function welcome() {
  return `<div class="welcome" data-key="w"><div class="w-logo">Okat</div>
    <h1>Обеды<br>на работу</h1>
    <div class="w-food" aria-hidden="true"><span>🍜</span><span>🍚</span><span>🥟</span><span>🥗</span></div>
    <div class="w-acts"><button class="btn pri big" data-act="start" data-role="client">Заказать обед</button><button class="btn sec big" data-act="start" data-role="kitchen">Я готовлю и доставляю</button></div>
  </div>`;
}
