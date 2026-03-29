import { normalizedPageSchema, type NormalizedPage } from "../types/content.js";

interface RawAppleChange {
  raw: string;
}

interface RawPage {
  sourceUrl: string;
  title: string;
  description?: string;
  breadcrumbs: string[];
  appleChanges: RawAppleChange[];
  internalLinks: string[];
  externalLinks: string[];
  contentBlocks: NormalizedPage["contentBlocks"];
}

function canonicalPathFromSourceUrl(sourceUrl: string): string {
  const url = new URL(sourceUrl);
  const path = url.pathname.replace(/^\/design\/human-interface-guidelines/, "");
  return path || "/";
}

function normalizeAppleChange(change: RawAppleChange) {
  const updatedMatch = /^Updated ([A-Za-z]+ \d{1,2}, \d{4})$/.exec(change.raw);

  if (!updatedMatch) {
    return {
      label: "Updated",
      raw: change.raw
    };
  }

  const date = new Date(updatedMatch[1]);

  return {
    label: "Updated",
    date: date.toISOString().slice(0, 10),
    raw: change.raw
  };
}

export function normalizePage(rawPage: RawPage): NormalizedPage {
  const normalized: NormalizedPage = {
    sourceUrl: rawPage.sourceUrl,
    canonicalPath: canonicalPathFromSourceUrl(rawPage.sourceUrl),
    title: rawPage.title,
    description: rawPage.description,
    breadcrumbs: rawPage.breadcrumbs,
    section:
      rawPage.breadcrumbs.length > 1
        ? rawPage.breadcrumbs[rawPage.breadcrumbs.length - 2]
        : undefined,
    appleChanges: rawPage.appleChanges.map(normalizeAppleChange),
    internalLinks: Array.from(new Set(rawPage.internalLinks)).sort(),
    externalLinks: Array.from(new Set(rawPage.externalLinks)).sort(),
    contentBlocks: rawPage.contentBlocks
  };

  return normalizedPageSchema.parse(normalized);
}
