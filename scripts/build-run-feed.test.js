import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { appendHistory, buildFeed, FEED_SCHEMA, FINDINGS_URL, HISTORY_SCHEMA, parseFindings } from './build-run-feed.js';

function result(root, file, { project, name, group, status, start, duration, historyId }) {
  const dir = path.join(root, 'allure-results');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${file}-result.json`), JSON.stringify({
    historyId: historyId ?? `${name}|${project}`, name, status,
    labels: [{ name: 'subSuite', value: group }], parameters: [{ name: 'Project', value: project }],
    time: { start, stop: start + duration, duration },
  }));
}

test('maps projects to suites and targets, keeps last attempts and the test window', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agentic-feed-'));
  test.after(() => fs.rmSync(root, { recursive: true, force: true }));
  result(root, 'a', { project: 'e2e-chromium', name: 'TC-01: checkout', group: 'Checkout', status: 'failed', start: 0, duration: 900, historyId: 'c' });
  result(root, 'b', { project: 'e2e-chromium', name: 'TC-01: checkout', group: 'Checkout', status: 'passed', start: 1000, duration: 800, historyId: 'c' });
  result(root, 'c', { project: 'e2e-webkit', name: 'TC-01: checkout', group: 'Checkout', status: 'passed', start: 0, duration: 1200 });
  result(root, 'd', { project: 'api', name: 'API-01: list products', group: 'Products API', status: 'broken', start: 100, duration: 50 });
  result(root, 'e', { project: 'visual', name: 'VR-01: login form', group: 'Forms', status: 'passed', start: 200, duration: 300 });
  result(root, 'f', { project: 'a11y', name: 'A11Y-01: home', group: 'Core pages', status: 'skipped', start: 300, duration: 0 });

  const feed = await buildFeed(root, { GITHUB_RUN_ID: '9', GITHUB_RUN_NUMBER: '3', GITHUB_REPOSITORY: 'garontherocks/agentic-qa-toolshop' }, new Date('2026-11-07T00:00:00Z'));
  assert.equal(feed.schema, FEED_SCHEMA);
  assert.deepEqual(feed.suites.map((suite) => suite.id), ['functional-e2e', 'api', 'visual']);
  const [e2e, api, visual, a11y] = feed.suites;
  assert.equal(e2e.target, 'Chromium and WebKit');
  assert.deepEqual(e2e.targets.map((t) => [t.name, t.totals.flaky]), [['Chromium', 1], ['WebKit', 0]]);
  assert.equal(api.tests[0].status, 'failed');
  assert.equal(visual.target, 'Chromium');
  // Skipped tests are not replayed; known issues come from specs/findings.md (none in this fixture).
  assert.equal(a11y, undefined);
  assert.deepEqual(feed.totals, { tests: 4, passed: 3, failed: 1, skipped: 0, flaky: 1, durationMs: 2350 });
  assert.equal(feed.knownIssues, null);
  assert.deepEqual(feed.window, { startedAt: '1970-01-01T00:00:00.000Z', finishedAt: '1970-01-01T00:00:01.800Z', wallMs: 1800 });
  assert.deepEqual(feed.environment.browsers, ['Chromium', 'WebKit']);
  assert.equal(feed.run.url, 'https://github.com/garontherocks/agentic-qa-toolshop/actions/runs/9');
});

test('history keeps one entry per run and the last 20', () => {
  const feed = { run: { id: '21' }, generatedAt: 't', window: { wallMs: 5 }, totals: { tests: 1, passed: 1, failed: 0, skipped: 0, flaky: 0, durationMs: 5 } };
  const previous = { schema: HISTORY_SCHEMA, runs: Array.from({ length: 20 }, (_, i) => ({ id: String(i + 1) })) };
  const history = appendHistory(previous, feed);
  assert.equal(history.runs.length, 20);
  assert.equal(history.runs.at(-1).id, '21');
  assert.equal(history.runs[0].id, '2');
});

test('an empty run produces an empty feed', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agentic-feed-empty-'));
  test.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const feed = await buildFeed(root, {});
  assert.equal(feed.totals.tests, 0);
  assert.equal(feed.window, null);
  assert.equal(feed.knownIssues, null);
});

test('reads top-level start/stop as written by allure-playwright', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agentic-feed-top-'));
  test.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dir = path.join(root, 'allure-results');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'a-result.json'), JSON.stringify({
    historyId: 'seed', name: 'home page lists products', status: 'passed', start: 1000, stop: 3500,
    labels: [{ name: 'subSuite', value: 'Seed' }], parameters: [{ name: 'Project', value: 'e2e-chromium' }],
  }));
  const feed = await buildFeed(root, {});
  assert.equal(feed.suites[0].tests[0].durationMs, 2500);
  assert.equal(feed.window.wallMs, 2500);
});

test('known issues count the findings table rows, not skipped tests', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agentic-feed-findings-'));
  test.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'specs'));
  fs.writeFileSync(path.join(root, 'specs', 'findings.md'), [
    '# Product findings', '', '| ID | Area | What | Evidence | Test |', '|---|---|---|---|---|',
    '| MSG-ANON-READ | Contact | a | b | API-12 |', '| A11Y-MSG-LABEL | Contact | a | b | A11Y-04 |', '', 'Footer text.',
  ].join('\n'));
  result(root, 'a', { project: 'e2e-firefox', name: 'TC-01: send', group: 'Contact', status: 'skipped', start: 0, duration: 0 });
  result(root, 'b', { project: 'e2e-chromium', name: 'TC-01: send', group: 'Contact', status: 'passed', start: 0, duration: 10 });
  const feed = await buildFeed(root, {});
  assert.deepEqual(feed.knownIssues, { count: 2, url: FINDINGS_URL });
  assert.equal(feed.totals.tests, 1);
});

test('the placeholder row of an empty findings table is not a finding', () => {
  assert.deepEqual(parseFindings('| ID | Area |\n|---|---|\n| — | — |\n'), []);
});
