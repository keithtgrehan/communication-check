// Capture the real fictional-example finding, then compose a static share card.
// Requires the built app served at localhost:4173. No customer text is used.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:4173/');
  await page.getByRole('button', { name: 'Try an example' }).click();
  const review = page.locator('.finding-card').first();
  await review.waitFor();
  const excerpt = await review.screenshot();
  const card = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await card.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;background:#f8f7f3;color:#20312e;font-family:Arial,Helvetica,sans-serif}main{width:1200px;height:630px;padding:52px;position:relative;overflow:hidden;border-top:10px solid #326f68}.brand{display:flex;align-items:center;gap:12px;font-weight:700;font-size:25px}.mark{background:#326f68;color:white;border-radius:7px;width:38px;height:38px;display:grid;place-items:center}.layout{display:grid;grid-template-columns:480px 1fr;gap:32px;align-items:center;margin-top:57px}h1{font-size:57px;line-height:1.08;letter-spacing:-2.4px;margin:0 0 24px;font-weight:700}p{font-size:23px;line-height:1.5;margin:0;max-width:440px;color:#53625f}.label{font-size:12px;font-weight:700;letter-spacing:2px;color:#326f68;margin:0 0 15px}.preview img{display:block;width:100%;height:auto;border-radius:10px;box-shadow:0 12px 32px #1d3c3310}.foot{position:absolute;bottom:37px;left:52px;font-size:16px;color:#53625f}.foot strong{color:#326f68}
  </style></head><body><main><div class="brand"><span class="mark">✓</span>Communication Check</div><div class="layout"><section><h1>Send a clearer<br>customer<br>follow-up.</h1><p>Review next steps, commitments and wording. You decide what to change.</p></section><section class="preview"><div class="label">A REAL CHECK · A FICTIONAL PARTNER HANDOFF</div><img alt="Actual review of a fictional partner handoff" src="data:image/png;base64,${excerpt.toString('base64')}"></section></div><div class="foot"><strong>Try a fictional example.</strong> No sign-in needed. &nbsp; · &nbsp; communication-check.vercel.app</div></main></body></html>`);
  await card.locator('img').evaluate(image => image.decode());
  mkdirSync('web/public', { recursive: true });
  await card.screenshot({ path: 'web/public/social-preview.png' });
  console.log('Created 1200 × 630 share card from the real partner-handoff finding.');
} finally { await browser.close(); }
