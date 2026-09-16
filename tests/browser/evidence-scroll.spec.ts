import { test, expect } from '@playwright/test';

for (const { width, zoom } of [{ width: 320, zoom: 1 }, { width: 1440, zoom: 1 }, { width: 1440, zoom: 2 }]) {
  for (const position of ['beginning', 'middle', 'end'] as const) {
    test(`selected evidence is visible at the ${position} of a long draft at ${width}px and ${zoom * 100}% content zoom`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto('/');
      if (zoom !== 1) await page.evaluate(value => { document.documentElement.style.zoom = String(value); }, zoom);
      const editor = page.getByRole('textbox', { name: 'Your follow-up draft' });
      const promise = 'We guarantee the custom integration will be ready by Friday.';
      // Both manual line breaks and browser-wrapped lines precede/follow evidence.
      const paragraph = 'The fictional customer team reviewed the workspace during our session. The notes describe their existing process and provide context for our next conversation.\n\n';
      const before = position === 'beginning' ? '' : paragraph.repeat(position === 'middle' ? 22 : 45);
      const after = position === 'end' ? '' : paragraph.repeat(position === 'middle' ? 23 : 45);
      const draft = `${before}${promise}\n\n${after}`;
      await editor.fill(draft);
      await page.getByRole('button', { name: 'Check draft', exact: true }).click();
      await expect(page.locator('.finding-card')).toHaveCount(1);

      for (const initialScroll of ['top', 'bottom'] as const) {
        await editor.evaluate((field: HTMLTextAreaElement, scroll) => {
          field.scrollTop = scroll === 'top' ? 0 : field.scrollHeight;
        }, initialScroll);
        await page.getByRole('button', { name: 'Edit this wording' }).click();
        await expect(editor).toBeFocused();
        await expect(editor).toBeInViewport({ ratio: 0.95 });
        expect(await editor.evaluate((field: HTMLTextAreaElement) => ({
          start: field.selectionStart,
          end: field.selectionEnd,
          quote: field.value.slice(field.selectionStart, field.selectionEnd),
        }))).toEqual({ start: before.length, end: before.length + promise.length, quote: promise });
        await expect(page.locator('.evidence-measurement')).toHaveCount(0);

        // Native caret navigation reveals an offscreen endpoint. If selection is
        // already visible, collapsing it to either endpoint needs no scrolling.
        for (const key of ['ArrowLeft', 'ArrowRight']) {
          if (key === 'ArrowRight') await page.getByRole('button', { name: 'Edit this wording' }).click();
          const selectedScroll = await editor.evaluate((field: HTMLTextAreaElement) => field.scrollTop);
          await page.keyboard.press(key);
          await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
          const caretScroll = await editor.evaluate((field: HTMLTextAreaElement) => field.scrollTop);
          expect(Math.abs(caretScroll - selectedScroll)).toBeLessThanOrEqual(1);
        }
      }
      await expect(editor).toHaveValue(draft);
    });
  }
}
