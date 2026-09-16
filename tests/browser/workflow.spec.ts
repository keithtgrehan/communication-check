import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { checkDraft } from '../../web/src/engine';
import { DEMO_DRAFTS, TONE_DEMO_ID } from '../../web/src/demos';

test('all clarity demos use real checks with exact evidence, including the clean result', async ({ page }) => {
  await page.goto('/');
  for (const demo of DEMO_DRAFTS.filter(sample => sample.id !== TONE_DEMO_ID)) {
    await page.getByRole('button', { name: demo.label, exact: false }).click();
    await expect(page.getByRole('textbox', { name: 'Your follow-up draft' })).toHaveValue(demo.text);
    await page.getByRole('button', { name: /^(Recheck|Check) draft$/ }).click();
    const expected = checkDraft(demo.text).findings;
    await expect(page.locator('.finding-card')).toHaveCount(expected.length);
    for (const finding of expected) {
      const card = page.locator('.finding-card').filter({ has: page.getByRole('button', { name: finding.title, exact: true }) });
      const toggle = card.getByRole('button', { name: finding.title, exact: true });
      if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
      await expect(card.locator('blockquote')).toHaveText(finding.quote);
      await expect(card.locator('blockquote')).toBeVisible();
      await expect(page.locator('.finding-toggle[aria-expanded="true"]')).toHaveCount(1);
    }
    if (!expected.length) await expect(page.getByRole('heading', { name: 'No checks flagged this draft' })).toBeVisible();
  }
});

test('editing clears results; evidence selection, keep and recheck keep original text', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Your follow-up draft' });
  const draft = 'Hi Zoë 👋,\n\nWe guarantee the custom integration will be ready by Friday.\n\nBest,\nAlex';
  await editor.fill(draft);
  await page.getByRole('button', { name: 'Check draft', exact: true }).click();
  await expect(page.locator('.finding-card')).toHaveCount(1);
  const quote = await page.locator('.finding-card blockquote').innerText();
  await page.getByRole('button', { name: 'Edit this wording' }).click();
  await expect(editor).toBeFocused();
  expect(await editor.evaluate((element: HTMLTextAreaElement) => element.value.slice(element.selectionStart, element.selectionEnd))).toBe(quote);
  await page.getByRole('button', { name: 'Keep as written' }).click();
  await expect(page.getByRole('heading', { name: 'All shown findings reviewed' })).toBeVisible();
  await page.getByRole('button', { name: 'Recheck draft', exact: true }).click();
  await expect(page.locator('.finding-card')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /^Undo keep:/ })).toBeVisible();
  await editor.fill('Hi Zoë, please send the administrator names by Tuesday.');
  await expect(page.locator('.finding-card')).toHaveCount(0);
  await expect(page.getByText('Review the current wording.')).toBeVisible();
  await page.getByRole('button', { name: 'Recheck draft', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No checks flagged this draft' })).toBeVisible();
});

test('copy uses current edits and reset clears the page', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Your follow-up draft' });
  await editor.fill('Original fictional draft.');
  await page.getByRole('button', { name: 'Check draft', exact: true }).click();
  await editor.fill('Edited current draft — Zoë 👋.');
  await page.getByRole('button', { name: 'Copy draft', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Current draft copied.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Edited current draft — Zoë 👋.');
  await page.getByRole('button', { name: 'Clear draft' }).click();
  await expect(editor).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Check draft', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Copy draft', exact: true })).toBeDisabled();
});

test('clipboard refusal offers a truthful manual copy option', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) } }));
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Your follow-up draft' });
  await editor.fill('My fictional draft');
  await page.getByRole('button', { name: 'Copy draft', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Clipboard access is unavailable');
  expect(await editor.evaluate((el: HTMLTextAreaElement) => el.value.slice(el.selectionStart, el.selectionEnd))).toBe('My fictional draft');
  await expect(editor).toBeFocused();
});

test('oversize and empty drafts are handled without truncation', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Your follow-up draft' });
  const long = 'x'.repeat(12001);
  await editor.fill(long);
  await expect(editor).toHaveValue(long);
  await expect(editor).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('alert')).toContainText('Your full draft is still here');
  await expect(page.getByRole('button', { name: 'Check draft', exact: true })).toBeDisabled();
  await editor.fill(' \n\t');
  await expect(page.getByRole('button', { name: 'Check draft', exact: true })).toBeDisabled();
});

test('draft canary stays out of network, logs, URLs and storage; offline check works', async ({ page, context }) => {
  const canary = 'CC_PRIVACY_CANARY_20260910_ZOE';
  const requests: string[] = [];
  const logs: string[] = [];
  page.on('request', request => requests.push(request.url() + (request.postData() || '')));
  page.on('console', message => logs.push(message.text()));
  page.on('pageerror', error => logs.push(error.message));
  await page.addInitScript(() => {
    const writes: string[] = [];
    (window as unknown as { storageWrites: string[] }).storageWrites = writes;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) { writes.push(`${key}:${value}`); return setItem.call(this, key, value); };
  });
  const response = await page.goto('/');
  expect(response?.headers()['content-security-policy']).toContain("connect-src 'none'");
  await page.waitForLoadState('networkidle');
  const initialRequests = requests.length;
  const editor = page.getByRole('textbox', { name: 'Your follow-up draft' });
  await editor.fill(`${canary}\nWe guarantee the custom integration will be ready by Friday.`);
  await page.getByRole('button', { name: 'Check draft', exact: true }).click();
  await context.setOffline(true);
  await editor.fill(`${canary}\nPlease send your administrator names by Tuesday.`);
  await page.getByRole('button', { name: 'Recheck draft', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No checks flagged this draft' })).toBeVisible();
  await page.getByRole('button', { name: 'Copy draft', exact: true }).click();
  // Exercise the new lens and decisions while offline with the same canary.
  await editor.fill(`${canary}\nYou always ignore our requests.`);
  await page.getByRole('tab', { name: /Tone cues/ }).click();
  await page.getByRole('button', { name: /^(Check tone|Review tone again)$/ }).click();
  await page.getByRole('button', { name: 'Keep as written' }).click();
  await page.getByRole('button', { name: /^Undo keep:/ }).click();
  await page.getByRole('button', { name: 'Edit this wording' }).click();
  await expect(editor).toBeFocused();
  await page.getByRole('radio', { name: 'Warm', exact: true }).check();
  await page.getByRole('button', { name: 'Review tone again' }).click();
  await expect(page.locator('.finding-card')).toHaveCount(1);
  const storage = await page.evaluate(async () => ({
    local: { ...localStorage }, session: { ...sessionStorage }, cookies: document.cookie,
    databases: await indexedDB.databases(), caches: await caches.keys(),
    workers: (await navigator.serviceWorker.getRegistrations()).length,
    writes: (window as unknown as { storageWrites: string[] }).storageWrites,
  }));
  expect(storage).toEqual({ local: {}, session: {}, cookies: '', databases: [], caches: [], workers: 0, writes: [] });
  expect(requests).toHaveLength(initialRequests);
  expect(requests.join('\n') + logs.join('\n') + page.url()).not.toContain(canary);
  expect(logs).toEqual([]);
  await context.setOffline(false);
  await page.reload();
  await expect(editor).toHaveValue('');
  await expect(page.locator('.finding-card')).toHaveCount(0);
});

for (const width of [320, 390, 879, 881, 1440]) {
  test(`keyboard flow, layout and accessibility at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const sample = page.getByRole('button', { name: /Promises to confirm/ });
    await sample.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('textbox', { name: 'Your follow-up draft' }).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Check draft', exact: true })).toBeFocused();
    const focusRing = await page.getByRole('button', { name: 'Check draft', exact: true }).evaluate(button => {
      const style = getComputedStyle(button);
      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth), color: style.outlineColor };
    });
    expect(focusRing.style).not.toBe('none');
    expect(focusRing.width).toBeGreaterThanOrEqual(2);
    expect(focusRing.color).not.toBe('rgba(0, 0, 0, 0)');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Checks to consider' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.finding-toggle')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Edit this wording' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('textbox', { name: 'Your follow-up draft' })).toBeFocused();
    await page.getByText('What this check can do', { exact: true }).click();
    await expect(page.getByText('Examples are fictional;', { exact: false })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(axe.violations).toEqual([]);
  });
}

test('desktop layout remains usable at 200 percent content zoom', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await page.getByRole('button', { name: /Promises to confirm/ }).click();
  await page.getByRole('button', { name: 'Check draft', exact: true }).click();
  await expect(page.locator('.finding-card')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
