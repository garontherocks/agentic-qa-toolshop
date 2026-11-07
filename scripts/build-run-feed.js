// Builds the per-test feed of the latest CI run, read by the Quality run page on victoraller.vercel.app.
// Same public contract as garontherocks/sdet-portfolio (docs/run-feed.md there): sdet-portfolio/run-feed@1.
//
// Usage: node scripts/build-run-feed.js [output-dir] [--previous-history <file>]
// Reads allure-results/*-result.json; writes <output-dir>/latest.json and <output-dir>/history.json.
//
// Skipped tests (fixme for product findings, or a test skipped on purpose in some browsers) are not replayed: the
// feed lists the tests that ran, and `knownIssues` counts the findings documented in specs/findings.md.

import fs from 'node:fs/promises';
import path from 'node:path';

export const FEED_SCHEMA = 'sdet-portfolio/run-feed@1';
export const HISTORY_SCHEMA = 'sdet-portfolio/run-history@1';
export const HISTORY_LIMIT = 20;
export const FINDINGS_URL = 'https://github.com/garontherocks/agentic-qa-toolshop/blob/main/specs/findings.md';

// Playwright project → suite and target. Order here is the order on the page.
export const SUITES = [
  { id: 'functional-e2e', name: 'Functional E2E', tool: 'Playwright + TypeScript', command: 'npm run test:e2e', projects: { 'e2e-chromium': 'Chromium', 'e2e-firefox': 'Firefox', 'e2e-webkit': 'WebKit' } },
  { id: 'api', name: 'API', tool: 'Playwright request', command: 'npm run test:api', projects: { api: 'REST' } },
  { id: 'visual', name: 'Visual regression', tool: 'Playwright screenshots', command: 'npm run test:visual', projects: { visual: 'Chromium' } },
  { id: 'a11y', name: 'Accessibility', tool: 'axe-core + Playwright', command: 'npm run test:a11y', projects: { a11y: 'Chromium · axe' } },
];

const log = (...args) => console.log('[run-feed]', ...args);

async function readJSON(file) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return null; }
}

export function normaliseStatus(value) {
  const status = String(value || '').toLowerCase();
  if (status === 'passed') return 'passed';
  if (status === 'skipped' || status === 'pending') return 'skipped';
  return 'failed';
}

export function summarise(tests) {
  const totals = { tests: tests.length, passed: 0, failed: 0, skipped: 0, flaky: 0, durationMs: 0 };
  for (const test of tests) {
    totals[test.status] += 1;
    if (test.status === 'passed' && test.retries > 0) totals.flaky += 1;
    totals.durationMs += test.durationMs;
  }
  return totals;
}

const joinNames = (names) => (names.length <= 1 ? names[0] || '' : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`);
// allure-playwright writes start/stop at the top level of each result; older writers nest them in `time`.
const timing = (result) => [result.start ?? result.time?.start, result.stop ?? result.time?.stop];
const label = (result, name) => result.labels?.find((item) => item.name === name)?.value;
const parameter = (result, name) => result.parameters?.find((item) => item.name === name)?.value;

export async function readResults(dir) {
  let files = [];
  try { files = (await fs.readdir(dir)).filter((file) => file.endsWith('-result.json')).sort(); } catch { return { tests: [], window: null }; }
  const attempts = new Map();
  for (const file of files) {
    const result = await readJSON(path.join(dir, file));
    if (!result) continue;
    const project = parameter(result, 'Project') || label(result, 'parentSuite') || '';
    const key = result.historyId || `${result.testCaseId || result.fullName || result.name}|${project}`;
    attempts.set(key, [...(attempts.get(key) || []), { ...result, project }]);
  }
  const tests = [];
  let start = null;
  let stop = null;
  for (const runs of attempts.values()) {
    runs.sort((a, b) => (timing(a)[1] ?? 0) - (timing(b)[1] ?? 0));
    for (const run of runs) {
      const [runStart, runStop] = timing(run);
      if (Number.isFinite(runStart)) start = Math.min(start ?? runStart, runStart);
      if (Number.isFinite(runStop)) stop = Math.max(stop ?? runStop, runStop);
    }
    const last = runs.at(-1);
    const [lastStart, lastStop] = timing(last);
    const measured = Number.isFinite(lastStart) && Number.isFinite(lastStop) ? lastStop - lastStart : 0;
    tests.push({
      project: last.project,
      name: last.name,
      group: label(last, 'subSuite') || label(last, 'suite') || (last.fullName || '').split(/[:#]/)[0] || 'Tests',
      status: normaliseStatus(last.status),
      durationMs: Math.max(0, Math.round(last.time?.duration ?? measured)),
      retries: runs.length - 1,
    });
  }
  const window = start != null && stop != null
    ? { startedAt: new Date(start).toISOString(), finishedAt: new Date(stop).toISOString(), wallMs: Math.round(stop - start) }
    : null;
  return { tests, window };
}

function runMetadata(env) {
  const repository = env.GITHUB_REPOSITORY || 'garontherocks/agentic-qa-toolshop';
  const id = env.GITHUB_RUN_ID || null;
  return {
    id,
    number: env.GITHUB_RUN_NUMBER ? Number(env.GITHUB_RUN_NUMBER) : null,
    attempt: env.GITHUB_RUN_ATTEMPT ? Number(env.GITHUB_RUN_ATTEMPT) : null,
    workflow: env.GITHUB_WORKFLOW || null,
    event: env.GITHUB_EVENT_NAME || null,
    branch: env.GITHUB_REF_NAME || null,
    commit: env.GITHUB_SHA || null,
    repository,
    url: id ? `${env.GITHUB_SERVER_URL || 'https://github.com'}/${repository}/actions/runs/${id}` : null,
  };
}

/** Finding IDs from the table in specs/findings.md: first cell of each data row, placeholders ("—") excluded. */
export function parseFindings(markdown) {
  const ids = [];
  for (const line of (markdown || '').split('\n')) {
    const cells = line.trim().startsWith('|') ? line.split('|').slice(1, -1).map((cell) => cell.trim()) : null;
    if (!cells?.length) continue;
    const [id] = cells;
    if (!id || id === 'ID' || /^[-:—\s]+$/.test(id)) continue;
    ids.push(id);
  }
  return ids;
}

export async function buildFeed(root, env = process.env, now = new Date()) {
  const { tests: all, window } = await readResults(path.join(root, 'allure-results'));
  const tests = all.filter((test) => test.status !== 'skipped');
  let findings = [];
  try { findings = parseFindings(await fs.readFile(path.join(root, 'specs', 'findings.md'), 'utf8')); } catch { /* no findings file */ }
  const byOrder = (a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name) || a.target.localeCompare(b.target);
  const suites = SUITES.map((definition) => {
    const own = tests
      .filter((test) => test.project in definition.projects)
      .map(({ project, ...test }) => ({ ...test, target: definition.projects[project] }))
      .sort(byOrder);
    const targets = Object.values(definition.projects).filter((name) => own.some((test) => test.target === name));
    return {
      id: definition.id,
      name: definition.name,
      tool: definition.tool,
      command: definition.command,
      target: joinNames(targets),
      targets: targets.map((name) => ({ name, totals: summarise(own.filter((test) => test.target === name)) })),
      areas: new Set(own.map((test) => test.group)).size,
      totals: summarise(own),
      tests: own,
    };
  }).filter((suite) => suite.tests.length > 0);

  const ran = suites.flatMap((suite) => suite.tests);
  return {
    schema: FEED_SCHEMA,
    generatedAt: now.toISOString(),
    run: runMetadata(env),
    window,
    totals: summarise(ran),
    knownIssues: findings.length > 0 ? { count: findings.length, url: FINDINGS_URL } : null,
    suites,
    environment: {
      ui: env.APP_URL || 'https://automationintesting.online',
      api: `${env.API_URL || env.APP_URL || 'https://automationintesting.online'}/api`,
      browsers: [...new Set(suites.filter((suite) => suite.id !== 'api').flatMap((suite) => suite.targets.map((target) => target.name.replace(' · axe', ''))))],
      runner: env.RUNNER_OS ? `${env.RUNNER_OS} ${env.RUNNER_ARCH || ''}`.trim() : `${process.platform} ${process.arch}`,
      node: process.version,
      pipeline: 'GitHub Actions',
    },
    checks: null,
    reports: { dashboard: '../', allure: '../allure/', history: './history.json' },
  };
}

export function appendHistory(previous, feed, limit = HISTORY_LIMIT) {
  const runs = Array.isArray(previous?.runs) ? previous.runs.filter((run) => run && run.id !== feed.run.id) : [];
  runs.push({ id: feed.run.id, number: feed.run.number, url: feed.run.url, commit: feed.run.commit, generatedAt: feed.generatedAt, wallMs: feed.window?.wallMs ?? null, ...feed.totals });
  return { schema: HISTORY_SCHEMA, runs: runs.slice(-limit) };
}

async function main() {
  const args = process.argv.slice(2);
  const flag = args.indexOf('--previous-history');
  const previousFile = flag >= 0 ? args[flag + 1] : null;
  const outDir = path.resolve(args.filter((_, index) => index !== flag && index !== flag + 1)[0] || 'site/run');
  const feed = await buildFeed(process.cwd());
  const previous = previousFile ? await readJSON(previousFile) : null;
  const history = appendHistory(previous?.schema === HISTORY_SCHEMA ? previous : null, feed);
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'latest.json'), `${JSON.stringify(feed, null, 2)}\n`);
  await fs.writeFile(path.join(outDir, 'history.json'), `${JSON.stringify(history, null, 2)}\n`);
  log(`${feed.totals.tests} tests in ${feed.suites.length} suites; history has ${history.runs.length} runs`);
  if (feed.totals.tests === 0) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
