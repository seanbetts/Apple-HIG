import type { NormalizedPage } from "../types/content.js";

function renderStringList(key: string, values: string[]): string[] {
  return [ `${key}:`, ...values.map((value) => `  - ${value}`) ];
}

export function renderFrontmatter(page: NormalizedPage): string {
  const lines: string[] = [
    "---",
    `title: ${page.title}`,
    `source_url: ${page.sourceUrl}`,
    `canonical_path: ${page.canonicalPath}`
  ];

  if (page.description) {
    lines.push(`description: ${page.description}`);
  }

  if (page.section) {
    lines.push(`section: ${page.section}`);
  }

  lines.push(...renderStringList("breadcrumbs", page.breadcrumbs));

  lines.push("apple_changes:");
  for (const change of page.appleChanges) {
    lines.push(`  - label: ${change.label}`);
    if (change.date) {
      lines.push(`    date: ${change.date}`);
    }
    lines.push(`    raw: ${change.raw}`);
  }

  lines.push(...renderStringList("internal_links", page.internalLinks));
  lines.push(...renderStringList("external_links", page.externalLinks));
  lines.push("---");

  return lines.join("\n");
}
