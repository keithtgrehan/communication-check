import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function expectAccessibleState(page: Page, state: string) {
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations, state).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${state}: page overflow`).toBe(true);
}

// Readability, responsive behavior and contrast remain acceptance criteria
// across presentation changes, including the editorial review desk.
for (const width of [320, 390, 879, 881, 1440]) {
  test(`refresh layout, readable draft, touch targets and long quote wrapping at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const editor = page.getByRole('textbox', { name: 'Your follow-up draft' });
    await editor.fill(`We guarantee the custom integration ${'for the fictional customer workspace '.repeat(8)}${'Reference'.repeat(24)} will be ready by Friday.`);
    const check = page.getByRole('button', { name: 'Check draft', exact: true });
    if (width === 1440) {
      // Filling an offscreen editor may scroll it into view. Measure the actual
      // starting viewport rather than accepting that automatic scroll.
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.soft(check, 'Primary action should fit the initial desktop viewport').toBeInViewport({ ratio: 1 });
    }
    await check.click();
    await expect(page.locator('.finding-card')).toHaveCount(1);
    await expect(page.locator('.finding-card blockquote')).toContainText('Reference'.repeat(24));

    expect.soft(await editor.evaluate(field => parseFloat(getComputedStyle(field).fontSize)), 'Draft text remains at least 16px').toBeGreaterThanOrEqual(16);
    const editorBounds = await page.locator('.editor-panel').boundingBox();
    const resultsBounds = await page.locator('.results-panel').boundingBox();
    expect(editorBounds).not.toBeNull();
    expect(resultsBounds).not.toBeNull();
    const checkBounds = await page.locator('.primary-button').boundingBox();
    const draftBounds = await editor.boundingBox();
    expect.soft(checkBounds!.y + checkBounds!.height, 'Check action stays above the draft').toBeLessThanOrEqual(draftBounds!.y);
    const examplesBounds = await page.locator('.sample-strip').boundingBox();
    expect.soft(examplesBounds!.y, 'Examples follow both workspace panels').toBeGreaterThanOrEqual(Math.max(editorBounds!.y + editorBounds!.height, resultsBounds!.y + resultsBounds!.height));
    await expect(page.locator('.finding-number')).toHaveText('01');
    if (width <= 879) {
      expect.soft(resultsBounds!.y, 'Stack the full editor and its actions before results').toBeGreaterThanOrEqual(editorBounds!.y + editorBounds!.height);
    } else {
      expect.soft(resultsBounds!.x, 'Desktop results sit beside the editor').toBeGreaterThanOrEqual(editorBounds!.x + editorBounds!.width);
      expect.soft(Math.abs(resultsBounds!.y - editorBounds!.y), 'Desktop columns start together').toBeLessThanOrEqual(1);
    }

    const controls = await page.getByRole('button').evaluateAll(buttons => buttons.map(button => {
      const bounds = button.getBoundingClientRect();
      return { label: button.textContent?.trim(), width: bounds.width, height: bounds.height, overflow: button.scrollWidth > button.clientWidth + 1 };
    }));
    for (const control of controls) {
      expect.soft(control.width, `${control.label}: target width`).toBeGreaterThanOrEqual(44);
      expect.soft(control.height, `${control.label}: target height`).toBeGreaterThanOrEqual(44);
      expect.soft(control.overflow, `${control.label}: label must wrap`).toBe(false);
    }
    expect.soft(await page.locator('.finding-card blockquote').evaluate(quote => quote.scrollWidth <= quote.clientWidth + 1), 'Long quote must wrap inside the review column').toBe(true);
    expect.soft(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal page scrolling').toBe(true);
  });
}

for (const width of [320, 881]) {
  test(`contrast and accessibility through secondary UI states at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) },
    }));
    await page.goto('/');
    const editor = page.getByRole('textbox', { name: 'Your follow-up draft' });
    await expect(page.getByRole('button', { name: 'Check draft', exact: true })).toBeDisabled();
    await expectAccessibleState(page, 'Initial and disabled');

    const example = page.getByRole('button', { name: /Promises to confirm/ });
    await example.click();
    await expect(example).toHaveAttribute('aria-pressed', 'true');
    await expectAccessibleState(page, 'Selected example');
    await page.getByRole('button', { name: 'Check draft', exact: true }).click();
    await page.getByRole('button', { name: 'Keep as written' }).click();
    await expect(page.getByRole('heading', { name: 'All shown findings reviewed' })).toBeVisible();
    await expectAccessibleState(page, 'All reviewed');

    await editor.fill('Hi Jamie, please send the administrator names by Tuesday.');
    await expect(page.getByText('Review the current wording.')).toBeVisible();
    await expectAccessibleState(page, 'Edited and stale');
    await page.getByRole('button', { name: 'Recheck draft', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'No checks flagged this draft' })).toBeVisible();
    await expectAccessibleState(page, 'Clean result');

    await page.getByRole('button', { name: 'Copy draft', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Clipboard access is unavailable');
    await expectAccessibleState(page, 'Clipboard fallback');

    await editor.fill('x'.repeat(12001));
    await expect(page.getByRole('alert')).toContainText('Your full draft is still here');
    await expectAccessibleState(page, 'Over limit');
  });
}

for (const width of [320, 390, 1024, 1440]) {
  test(`tone controls keep readable labels, focus and composited contrast at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    // Measure actual composited colours, including disabled controls excluded by axe.
    const contrast = async (selector: string) => page.locator(selector).evaluate(element => {
      const rgb = (value: string) => value.match(/[\d.]+/g)!.map(Number);
      const composite = (foreground: number[], background: number[]) => {
        const alpha = foreground[3] ?? 1;
        return foreground.slice(0, 3).map((channel, i) => channel * alpha + background[i] * (1 - alpha));
      };
      let bg = [255, 255, 255];
      const ancestors: Element[] = [];
      for (let node: Element | null = element; node; node = node.parentElement) ancestors.unshift(node);
      let outside = bg;
      for (const node of ancestors) { outside = bg; bg = composite(rgb(getComputedStyle(node).backgroundColor), bg); }
      const style = getComputedStyle(element);
      const fg = composite(rgb(style.color), bg);
      const luminance = (colour: number[]) => colour.map(channel => channel / 255).map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4).reduce((sum, channel, i) => sum + channel * [.2126, .7152, .0722][i], 0);
      const ratio = (a: number[], b: number[]) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
      return { text: ratio(fg, bg), border: ratio(rgb(style.borderTopColor), bg), outline: ratio(rgb(style.outlineColor), outside), outlineWidth: parseFloat(style.outlineWidth), outlineStyle: style.outlineStyle };
    });
    expect((await contrast('.primary-button')).text).toBeGreaterThanOrEqual(4.5);
    expect((await contrast('.editor-frame')).border).toBeGreaterThanOrEqual(3);
    expect((await contrast('.sample-button:first-child')).border).toBeGreaterThanOrEqual(3);
    expect((await contrast('.editor-actions .secondary-button:not(.reset-button)')).text).toBeGreaterThanOrEqual(4.5);
    await page.getByRole('textbox', { name: 'Your follow-up draft' }).fill('You always ignore our requests. Stop making excuses and send the workspace list.');
    const primary = page.locator('.primary-button');
    expect((await contrast('.primary-button')).text).toBeGreaterThanOrEqual(4.5);
    await primary.hover();
    expect((await contrast('.primary-button')).text).toBeGreaterThanOrEqual(4.5);
    await primary.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    const focus = await contrast('.primary-button');
    expect(focus.outlineWidth).toBeGreaterThanOrEqual(2);
    expect(focus.outlineStyle).not.toBe('none');
    expect(focus.outline).toBeGreaterThanOrEqual(3);
    // Primary focus outline is outside the filled button, on the near-white editor.
    expect(await primary.evaluate(button => getComputedStyle(button).outlineColor)).toBe('rgb(52, 53, 48)');
    await page.getByRole('tab', { name: /Tone cues/ }).click();
    for (const label of ['Direct', 'Collaborative', 'Warm']) {
      const radio = page.getByRole('radio', { name: label, exact: true });
      const target = radio.locator('..');
      const bounds = await target.boundingBox();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      expect(await target.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      await radio.check();
      expect((await contrast('.intent-option.selected')).text).toBeGreaterThanOrEqual(4.5);
    }
    await page.getByRole('button', { name: /^(Check tone|Review tone again)$/ }).click();
    await page.locator('.evidence-button:visible').hover();
    expect((await contrast('.evidence-button:visible')).text).toBeGreaterThanOrEqual(4.5);
    await expectAccessibleState(page, 'Tone hover and selected style');
    const actions = await page.locator('.finding-actions:visible button').evaluateAll(buttons => buttons.map(button => ({ height: button.clientHeight, overflow: button.scrollWidth > button.clientWidth + 1, lines: button.clientHeight / parseFloat(getComputedStyle(button).lineHeight) })));
    for (const action of actions) { expect(action.height).toBeGreaterThanOrEqual(42); expect(action.overflow).toBe(false); expect(action.lines).toBeLessThan(3); }
  });
}

test('200 percent text enlargement preserves tone controls and entire mobile flow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('body *'));
    const sizes = elements.map(element => parseFloat(getComputedStyle(element).fontSize) * 2);
    elements.forEach((element, index) => { element.style.fontSize = `${sizes[index]}px`; });
  });
  await page.getByRole('textbox', { name: 'Your follow-up draft' }).fill('You always ignore our requests.');
  await page.getByRole('tab', { name: /Tone cues/ }).click();
  await page.getByRole('button', { name: 'Check tone', exact: true }).click();
  await expect(page.locator('.finding-card')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Edit this wording' }).click();
  await expect(page.getByRole('textbox', { name: 'Your follow-up draft' })).toBeFocused();
});


for (const width of [320, 390]) {
  test(`doubled tab text stays in its own click target at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll<HTMLElement>('body *'));
      const sizes = elements.map(element => parseFloat(getComputedStyle(element).fontSize) * 2);
      elements.forEach((element, index) => { element.style.fontSize = `${sizes[index]}px`; });
    });
    for (const name of ['Clarity & commitments', /Tone cues/]) {
      const tab = page.getByRole('tab', { name });
      await tab.scrollIntoViewIfNeeded();
      const checks = await tab.evaluate(element => {
        const box = element.getBoundingClientRect();
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const rects: DOMRect[] = [];
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent?.trim()) continue;
          const range = document.createRange(); range.selectNodeContents(node);
          rects.push(...Array.from(range.getClientRects()));
        }
        return {
          overflow: element.scrollWidth > element.clientWidth + 1,
          contained: rects.every(rect => rect.left >= box.left - 1 && rect.right <= box.right + 1),
          correctTarget: rects.every(rect => {
            const hit = document.elementFromPoint(rect.right - 2, rect.top + rect.height / 2);
            return hit === element || (hit !== null && element.contains(hit));
          }),
        };
      });
      expect(checks).toEqual({ overflow: false, contained: true, correctTarget: true });
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
