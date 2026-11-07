import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/** WCAG 2.1 A/AA scan. Exclude only third-party embeds the suite does not own (e.g. the map iframe). */
export async function scanA11y(page: Page, options: { include?: string; exclude?: string[] } = {}) {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  if (options.include) builder = builder.include(options.include);
  for (const selector of options.exclude ?? []) builder = builder.exclude(selector);
  const results = await builder.analyze();
  return {
    violations: results.violations,
    /** Compact form for assertions and reports: rule id, impact and how many nodes. */
    summary: results.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length })),
  };
}
