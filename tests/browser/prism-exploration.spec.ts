import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 382, 621, 1024, 1440]) {
  test(`design exploration remains separate, accessible and readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/#/exploration');
    await expect(page).toHaveTitle(/Design exploration/i);
    await expect(page.locator('.exploration-shell')).toBeVisible();
    for (const name of ['Prism Review', 'Second Look', 'Considered Reply']) {
      const option = page.getByRole('button', { name: new RegExp(name) });
      await option.click();
      await expect(option).toHaveAttribute('aria-pressed', 'true');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      for (const state of ['Active', 'Kept / reviewed']) {
        await page.getByRole('button', { name: state, exact: true }).click();
        expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
      }
      const identityFits = await page.locator('.identity-samples').evaluate(container => {
        const boundary = container.closest('.identity-strip')!.getBoundingClientRect();
        return Array.from(container.children).every(child => {
          const tile = child.getBoundingClientRect();
          return tile.left >= boundary.left && tile.right <= boundary.right;
        });
      });
      expect(identityFits, 'Every logo variant fits its identity panel').toBe(true);
      const composition = await page.locator('.exploration-shell').evaluate(shell => {
        const title = shell.querySelector('.exploration-title-row h1')!.getBoundingClientRect();
        const intro = shell.querySelector('.exploration-title-row p')!.getBoundingClientRect();
        const titleOverlaps = title.left < intro.right && title.right > intro.left && title.top < intro.bottom && title.bottom > intro.top;
        const desktop = shell.querySelector<HTMLElement>('.preview-desktop')!;
        const preview = desktop.querySelector('.concept-preview')!.getBoundingClientRect();
        const column = desktop.getBoundingClientRect();
        return { titleOverlaps, desktopFits: getComputedStyle(desktop).display === 'none' || preview.right <= column.right + 1 };
      });
      expect(composition.titleOverlaps, 'Exploration heading and introduction never overlap').toBe(false);
      expect(composition.desktopFits, 'Desktop composition is not clipped by its column').toBe(true);
    }
  });
}

test('exploration does not replace the actual draft or its review decisions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try a sample review' }).click();
  const editor = page.getByRole('textbox', { name: 'Your follow-up draft' });
  const draft = await editor.inputValue();
  await page.getByRole('button', { name: 'Keep as written', exact: true }).click();
  await page.getByRole('link', { name: 'Design exploration', exact: true }).click();
  await expect(page.locator('.exploration-shell')).toBeVisible();
  await page.getByRole('link', { name: /Back to the checker/i }).click();
  await expect(editor).toHaveValue(draft);
  await expect(page.getByRole('button', { name: /^Undo keep:/ })).toBeVisible();
  await page.reload();
  await expect(editor).toHaveValue('');
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 1001, height: 900 }, { width: 382, height: 844 }]) {
  test(`Prism decoration never intersects reading or controls at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    for (const sample of ['promises-to-confirm', 'too-many-asks', 'tone-to-reconsider']) {
      await page.getByRole('combobox', { name: 'Fictional example' }).selectOption(sample);
      await page.getByRole('button', { name: 'Try a sample review' }).click();
      const overlaps = await page.evaluate(() => {
        const decoration = document.querySelector<HTMLElement>('.workspace-orb');
        if (!decoration || getComputedStyle(decoration).display === 'none') return [];
        const accent = decoration.getBoundingClientRect();
        return Array.from(document.querySelectorAll('.editor-panel, .results-panel')).filter(panel => {
          const box = panel.getBoundingClientRect();
          return accent.left < box.right && accent.right > box.left && accent.top < box.bottom && accent.bottom > box.top;
        }).map(panel => panel.className);
      });
      expect(overlaps, `Decoration overlaps content for ${sample}`).toEqual([]);
    }
  });
}
