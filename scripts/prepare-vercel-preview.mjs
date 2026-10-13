// Package only the reviewed static build; never upload the repository or drafts.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const destination = resolve('work/vercel-preview-2026-10-11');
mkdirSync(`${destination}/.vercel/output`, { recursive: true });
rmSync(`${destination}/.vercel/output/static`, { recursive: true, force: true });
cpSync('web/dist', `${destination}/.vercel/output/static`, { recursive: true });
writeFileSync(`${destination}/.vercel/output/config.json`, readFileSync('docs/VERCEL_OUTPUT_CONFIG.json'));
writeFileSync(`${destination}/.vercel/project.json`, JSON.stringify({
  projectId: 'prj_NW3ec5feWa0ljV2AYyNb12psxi1K',
  orgId: 'team_YKDt6rh9Hs4SZSTB3uzQaXmG',
  projectName: 'communication-check',
}, null, 2));
console.log(`Prepared static preview package at ${destination}. No deployment performed.`);
