'use strict';
// Общие настройки тестов. По умолчанию открывают index.html из репозитория;
// OKAT_URL — другой адрес (например, локальный сервер), CHROME_PATH — свой браузер.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const URL = process.env.OKAT_URL || 'file://' + path.join(ROOT, 'index.html');
const SHOTS = path.join(ROOT, 'tests', 'shots') + path.sep;
fs.mkdirSync(SHOTS, { recursive: true });

const launch = () => chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] });

// картинка «чека» для загрузки в форму
const receiptFile = () => ({ name: 'check.png', mimeType: 'image/png', buffer: require('./tile.js')() });

// действия через меню-гамбургер: роль, раздел, демо-время. page — функция, возвращающая текущую страницу
const ui = page => {
  const c = s => page().locator(s).first().click(),
    settle = () => page().waitForTimeout(240),
    menu = async () => {
      if (!(await page().locator('.topbar [data-act=menu]').count())) return false;
      await c('.topbar [data-act=menu]');
      return true;
    };
  return {
    // на вложенном экране вместо меню стоит «назад» — тогда роль меняем напрямую
    role: async r => {
      if (await menu()) await c(`.sheet [data-act=role][data-role=${r}]`);
      else await page().evaluate(x => A.role({ role: x }), r);
      await settle();
    },
    go: async tab => {
      await menu();
      await c(`.sheet [data-act=go][data-tab=${tab}]`);
      await settle();
    },
    time: async t => {
      await menu();
      await page().selectOption('.sheet select[data-chg=time]', t);
      await c('[data-act=closeSheet]');
      await settle();
    },
  };
};

module.exports = { URL, SHOTS, launch, receiptFile, ui };
