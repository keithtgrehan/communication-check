import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function expectAccessibleState(page: Page, state: string) {
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations, state).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${state}: page overflow`).toBe(true);
}

// These are the approved refresh acceptance criteria, independent of the v0
// proposal. They deliberately expose unreadable text and undersized controls in
// the previous presentation instead of treating it as the desired baseline.
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
    await page.getByRole('button', { name: /^Dismiss / }).click();
    await expect(page.getByRole('heading', { name: 'All findings dismissed' })).toBeVisible();
    await expectAccessibleState(page, 'All dismissed');

    await editor.fill('Hi Jamie, please send the administrator names by Tuesday.');
    await expect(page.getByText('New wording, fresh look.')).toBeVisible();
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
