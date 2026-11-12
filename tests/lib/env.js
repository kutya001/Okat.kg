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

module.exports = { URL, SHOTS, launch };
