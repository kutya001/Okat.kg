'use strict';
/* ---------- демо-клиенты: люди, которые работают на точках доставки ---------- */
const PEOPLE = (() => {
  const first = [
      'Айбек',
      'Нурлан',
      'Айгерим',
      'Бегимай',
      'Данияр',
      'Эрмек',
      'Жылдыз',
      'Каныкей',
      'Марат',
      'Назгуль',
      'Тимур',
      'Чынара',
      'Улан',
      'Асель',
      'Бакыт',
      'Гульнара',
      'Руслан',
      'Салтанат',
      'Эльдар',
      'Мээрим',
      'Анна',
      'Сергей',
      'Ольга',
      'Дмитрий',
      'Адилет',
      'Жанара',
      'Кубат',
      'Алина',
      'Азиз',
      'Айдана',
      'Бермет',
      'Нурбек',
      'Самат',
      'Элнура',
      'Жаныл',
      'Темир',
      'Айпери',
      'Канат',
      'Мирлан',
      'Динара',
    ],
    last = 'АБДЖИКМНОСТУЭШ',
    codes = ['700', '555', '770', '500', '999', '220'],
    r = rng(4711),
    n3 = () => 100 + Math.floor(r() * 900),
    seen = new Set(),
    out = [];
  for (const p of POINTS)
    for (let i = 0; i < 36; i++) {
      let name;
      do name = first[Math.floor(r() * first.length)] + ' ' + last[Math.floor(r() * last.length)] + '.';
      while (seen.has(name));
      seen.add(name);
      out.push({
        id: 'u' + (out.length + 1),
        name,
        phone: `+996 ${codes[Math.floor(r() * codes.length)]} ${n3()} ${n3()}`,
        pointId: p.id,
      });
    }
  return out;
})();
/* человек по id; 'me' — тот, кто сейчас пользуется приложением */
const person = id =>
  id === 'me' ? { id: 'me', name: S.me.name, phone: S.me.phone, pointId: S.me.pointId } : PEOPLE.find(p => p.id === id);
