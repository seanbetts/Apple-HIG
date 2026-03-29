import type { Locator, Page } from "playwright";

import { classifyAppleUrl, normalizeHigUrl } from "../discovery/urlRules.js";
import { selectors } from "./selectors.js";

interface ExtractedLink {
  href: string;
  title: string;
}

type ExtractedContentBlock =
  | {
      type: "heading";
      level: number;
      text: string;
    }
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "list";
      ordered: boolean;
      items: string[];
    }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
    }
  | {
      type: "related-resources";
      links: ExtractedLink[];
    };

export interface ExtractedPage {
  sourceUrl: string;
  title: string;
  description?: string;
  breadcrumbs: string[];
  appleChanges: Array<{ raw: string }>;
  internalLinks: string[];
  externalLinks: string[];
  contentBlocks: ExtractedContentBlock[];
}

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

async function extractLinksFromContent(
  locator: Locator,
  sourceUrl: string
): Promise<Array<{ href: string; text: string }>> {
  const linkLocators = await locator.locator("a[href]").all();
  const links: Array<{ href: string; text: string }> = [];

  for (const linkLocator of linkLocators) {
    const href = await linkLocator.getAttribute("href");

    if (!href) {
      continue;
    }

    links.push({
      href: new URL(href, sourceUrl).toString(),
      text: normalizeText(await linkLocator.textContent())
    });
  }

  return links;
}

async function extractStructuredBlocks(locator: Locator): Promise<ExtractedContentBlock[]> {
  const tagName = await locator.evaluate((node) => node.tagName);

  if (/^H[1-6]$/.test(tagName)) {
    return [
      {
        type: "heading",
        level: Number(tagName.slice(1)),
        text: normalizeText(await locator.textContent())
      }
    ];
  }

  if (tagName === "P") {
    return [
      {
        type: "paragraph",
        text: normalizeText(await locator.textContent())
      }
    ];
  }

  if (tagName === "UL" || tagName === "OL") {
    return [
      {
        type: "list",
        ordered: tagName === "OL",
        items: (await locator.locator(":scope > li").allTextContents()).map(normalizeText)
      }
    ];
  }

  if (tagName === "TABLE") {
    const rowLocators = await locator.locator("tbody tr").all();
    const rows: string[][] = [];

    for (const rowLocator of rowLocators) {
      rows.push(
        (await rowLocator.locator("td").allTextContents()).map(normalizeText)
      );
    }

    return [
      {
        type: "table",
        headers: (await locator.locator("thead th").allTextContents()).map(normalizeText),
        rows
      }
    ];
  }

  if (
    await locator.evaluate((node) =>
      node instanceof HTMLElement &&
      node.matches('aside[aria-label="Related resources"]')
    )
  ) {
    const links = await extractLinksFromContent(locator, "https://developer.apple.com");

    return [
      {
        type: "related-resources",
        links: links.map((link) => ({
          href: link.href,
          title: link.text
        }))
      }
    ];
  }

  if (tagName === "SECTION") {
    const childLocators = await locator.locator(":scope > *").all();
    const blocks: ExtractedContentBlock[] = [];

    for (const childLocator of childLocators) {
      blocks.push(...(await extractStructuredBlocks(childLocator)));
    }

    return blocks;
  }

  return [];
}

export async function extractPage(
  page: Page,
  sourceUrl: string
): Promise<ExtractedPage> {
  await page.waitForSelector("main");
  const docsContentRoot = page.locator(
    "main .doc-content-wrapper .primary-content .content"
  );
  const articleContentRoot = page.locator(selectors.mainArticle);

  const contentRoot =
    (await docsContentRoot.count()) > 0 ? docsContentRoot.first() : articleContentRoot.first();

  await contentRoot.waitFor();

  const title =
    (await page
      .locator("main .documentation-hero h1, main h1")
      .first()
      .textContent())?.replace(/\s+/g, " ").trim() ?? "";

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
    heroDescription?.replace(/\s+/g, " ").trim() ??
    undefined;

  const breadcrumbs = (await page
    .locator('main nav[aria-label="Breadcrumbs"] a, main nav[aria-label="Breadcrumbs"] span')
    .allTextContents())
    .map(normalizeText)
    .filter(Boolean);

  const rawUpdateText =
    (await page
      .locator("main p, main li, main div")
      .allTextContents())
      .map(normalizeText)
      .find((value) => value.startsWith("Updated ")) ?? null;

  const allLinks = await extractLinksFromContent(contentRoot, sourceUrl);

  const childLocators = await contentRoot.locator(":scope > *").all();
  const structuredBlocks: ExtractedContentBlock[] = [];

  for (const childLocator of childLocators) {
    structuredBlocks.push(...(await extractStructuredBlocks(childLocator)));
  }

  return {
    sourceUrl,
    title,
    description,
    breadcrumbs:
      breadcrumbs.length > 0 ? breadcrumbs : fallbackBreadcrumbs(sourceUrl, title),
    appleChanges: rawUpdateText ? [{ raw: rawUpdateText }] : [],
    internalLinks: allLinks
      .map((link) => normalizeHigUrl(link.href))
      .filter((url) => classifyAppleUrl(url) === "hig")
      .map((url) => normalizeHigUrl(url))
      .map((url) => canonicalPathFromUrl(url))
      .filter((value) => value !== canonicalPathFromUrl(sourceUrl))
      .filter((value) => !value.includes("#"))
      .filter((value, index, values) => values.indexOf(value) === index)
      .sort(),
    externalLinks: allLinks
      .map((link) => link.href)
      .filter((url) => classifyAppleUrl(url) !== "hig" && url.includes("developer.apple.com/"))
      .filter((value, index, values) => values.indexOf(value) === index)
      .sort(),
    contentBlocks: [
      {
        type: "heading",
        level: 1,
        text: title
      },
      ...(description
        ? [
            {
              type: "paragraph" as const,
              text: description
            }
          ]
        : []),
      ...structuredBlocks
    ]
  };
}
