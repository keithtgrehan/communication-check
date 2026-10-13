import { test, expect } from '@playwright/test';

const production = 'https://communication-check.vercel.app/';
const title = 'Communication Check | Clearer customer follow-ups';

test('initial HTML provides a complete public share card without running JavaScript', async ({ request }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/html');
  const html = await response.text();
  expect(html).toContain(`<title>${title}</title>`);
  expect(html).toContain(`<link rel="canonical" href="${production}"`);
  for (const [property, content] of Object.entries({
    'og:title': title, 'og:url': production, 'og:type': 'website',
    'og:image': `${production}social-preview.png`, 'og:image:type': 'image/png',
    'og:image:width': '1200', 'og:image:height': '630',
  })) expect(html).toContain(`property="${property}" content="${content}"`);
  expect(html).toMatch(/property="og:description" content="Review next steps, commitments and wording/);
  expect(html).toMatch(/property="og:image:alt" content="Communication Check/);
  expect(html).toContain("connect-src 'none'");
});

test('LinkedIn crawler is allowed while generic indexing stays restricted', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toMatch(/User-agent: LinkedInBot\s+Allow: \/\s+User-agent: \*\s+Disallow: \//);
  const page = await request.get('/', { headers: { 'User-Agent': 'LinkedInBot/1.0' } });
  expect(page.status()).toBe(200);
  expect(await page.text()).toContain('property="og:image"');
  expect(page.headers()['x-robots-tag']).toContain('noindex');
});

test('share image is unauthenticated PNG with the declared dimensions', async ({ request }) => {
  const response = await request.get('/social-preview.png');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/png');
  const bytes = await response.body();
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(630);
  expect(bytes.length).toBeLessThan(5 * 1024 * 1024);
});
