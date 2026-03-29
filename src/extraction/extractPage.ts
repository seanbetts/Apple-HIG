import type { Page } from "playwright";

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

function canonicalPathFromUrl(url: string): string {
  const parsedUrl = new URL(url);
  const path = parsedUrl.pathname.replace(
    /^\/design\/human-interface-guidelines/,
    ""
  );

  return path || "/";
}

export async function extractPage(
  page: Page,
  sourceUrl: string
): Promise<ExtractedPage> {
  const extracted = await page.locator(selectors.mainArticle).evaluate((article) => {
    const textOf = (node: Element | null): string =>
      node?.textContent?.replace(/\s+/g, " ").trim() ?? "";

    const description =
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content")
        ?.trim() ?? undefined;

    const breadcrumbs = Array.from(
      document.querySelectorAll(
        'nav[aria-label="Breadcrumbs"] a, nav[aria-label="Breadcrumbs"] span'
      )
    )
      .map((node) => textOf(node))
      .filter(Boolean);

    const internalLinks = new Set<string>();
    const externalLinks = new Set<string>();

    const registerLinks = (links: HTMLAnchorElement[]) => {
      for (const link of links) {
        const href = link.href;

        if (!href) {
          continue;
        }

        if (href.includes("/design/human-interface-guidelines/")) {
          internalLinks.add(href);
        } else if (href.includes("developer.apple.com/")) {
          externalLinks.add(href);
        }
      }
    };

    const contentBlocks: ExtractedContentBlock[] = [];
    const appleChanges: Array<{ raw: string }> = [];

    const articleChildren = Array.from(article.children);
    for (const child of articleChildren) {
      if (child.tagName === "HEADER") {
        const updateText = Array.from(child.querySelectorAll("p"))
          .map((node) => textOf(node))
          .find((value) => value.startsWith("Updated "));

        if (updateText) {
          appleChanges.push({ raw: updateText });
        }

        const heading = child.querySelector("h1");
        if (heading) {
          contentBlocks.push({
            type: "heading",
            level: 1,
            text: textOf(heading)
          });
        }

        const headerParagraphs = Array.from(child.querySelectorAll(":scope > p"))
          .map((node) => textOf(node))
          .filter((value) => value && !value.startsWith("Updated "));

        for (const paragraph of headerParagraphs) {
          contentBlocks.push({
            type: "paragraph",
            text: paragraph
          });
        }

        registerLinks(Array.from(child.querySelectorAll("a")));
        continue;
      }

      if (child.tagName === "SECTION") {
        for (const node of Array.from(child.children)) {
          if (node instanceof HTMLHeadingElement) {
            contentBlocks.push({
              type: "heading",
              level: Number(node.tagName.slice(1)),
              text: textOf(node)
            });
          } else if (node instanceof HTMLParagraphElement) {
            contentBlocks.push({
              type: "paragraph",
              text: textOf(node)
            });
          } else if (node instanceof HTMLUListElement || node instanceof HTMLOListElement) {
            contentBlocks.push({
              type: "list",
              ordered: node instanceof HTMLOListElement,
              items: Array.from(node.querySelectorAll(":scope > li")).map((item) =>
                textOf(item)
              )
            });
          } else if (node instanceof HTMLTableElement) {
            contentBlocks.push({
              type: "table",
              headers: Array.from(node.querySelectorAll("thead th")).map((cell) =>
                textOf(cell)
              ),
              rows: Array.from(node.querySelectorAll("tbody tr")).map((row) =>
                Array.from(row.querySelectorAll("td")).map((cell) => textOf(cell))
              )
            });
          }
        }

        registerLinks(Array.from(child.querySelectorAll("a")));
        continue;
      }

      if (
        child instanceof HTMLElement &&
        child.matches('aside[aria-label="Related resources"]')
      ) {
        const links = Array.from(child.querySelectorAll("a")).map((link) => ({
          href: link.href,
          title: textOf(link)
        }));

        contentBlocks.push({
          type: "related-resources",
          links
        });

        registerLinks(Array.from(child.querySelectorAll("a")));
      }
    }

    return {
      title: textOf(article.querySelector("h1")),
      description,
      breadcrumbs,
      appleChanges,
      internalLinks: Array.from(internalLinks),
      externalLinks: Array.from(externalLinks),
      contentBlocks
    };
  });

  return {
    sourceUrl,
    title: extracted.title,
    description: extracted.description,
    breadcrumbs: extracted.breadcrumbs,
    appleChanges: extracted.appleChanges,
    internalLinks: extracted.internalLinks
      .map((url) => normalizeHigUrl(url))
      .filter((url) => classifyAppleUrl(url) === "hig")
      .map((url) => canonicalPathFromUrl(url))
      .sort(),
    externalLinks: extracted.externalLinks.sort(),
    contentBlocks: extracted.contentBlocks
  };
}
