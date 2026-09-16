import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { checkTone } from '../../web/src/engine/tone';
import { checkDraft } from '../../web/src/engine';
import { type ToneIntent } from '../../web/src/engine/types';

const mixedDraft = 'Hi Zoë 👋,\n\nYou always ignore our requests.\nPlease send the workspace list by Thursday.\nWe guarantee the custom integration will be ready by Friday.';
const toneTab = (page: Page) => page.getByRole('tab', { name: /Tone & warmth/ });
const clarityTab = (page: Page) => page.getByRole('tab', { name: 'Clarity & commitments' });
const editorFor = (page: Page) => page.getByRole('textbox', { name: 'Your follow-up draft' });
const runTone = async (page: Page) => {
  await page.getByRole('button', { name: /^(Check tone|Review tone again)$/ }).click();
  await expect(page.getByRole('heading', { name: 'Checks to consider' })).toBeFocused();
};

for (const intent of ['direct', 'collaborative', 'warm'] as ToneIntent[]) {
  test(`explicit ${intent} review uses the real tone engine and exact evidence`, async ({ page }) => {
    await page.goto('/');
    await editorFor(page).fill(mixedDraft);
    await expect(clarityTab(page)).toHaveAttribute('aria-selected', 'true');
    await toneTab(page).click();
    await expect(page.getByRole('radio', { name: 'Collaborative' })).toBeChecked();
    await expect(page.locator('.finding-card')).toHaveCount(0);
    await page.getByRole('radio', { name: intent, exact: false }).check();
    await expect(page.locator('.finding-card')).toHaveCount(0);
    await runTone(page);
    const expected = checkTone(mixedDraft, intent).findings;
    expect(expected.length).toBeGreaterThan(0);
    await expect(page.locator('.finding-card')).toHaveCount(expected.length);
    await expect(page.locator('.finding-card blockquote:visible')).toHaveText(expected[0].quote);
    await expect(page.getByText(expected[0].prompt, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Edit this wording' }).click();
    expect(await editorFor(page).evaluate((field: HTMLTextAreaElement) => ({ start: field.selectionStart, end: field.selectionEnd, value: field.value }))).toEqual({ start: expected[0].start, end: expected[0].end, value: mixedDraft });
    await expect(page.locator('.findings-count')).toHaveText('0 of 1 reviewed');
  });
}

test('lens switching and identical rechecks preserve independent keep decisions and selection; undo restores focus', async ({ page }) => {
  await page.goto('/');
  const editor = editorFor(page);
  await editor.fill(mixedDraft);
  await page.getByRole('button', { name: 'Check draft', exact: true }).click();
  const clarity = checkDraft(mixedDraft).findings;
  expect(clarity).toHaveLength(1);
  await page.getByRole('button', { name: 'Edit this wording' }).click();
  await page.getByRole('button', { name: 'Keep as written' }).click();
  await expect(page.getByRole('button', { name: /^Undo keep:/ })).toBeFocused();
  await toneTab(page).click();
  await expect(page.locator('.finding-card')).toHaveCount(0);
  expect(await editor.evaluate((field: HTMLTextAreaElement) => field.value.slice(field.selectionStart, field.selectionEnd))).toBe(clarity[0].quote);
  await runTone(page);
  await page.getByRole('button', { name: 'Keep as written' }).click();
  await runTone(page);
  await expect(page.locator('.findings-count')).toHaveText('1 of 1 reviewed');
  await clarityTab(page).click();
  await page.getByRole('button', { name: 'Recheck draft' }).click();
  await expect(page.locator('.findings-count')).toHaveText('1 of 1 reviewed');
  await toneTab(page).click();
  await page.getByRole('button', { name: /^Undo keep:/ }).click();
  await expect(page.getByRole('button', { name: 'Edit this wording' })).toBeFocused();
  await expect(page.locator('.findings-count')).toHaveText('0 of 1 reviewed');
  await expect(editor).toHaveValue(mixedDraft);
  await clarityTab(page).click();
  await expect(page.locator('.findings-count')).toHaveText('1 of 1 reviewed');
  await page.getByRole('button', { name: 'Reset review decisions' }).click();
  await expect(page.locator('.findings-count')).toHaveText('0 of 1 reviewed');
  await expect(page.getByRole('heading', { name: 'Checks to consider' })).toBeFocused();
});

test('intent changes invalidate only tone, including changing back to the original intent', async ({ page }) => {
  await page.goto('/');
  await editorFor(page).fill(mixedDraft);
  await page.getByRole('button', { name: 'Check draft', exact: true }).click();
  await page.getByRole('button', { name: 'Keep as written' }).click();
  await toneTab(page).click();
  await runTone(page);
  await page.getByRole('button', { name: 'Keep as written' }).click();
  await page.getByRole('radio', { name: 'Direct', exact: true }).check();
  await expect(page.locator('.finding-card')).toHaveCount(0);
  await page.getByRole('radio', { name: 'Collaborative', exact: true }).check();
  await expect(page.locator('.finding-card')).toHaveCount(0);
  await runTone(page);
  await expect(page.locator('.findings-count')).toHaveText('0 of 1 reviewed');
  await clarityTab(page).click();
  await expect(page.locator('.findings-count')).toHaveText('1 of 1 reviewed');
});

test('typing, cut, undo, example loads and clear invalidate both lenses and decisions', async ({ page }) => {
  await page.goto('/');
  const editor = editorFor(page);
  const prepare = async () => {
    await editor.fill(mixedDraft);
    await clarityTab(page).click();
    await page.getByRole('button', { name: /^(Check|Recheck) draft$/ }).click();
    await page.getByRole('button', { name: 'Keep as written' }).click();
    await toneTab(page).click();
    await runTone(page);
    await page.getByRole('button', { name: 'Keep as written' }).click();
  };
  const expectInvalid = async () => {
    await expect(page.locator('.finding-card')).toHaveCount(0);
    await clarityTab(page).click();
    await expect(page.locator('.finding-card')).toHaveCount(0);
    await toneTab(page).click();
  };
  await prepare();
  await editor.focus();
  await page.keyboard.press('End');
  await page.keyboard.type(' Added.');
  await expect(page.getByRole('status')).toHaveText('Draft changed. Review again.');
  await expectInvalid();
  await prepare();
  await editor.selectText();
  await page.keyboard.press('ControlOrMeta+x');
  await expect(editor).toHaveValue('');
  await expectInvalid();
  // Browser undo restores text, never a stale review snapshot.
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(editor).not.toHaveValue('');
  await expectInvalid();
  await prepare();
  const example = page.getByRole('button', { name: /Promises to confirm/ });
  await example.click();
  await expectInvalid();
  await clarityTab(page).click();
  await page.getByRole('button', { name: 'Recheck draft' }).click();
  await page.getByRole('button', { name: 'Keep as written' }).click();
  await example.click(); // Even loading the identical example is a fresh text revision.
  await expect(page.locator('.finding-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Recheck draft' }).click();
  await expect(page.locator('.findings-count')).toHaveText('0 of 1 reviewed');
  await page.getByRole('button', { name: 'Clear draft' }).click();
  await expectInvalid();
  await expect(editor).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Check tone', exact: true })).toBeDisabled();
});

test('one expanded card, readable evidence actions and accessible tone keyboard navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const draft = 'You always ignore our requests. Stop making excuses and send the workspace list. Please reply by Friday, no excuses.';
  await editorFor(page).fill(draft);
  await clarityTab(page).focus();
  await page.keyboard.press('ArrowRight');
  await expect(toneTab(page)).toBeFocused();
  await expect(toneTab(page)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(clarityTab(page)).toBeFocused();
  await page.keyboard.press('End');
  await expect(toneTab(page)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(clarityTab(page)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(toneTab(page)).toBeFocused();
  await runTone(page);
  await expect(page.locator('.finding-card')).toHaveCount(2);
  await expect(page.locator('.finding-toggle[aria-expanded="true"]')).toHaveCount(1);
  await page.locator('.finding-toggle').nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.finding-toggle').nth(0)).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.finding-toggle').nth(1)).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Edit this wording' })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: /^Undo keep:/ })).toBeFocused();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Back to draft' }).click();
  await expect(editorFor(page)).toBeFocused();
});

test('repeated wording, emoji, history and signatures preserve original tone offsets', async ({ page }) => {
  const quote = 'You always ignore our requests.';
  const draft = `Hi Zoë 👋,\n\n> ${quote}\n\n${quote}\n\nBest,\n${quote}`;
  await page.goto('/');
  await editorFor(page).fill(draft);
  await toneTab(page).click();
  await runTone(page);
  await expect(page.locator('.finding-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Edit this wording' }).click();
  const start = draft.indexOf(quote, draft.indexOf(quote) + quote.length);
  expect(await editorFor(page).evaluate((field: HTMLTextAreaElement) => ({ start: field.selectionStart, end: field.selectionEnd, quote: field.value.slice(field.selectionStart, field.selectionEnd) }))).toEqual({ start, end: start + quote.length, quote });
});

test('tone clean states are limited, empty and oversized drafts are guarded, copy remains current', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await toneTab(page).click();
  await expect(page.getByRole('button', { name: 'Check tone', exact: true })).toBeDisabled();
  const editor = editorFor(page);
  await editor.fill('Please send the workspace list by Thursday. I will escalate the access issue if we miss the deadline.');
  await runTone(page);
  await expect(page.getByRole('heading', { name: 'No tone cues flagged' })).toBeVisible();
  await expect(page.locator('.result-empty').getByText(/cannot judge how your message will be received/)).toBeVisible();
  await expect(page.locator('.findings-count')).toHaveCount(0);
  await editor.fill('x'.repeat(12001));
  await expect(editor).toHaveValue('x'.repeat(12001));
  await expect(page.getByRole('button', { name: 'Review tone again' })).toBeDisabled();
  await editor.fill('Fresh current draft 👋');
  await page.getByRole('button', { name: 'Copy draft' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Fresh current draft 👋');
});

test('late clipboard refusal cannot select a replacement draft', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => new Promise((_resolve, reject) => { (window as unknown as { refuseCopy: () => void }).refuseCopy = () => reject(new DOMException('Denied', 'NotAllowedError')); }) } }));
  await page.goto('/');
  const editor = editorFor(page);
  await editor.fill('Original draft.');
  await page.getByRole('button', { name: 'Copy draft' }).click();
  await editor.fill('Replacement draft.');
  await page.evaluate(() => (window as unknown as { refuseCopy: () => void }).refuseCopy());
  await expect(page.locator('#copy-help')).toHaveCount(0);
  await expect(editor).toHaveValue('Replacement draft.');
  await expect(page.getByRole('status')).not.toContainText('Clipboard access is unavailable');
});
