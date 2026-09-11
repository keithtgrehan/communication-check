import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const HANDOFF_FILES = Object.freeze(['docs/PRODUCT_BRIEF.md', 'docs/PROGRESS.md']);
const BRANCH = 'codex/communication-check-mvp';
const REMOTE = 'https://github.com/keithtgrehan/communication-check.git';
const DONOR_FILES = ['web/src/App.jsx', 'web/src/styles.css', 'web/src/resultViewModel.js', 'web/vite.config.js', 'web/package.json', 'web/index.html'];

function git(args, root = ROOT) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function assertPlainFile(path) {
  if (!lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) throw new Error(`Expected a regular file: ${path}`);
}

export function buildHandoff(root, { commit, branch, now = new Date().toISOString() }) {
  const sections = HANDOFF_FILES.map(path => {
    assertPlainFile(join(root, path));
    const content = readFileSync(join(root, path), 'utf8');
    // A narrow leak guard supplements the allowlist; the lead still reviews these two documents.
    if (/-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|sk-[A-Za-z0-9_-]{20,})/.test(content)) {
      throw new Error(`Possible credential in handoff source: ${path}`);
    }
    return { path, content, sha256: createHash('sha256').update(content).digest('hex') };
  });
  return '# Communication Check — current project context\n\n'
    + `Generated: ${now}\nRepository: keithtgrehan/communication-check (private)\nBranch: ${branch}\nCheckout HEAD: ${commit}\n\n`
    + 'This is a generated snapshot of the two current working files below. Their content hashes identify the exact copies; uncommitted document edits may be newer than HEAD. It contains no evaluation corpus or source-code export. This is a context handoff, not proof of implementation or a live Project Sources connection.\n\n'
    + sections.map(({ path, content, sha256 }) => `---\n\nSource: ${path}\nSHA-256: ${sha256}\n\n${content.trim()}\n`).join('\n');
}

export function validatePush(remoteName, remoteUrl, input) {
  const urls = [REMOTE, REMOTE.replace(/\.git$/, ''), 'git@github.com:keithtgrehan/communication-check.git'];
  if (remoteName !== 'origin' || !urls.includes(remoteUrl)) throw new Error('Push refused: target must be origin for keithtgrehan/communication-check.');
  for (const line of input.trim().split('\n').filter(Boolean)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length !== 4) throw new Error('Push refused: malformed ref update.');
    const [localRef, localSha, remoteRef] = parts;
    if (localRef === '(delete)' || /^0+$/.test(localSha)) throw new Error('Push refused: branch deletion is outside the approved workflow.');
    if (localRef !== `refs/heads/${BRANCH}` || remoteRef !== `refs/heads/${BRANCH}`) throw new Error(`Push refused: only ${BRANCH} is authorised after baseline setup.`);
  }
}

export function checkSnapshot(root = ROOT) {
  const donor = join(root, 'reference/vibe-signal');
  const source = JSON.parse(readFileSync(join(donor, 'SOURCE.json'), 'utf8'));
  if (source.commit !== '000ba0685f961e253b0d34c0b02539ac897356e9' || source.runtime !== false) throw new Error('Unexpected source baseline.');
  const names = source.files.map(file => file.path).sort();
  if (JSON.stringify(names) !== JSON.stringify([...DONOR_FILES].sort())) throw new Error('Source file allowlist changed.');
  for (const file of source.files) {
    assertPlainFile(join(donor, file.path));
    const bytes = readFileSync(join(donor, file.path));
    const blob = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    if (blob !== file.gitBlob) throw new Error(`Upstream blob mismatch: ${file.path}`);
  }
  return source.files.length;
}

function handoff() {
  const directory = join(ROOT, '.handoff');
  if (existsSync(directory) && lstatSync(directory).isSymbolicLink()) throw new Error('Refusing a symlink handoff directory.');
  mkdirSync(directory, { recursive: true });
  const output = join(directory, 'CHATGPT_CONTEXT.md');
  if (existsSync(output) && lstatSync(output).isSymbolicLink()) throw new Error('Refusing a symlink handoff output.');
  writeFileSync(output, buildHandoff(ROOT, { commit: git(['rev-parse', 'HEAD']), branch: git(['branch', '--show-current']) }));
  console.log(`Updated ${output} from two allowlisted documents. Nothing was transmitted.`);
}

export function installGitHooks(root = ROOT) {
  let configured = '';
  try { configured = git(['config', '--get', 'core.hooksPath'], root); } catch (error) { if (error.status !== 1) throw error; }
  if (configured && configured !== '.githooks') throw new Error('Existing Git hooks configuration found; preserve it and integrate manually.');
  if (!configured) {
    const hooks = resolve(root, git(['rev-parse', '--git-path', 'hooks'], root));
    // Changing hooksPath affects every hook, including checks unrelated to ours.
    for (const entry of existsSync(hooks) ? readdirSync(hooks, { withFileTypes: true }) : []) {
      if (!entry.name.endsWith('.sample') && (entry.isFile() || entry.isSymbolicLink())) {
        throw new Error(`Existing ${entry.name} hook found; preserve it and integrate manually.`);
      }
    }
  }
  for (const name of ['post-commit', 'pre-push']) chmodSync(join(root, '.githooks', name), 0o755);
  git(['config', '--local', 'core.hooksPath', '.githooks'], root);
}

function setup() {
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Node.js 22 or later is required.');
  installGitHooks();
  handoff();
  console.log('Repository-local hooks installed; global settings unchanged.');
}

function validate() {
  const required = ['AGENTS.md', 'docs/PRODUCT_BRIEF.md', 'docs/PROGRESS.md', 'docs/IMPLEMENTATION_PLAN.md', 'docs/WORKFLOW.md', 'docs/GOAL_PROMPT.md', 'docs/REUSE_LEDGER.md', 'docs/CHATGPT_PROJECT_INSTRUCTIONS.md'];
  for (const path of required) assertPlainFile(join(ROOT, path));
  if (git(['branch', '--show-current']) !== BRANCH) throw new Error(`Expected branch ${BRANCH}.`);
  if (git(['remote', 'get-url', 'origin']) !== REMOTE) throw new Error('Unexpected origin.');
  if (git(['config', '--get', 'core.hooksPath']) !== '.githooks') throw new Error('Run npm run setup to install local hooks.');
  const count = checkSnapshot();
  buildHandoff(ROOT, { commit: git(['rev-parse', 'HEAD']), branch: BRANCH });
  console.log(`Setup validated: correct branch/remote, working documents, local hooks and ${count} exact source blobs. Run the product checks separately with npm run validate.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const command = process.argv[2];
    if (command === 'handoff') handoff();
    else if (command === 'setup') setup();
    else if (command === 'validate') validate();
    else if (command === 'check-push') validatePush(process.argv[3], process.argv[4], readFileSync(0, 'utf8'));
    else throw new Error('Use setup, handoff, validate or check-push.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
