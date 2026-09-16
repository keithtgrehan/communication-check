import { test, expect } from '@playwright/test';
import { checkDraft } from '../../web/src/engine';
import { checkTone } from '../../web/src/engine/tone';
import { DEMO_DRAFTS } from '../../web/src/demos';

for (const { width, height } of [{ width: 320, height: 900 }, { width: 382, height: 1000 }, { width: 1440, height: 900 }]) {
  for (const id of ['promises-to-confirm', 'tone-to-reconsider', 'deadline-pressure']) {
    test(`first visit reaches a real ${id} review without hunting at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      const editor = page.getByRole('textbox', { name: 'Your follow-up draft' });
      const picker = page.getByRole('combobox', { name: 'Fictional scenario' });
      const sample = page.getByRole('button', { name: 'Try a sample review' });
      await expect(editor).toHaveValue('');
      await expect(editor).toHaveAttribute('placeholder', 'Paste your customer follow-up here…');
      await expect(page.getByText('Add a draft to check.', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Check draft', exact: true })).toBeDisabled();
      await expect(picker).toHaveValue('promises-to-confirm');
      await expect(picker.locator('option')).toHaveCount(9);
      // These assertions happen before interactions that could scroll the page.
      expect(await page.evaluate(() => scrollY)).toBe(0);
      await expect(picker).toBeInViewport({ ratio: 1 });
      await expect(sample).toBeInViewport({ ratio: 1 });
      await expect(page.getByRole('button', { name: 'Paste your draft' })).toBeInViewport({ ratio: 1 });
      await picker.selectOption(id);
      await expect(editor).toHaveValue('');
      await expect(page.locator('.finding-card')).toHaveCount(0);
      await sample.click();
      const demo = DEMO_DRAFTS.find(demo => demo.id === id)!;
      const expected = (demo.preferredLens === 'tone' ? checkTone(demo.text, 'collaborative') : checkDraft(demo.text)).findings;
      await expect(editor).toHaveValue(demo.text);
      await expect(page.getByRole('tab', { name: demo.preferredLens === 'tone' ? /Tone cues/ : 'Clarity & commitments' })).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('heading', { name: 'Checks to consider' })).toBeFocused();
      await expect(page.locator('.finding-card')).toHaveCount(expected.length);
      await expect(page.locator('blockquote:visible')).toHaveText(expected[0].quote);
      // Do not click/focus these controls before measuring: that would mask an offscreen result.
      await expect(page.getByRole('heading', { name: 'Checks to consider' })).toBeInViewport({ ratio: 0.99 });
      await expect(page.locator('blockquote:visible')).toBeInViewport({ ratio: 1 });
      await expect(page.getByRole('button', { name: 'Edit this wording' })).toBeInViewport({ ratio: 1 });
      await expect(page.getByRole('button', { name: 'Keep as written' })).toBeInViewport({ ratio: 1 });
      if (width === 1440) await expect(page.locator('.start-options')).toBeInViewport({ ratio: 1 });
      await page.getByRole('button', { name: 'Edit this wording' }).click();
      await expect(editor).toBeFocused();
      expect(await editor.evaluate((field: HTMLTextAreaElement) => field.value.slice(field.selectionStart, field.selectionEnd))).toBe(expected[0].quote);
      await page.getByRole('button', { name: 'Keep as written' }).click();
      await page.getByRole('button', { name: /^Undo keep:/ }).click();
      await expect(page.getByRole('button', { name: 'Edit this wording' })).toBeFocused();
      await expect(page.locator('.findings-count')).toHaveText(`0 of ${expected.length} reviewed`);
    });
  }
}

test('every scenario uses its real engine and the current revision; selection alone preserves both reviews', async ({ page }) => {
  await page.goto('/');
  const picker = page.getByRole('combobox', { name: 'Fictional scenario' });
  const sample = page.getByRole('button', { name: 'Try a sample review' });
  const editor = page.getByRole('textbox', { name: 'Your follow-up draft' });
  const mixed = 'You always ignore our requests. We guarantee the custom integration will be ready by Friday.';
  await editor.fill(mixed);
  await page.getByRole('button', { name: 'Check draft', exact: true }).click();
  await page.getByRole('button', { name: 'Keep as written' }).click();
  await page.getByRole('tab', { name: /Tone cues/ }).click();
  await page.getByRole('button', { name: 'Check tone', exact: true }).click();
  await page.getByRole('button', { name: 'Keep as written' }).click();
  await picker.selectOption('deadline-pressure');
  await expect(editor).toHaveValue(mixed);
  await expect(page.locator('.findings-count')).toHaveText('1 of 1 reviewed');
  await page.getByRole('tab', { name: 'Clarity & commitments' }).click();
  await expect(page.locator('.findings-count')).toHaveText('1 of 1 reviewed');

  for (const demo of DEMO_DRAFTS) {
    await picker.selectOption(demo.id);
    await sample.click();
    const expected = (demo.preferredLens === 'tone' ? checkTone(demo.text, 'collaborative') : checkDraft(demo.text)).findings;
    await expect(editor).toHaveValue(demo.text);
    await expect(page.locator('.finding-card')).toHaveCount(expected.length);
    if (expected.length) {
      await expect(page.locator('.findings-count')).toHaveText(`0 of ${expected.length} reviewed`);
      await page.getByRole('button', { name: 'Edit this wording' }).click();
      expect(await editor.evaluate((field: HTMLTextAreaElement) => ({ start: field.selectionStart, end: field.selectionEnd }))).toEqual({ start: expected[0].start, end: expected[0].end });
    } else {
      await expect(page.getByRole('heading', { name: 'No checks flagged this draft' })).toBeVisible();
      await expect(page.locator('.result-empty')).toContainText('Facts and agreements were not verified');
    }
    await page.getByRole('tab', { name: demo.preferredLens === 'tone' ? 'Clarity & commitments' : /Tone cues/ }).click();
    await expect(page.locator('.finding-card')).toHaveCount(0);
    await expect(page.locator('.findings-count')).toHaveCount(0);
    await expect(page.getByRole('button', { name: demo.preferredLens === 'tone' ? 'Check draft' : 'Check tone', exact: true })).toBeEnabled();
  }
});

test('sample controls and result actions remain usable with doubled text', async ({ page }) => {
  await page.setViewportSize({ width: 382, height: 1000 });
  await page.goto('/');
  await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('body *'));
    const sizes = elements.map(element => parseFloat(getComputedStyle(element).fontSize) * 2);
    elements.forEach((element, index) => { element.style.fontSize = `${sizes[index]}px`; });
  });
  for (const control of [page.getByRole('combobox'), page.getByRole('button', { name: 'Paste your draft' }), page.getByRole('button', { name: 'Try a sample review' })]) {
    const bounds = await control.boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(await control.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  }
  await page.getByRole('combobox').selectOption('tone-to-reconsider');
  await page.getByRole('button', { name: 'Try a sample review' }).click();
  await expect(page.getByRole('heading', { name: 'Checks to consider' })).toBeFocused();
  await page.getByRole('button', { name: 'Keep as written' }).click();
  await page.getByRole('button', { name: /^Undo keep:/ }).click();
  await page.getByRole('button', { name: 'Edit this wording' }).click();
  await expect(page.getByRole('textbox')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const { width, zoom, textScale } of [{ width: 320, zoom: 1, textScale: 1 }, { width: 1440, zoom: 2, textScale: 1 }, { width: 382, zoom: 1, textScale: 2 }]) {
  test(`selected scenario labels remain readable at ${width}px, ${zoom * 100}% zoom and ${textScale * 100}% text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await page.evaluate(value => { document.documentElement.style.zoom = String(value); }, zoom);
    if (textScale !== 1) await page.evaluate(scale => {
      const elements = Array.from(document.querySelectorAll<HTMLElement>('body *'));
      const sizes = elements.map(element => parseFloat(getComputedStyle(element).fontSize) * scale);
      elements.forEach((element, index) => { element.style.fontSize = `${sizes[index]}px`; });
    }, textScale);
    const picker = page.getByRole('combobox', { name: 'Fictional scenario' });
    for (const sample of DEMO_DRAFTS) {
      await picker.selectOption(sample.id);
      const measurement = await picker.evaluate((select: HTMLSelectElement) => {
        const style = getComputedStyle(select);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        context.font = style.font;
        const textWidth = context.measureText(select.selectedOptions[0].text).width;
        // Native selects do not report clipped labels through scrollWidth.
        // The native arrow consumes space in addition to CSS padding.
        // Reserve 20px (more than Chromium’s observed 17px inset).
        const nativeArrowWidth = 20;
        const availableWidth = select.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - nativeArrowWidth;
        return { textWidth, availableWidth };
      });
      expect(measurement.textWidth, sample.label).toBeLessThanOrEqual(measurement.availableWidth);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
