import { createHash } from "node:crypto";

import type { Page } from "playwright";

import { classifyAppleUrl, normalizeHigUrl } from "./urlRules.js";
import type { DiscoveryPageRecord } from "../types/discovery.js";

function normalizeText(value: string | null | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function canonicalPathFromUrl(url: string): string {
  const parsedUrl = new URL(url);
  const path = parsedUrl.pathname.replace(
    /^\/design\/human-interface-guidelines/,
    ""
  );

  return path || "/";
}

function fallbackBreadcrumbs(sourceUrl: string, title: string): string[] {
  const canonicalPath = canonicalPathFromUrl(sourceUrl);
  const segments = canonicalPath.split("/").filter(Boolean);

  if (segments.length >= 2) {
    return ["Human Interface Guidelines", segments[0], title];
  }

  return ["Human Interface Guidelines", title];
}

function fallbackTitle(sourceUrl: string): string {
  const segments = canonicalPathFromUrl(sourceUrl).split("/").filter(Boolean);
  const leafSegment = segments.at(-1);

  if (!leafSegment) {
    return "Human Interface Guidelines";
  }

  return leafSegment
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function buildDiscoveryHash(input: {
  canonicalPath: string;
  title: string;
  description?: string;
  breadcrumbs: string[];
  appleChanges: Array<{ raw: string }>;
  internalLinks: string[];
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        canonicalPath: input.canonicalPath,
        title: input.title,
        description: input.description ?? null,
        breadcrumbs: input.breadcrumbs,
        appleChanges: input.appleChanges.map((change) => change.raw),
        internalLinks: [...input.internalLinks].sort()
      })
    )
    .digest("hex");
}

async function extractInternalLinks(page: Page, sourceUrl: string): Promise<string[]> {
  const hrefs = await page.locator("main a[href]").evaluateAll((links) =>
    links
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => Boolean(href))
  );

  return hrefs
    .map((href) => {
      try {
        return new URL(href, sourceUrl).toString();
      } catch {
        return null;
      }
    })
    .filter((url): url is string => Boolean(url))
    .filter((url) => classifyAppleUrl(url) === "hig")
    .map((url) => normalizeHigUrl(url))
    .map((url) => canonicalPathFromUrl(url))
    .filter((value) => value !== canonicalPathFromUrl(sourceUrl))
    .filter((value) => !value.includes("#"))
    .filter((value, index, values) => values.indexOf(value) === index)
    .sort();
}

export async function extractDiscoveryPage(
  page: Page,
  sourceUrl: string,
  lastSeenAt: string = new Date().toISOString()
): Promise<DiscoveryPageRecord> {
  const canonicalPath = canonicalPathFromUrl(sourceUrl);
  const titleLocator = page.locator("main .documentation-hero h1, main h1").first();
  const title =
    (await titleLocator.count()) > 0
      ? normalizeText(await titleLocator.textContent())
      : fallbackTitle(sourceUrl);

  const metaDescriptionLocator = page.locator('meta[name="description"]').first();
  const metaDescription =
    (await metaDescriptionLocator.count()) > 0
      ? await metaDescriptionLocator.getAttribute("content")
      : null;
  const heroDescriptionLocator = page
    .locator("main .documentation-hero .abstract")
    .first();
  const heroDescription =
    (await heroDescriptionLocator.count()) > 0
      ? await heroDescriptionLocator.textContent()
      : null;
  const description =
    metaDescription?.trim() ??
    normalizeText(heroDescription) ??
    undefined;

  const breadcrumbs = (await page
    .locator('main nav[aria-label="Breadcrumbs"] a, main nav[aria-label="Breadcrumbs"] span')
    .allTextContents())
    .map(normalizeText)
    .filter(Boolean);

  const rawUpdateText =
    (await page.locator("main p, main li, main div").allTextContents())
      .map(normalizeText)
      .find((value) => value.startsWith("Updated ")) ?? null;

  const appleChanges = rawUpdateText ? [{ raw: rawUpdateText }] : [];
  const internalLinks = await extractInternalLinks(page, sourceUrl);

  return {
    url: sourceUrl,
    canonicalPath,
    title,
    ...(description ? { description } : {}),
    breadcrumbs:
      breadcrumbs.length > 0 ? breadcrumbs : fallbackBreadcrumbs(sourceUrl, title),
    appleChanges,
    internalLinks,
    discoveryHash: buildDiscoveryHash({
      canonicalPath,
      title,
      description,
      breadcrumbs:
        breadcrumbs.length > 0 ? breadcrumbs : fallbackBreadcrumbs(sourceUrl, title),
      appleChanges,
      internalLinks
    }),
    lastSeenAt
  };
}
