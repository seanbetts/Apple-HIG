import type { NormalizedPage } from "../types/content.js";

function renderScalar(value: string): string {
  return JSON.stringify(value);
}

function renderStringList(key: string, values: string[]): string[] {
  if (values.length === 0) {
    return [`${key}: []`];
  }

  return [`${key}:`, ...values.map((value) => `  - ${renderScalar(value)}`)];
}

export function renderFrontmatter(page: NormalizedPage): string {
  const lines: string[] = [
    "---",
    `title: ${renderScalar(page.title)}`,
    `source_url: ${renderScalar(page.sourceUrl)}`,
    `canonical_path: ${renderScalar(page.canonicalPath)}`
  ];

  if (page.description) {
    lines.push(`description: ${renderScalar(page.description)}`);
  }

  if (page.section) {
    lines.push(`section: ${renderScalar(page.section)}`);
  }

  lines.push(...renderStringList("breadcrumbs", page.breadcrumbs));

  if (page.appleChanges.length === 0) {
    lines.push("apple_changes: []");
  } else {
    lines.push("apple_changes:");
  }

  for (const change of page.appleChanges) {
    lines.push(`  - label: ${renderScalar(change.label)}`);
    if (change.date) {
      lines.push(`    date: ${renderScalar(change.date)}`);
    }
    lines.push(`    raw: ${renderScalar(change.raw)}`);
  }

  lines.push(...renderStringList("internal_links", page.internalLinks));
  lines.push(...renderStringList("external_links", page.externalLinks));
  lines.push("---");

  return lines.join("\n");
}
