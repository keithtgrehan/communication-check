import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile, mkdir } from 'node:fs/promises';

const base = process.env.CLASSIFIER_LAB_URL ?? 'http://127.0.0.1:4187';
const output = new URL('../artifacts/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
const page = await context.newPage();
const requests = [], logs = [], errors = [];
page.on('request', request => requests.push({ url: request.url(), postData: request.postData() }));
page.on('console', entry => logs.push(entry.text()));
page.on('pageerror', error => errors.push(error.message));
const checks = [];
const check = (name, condition) => { if (!condition) throw new Error(`Browser check failed: ${name}`); checks.push(name); };
try {
  const response = await page.goto(base);
  await page.waitForFunction(() => document.querySelector('#status').textContent !== 'Loading the local model…');
  check('CSP blocks connections and form submissions', response.headers()['content-security-policy'].includes("connect-src 'none'") && response.headers()['content-security-policy'].includes("form-action 'none'"));
  check('blank initial editor and disabled classifier', await page.locator('#passage').inputValue() === '' && await page.locator('#classify').isDisabled());
  const initialRequests = requests.length;
  const canary = 'LOCAL_ONLY_CANARY_🚀_786423 We will deliver the build on Friday.\nSame passage retained.';
  await page.locator('#passage').fill(canary);
  await page.locator('#classify').click();
  check('result uses exact original quote', await page.locator('#quote').textContent() === canary);
  await page.locator('#select').click();
  check('UTF16 selection covers supplied passage', await page.locator('#passage').evaluate(el => el.selectionStart === 0 && el.selectionEnd === el.value.length));
  await page.locator('#passage').fill(canary + ' Edit');
  check('editing clears result and announces stale state', await page.locator('#result').isHidden() && (await page.locator('#status').textContent()).includes('Classify again'));
  const oversized = 'x'.repeat(2001);
  await page.locator('#passage').fill(oversized);
  await page.locator('#classify').click();
  check('oversized input retained and rejected explicitly', await page.locator('#passage').inputValue() === oversized && await page.locator('#result').isHidden() && /2,?000/.test(await page.locator('#status').textContent()));
  await context.setOffline(true);
  await page.locator('#passage').fill(canary);
  await page.locator('#classify').click();
  check('classification works offline', await page.locator('#result').isVisible());
  check('no requests during all text interactions', requests.length === initialRequests);
  const storage = await page.evaluate(async () => ({ local: localStorage.length, session: sessionStorage.length,
    databases: (await indexedDB.databases()).length, caches: (await caches.keys()).length,
    serviceWorkers: (await navigator.serviceWorker.getRegistrations()).length }));
  check('no runtime persistence or service workers', Object.values(storage).every(value => value === 0));
  check('canary absent from URL, requests, and logs', !page.url().includes('LOCAL_ONLY') &&
    !JSON.stringify(requests).includes('LOCAL_ONLY') && !JSON.stringify(logs).includes('LOCAL_ONLY'));
  await context.setOffline(false);
  const axe = await new AxeBuilder({ page }).analyze();
  check('automated accessibility scan has no violations', axe.violations.length === 0);
  await page.screenshot({ path: new URL('lab-desktop.png', output).pathname, fullPage: true });
  await page.setViewportSize({ width: 320, height: 860 });
  check('320px viewport has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: new URL('lab-mobile.png', output).pathname, fullPage: true });
  await page.reload();
  await page.waitForFunction(() => document.querySelector('#status').textContent !== 'Loading the local model…');
  check('reload clears text and findings', await page.locator('#passage').inputValue() === '' && await page.locator('#result').isHidden());
  const badRoutes = await Promise.all(['/train.py', '/data/train-dev.json', '/artifacts/parity.json', '/?draft=fictional'].map(path => context.request.get(base + path)));
  check('server exposes only allowlisted static files', badRoutes.every(r => r.status() === 404));
  check('server rejects text submission', (await context.request.post(base, { data: 'fictional' })).status() === 404);
  check('no browser runtime errors', errors.length === 0);
  const report = { passed: checks.length, checks, storage, initialAssetRequests: initialRequests,
    interactionsAdditionalRequests: 0, axeViolations: axe.violations.length,
    caveat: 'Chromium automation at desktop and 320px; no human validation or physical-device claim.' };
  await writeFile(new URL('browser-verification.json', output), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
