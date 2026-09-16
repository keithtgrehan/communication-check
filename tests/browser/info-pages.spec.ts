import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { checkDraft } from '../../web/src/engine';

const pages = [
  { hash: '#/about', title: 'About Communication Check' },
  { hash: '#/video-demo', title: 'Video Demo' },
];

test('About illustration matches an actual check and Video is a static walkthrough', async ({ page }) => {
  await page.goto('/#/about');
  const quote = 'We guarantee that the custom integration will be ready by Friday.';
  const finding = checkDraft(quote).findings[0];
  expect(finding.ruleId).toBe('commitment-confirmation');
  expect(quote.slice(finding.start, finding.end)).toBe(finding.quote);
  await expect(page.getByRole('main').locator('blockquote')).toHaveText(finding.quote);
  await expect(page.getByText(finding.prompt, { exact: true })).toBeVisible();
  await expect(page.getByText(/Fictional example.*illustration of the workflow/i)).toBeVisible();
  await expect(page.getByRole('main').getByRole('button')).toHaveCount(0);
  await page.getByRole('navigation').getByRole('link', { name: 'Video Demo' }).click();
  for (const text of ['Start with a fictional example', 'Read the wording in context', 'Decide what to keep or change']) {
    await expect(page.getByRole('heading', { name: new RegExp(text) })).toBeVisible();
  }
  await expect(page.locator('iframe, video')).toHaveCount(0);
  await expect(page.getByRole('main').getByRole('button')).toHaveCount(0);
  await page.getByRole('link', { name: 'Try the checker', exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Your follow-up draft' });
  await editor.fill('A fictional draft to preserve.');
  await page.getByRole('navigation').getByRole('link', { name: 'Video Demo' }).click();
  await page.getByRole('link', { name: 'Try the checker', exact: true }).click();
  await expect(editor).toHaveValue('A fictional draft to preserve.');
});

for (const width of [320, 382, 1440]) {
  for (const info of pages) {
    test(`${info.title} supports direct entry and accessible layout at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${info.hash}`);
      await expect(page.getByRole('heading', { level: 1, name: info.title, exact: true })).toBeVisible();
      await expect(page).toHaveTitle(new RegExp(info.title));
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('textbox', { name: 'Your follow-up draft' })).toHaveCount(0);
      const nav = page.getByRole('navigation');
      await expect(nav.getByRole('link', { name: info.title, exact: true })).toHaveAttribute('aria-current', 'page');
      const readme = page.getByRole('link', { name: /readme/i });
      await expect(readme).toHaveAttribute('href', 'https://github.com/keithtgrehan/communication-check#readme');
      await expect(readme).toHaveAttribute('rel', /noreferrer/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await expect(page.locator('iframe')).toHaveCount(0);
      if (info.hash === '#/video-demo') await expect(page.getByText(/walkthrough coming soon/i)).toBeVisible();
    });
  }
}

test('navigation and browser history preserve the draft, both reviews and Keep decisions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try a sample review' }).click();
  const draft = await page.getByRole('textbox', { name: 'Your follow-up draft' }).inputValue();
  await page.getByRole('button', { name: 'Keep as written' }).click();
  await page.getByRole('tab', { name: /Tone cues/ }).click();
  await page.getByRole('radio', { name: 'Warm', exact: true }).check();
  await page.getByRole('button', { name: 'Keep as written' }).click();
  const nav = page.getByRole('navigation');
  await nav.getByRole('link', { name: 'About Communication Check', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'About Communication Check', exact: true })).toBeFocused();
  await nav.getByRole('link', { name: 'Video Demo', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Video Demo', exact: true })).toBeFocused();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'About Communication Check', exact: true })).toBeFocused();
  await page.goForward();
  await expect(page.getByRole('heading', { level: 1, name: 'Video Demo', exact: true })).toBeFocused();
  await page.getByRole('link', { name: 'Communication Check', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Your follow-up draft' })).toHaveValue(draft);
  await expect(page.getByRole('radio', { name: 'Warm', exact: true })).toBeChecked();
  await expect(page.getByRole('button', { name: /^Undo keep:/ })).toBeVisible();
  await page.getByRole('tab', { name: 'Clarity & commitments', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Undo keep:/ })).toBeVisible();
  await page.getByRole('button', { name: /^Undo keep:/ }).click();
  await page.getByRole('button', { name: 'Edit this wording', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Your follow-up draft' })).toBeFocused();
});

test('information navigation loads no third-party content and does not persist a draft', async ({ page }) => {
  await page.goto('/');
  const canary = 'FICTIONAL_INFO_NAV_7319 Please send the list by Thursday.';
  await page.getByRole('textbox', { name: 'Your follow-up draft' }).fill(canary);
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  for (const info of pages) {
    await page.getByRole('navigation').getByRole('link', { name: info.title, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: info.title })).toBeVisible();
    expect(page.url()).not.toContain('FICTIONAL_INFO_NAV');
  }
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, cookies: document.cookie })))
    .toEqual({ local: {}, session: {}, cookies: '' });
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Video Demo', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Communication Check', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Your follow-up draft' })).toHaveValue('');
});

test('navigation and information text remain usable at 200 percent text size', async ({ page }) => {
  await page.setViewportSize({ width: 382, height: 1000 });
  await page.goto('/#/about');
  await page.evaluate(() => {
    for (const element of document.querySelectorAll<HTMLElement>('h1, h2, h3, p, li, a')) {
      element.style.fontSize = `${parseFloat(getComputedStyle(element).fontSize) * 2}px`;
    }
  });
  for (const info of pages) {
    await page.getByRole('navigation').getByRole('link', { name: info.title, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: info.title })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(page.getByRole('link', { name: /readme/i })).toBeVisible();
  }
});
