import { chromium, type Browser, type Page } from "playwright";

import { classifyAppleUrl, normalizeHigUrl } from "./urlRules.js";

export interface DiscoveryProgress {
  visitedCount: number;
  queuedCount: number;
  discoveredCount: number;
  currentUrl: string;
  discoveredUrls: string[];
}

async function waitForHydratedContent(page: Page): Promise<void> {
  await page.waitForSelector("main");
  await page
    .waitForFunction(() => {
      const main = document.querySelector("main");

      if (!main) {
        return false;
      }

      return (
        main.querySelectorAll("a[href]").length > 1 ||
        main.querySelector(".doc-content-wrapper, article, .documentation-hero") !== null
      );
    })
    .catch(() => undefined);
}

async function collectHigLinks(page: Page): Promise<string[]> {
  const scope = page.locator("main");
  const hrefs = await scope.locator("a[href]").evaluateAll((links) =>
    links
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => Boolean(href))
  );

  const urls = hrefs
    .map((href) => {
      try {
        return new URL(href, page.url() || "https://developer.apple.com").toString();
      } catch {
        return null;
      }
    })
    .filter((url): url is string => Boolean(url))
    .filter((url) => classifyAppleUrl(url) === "hig")
    .map((url) => normalizeHigUrl(url));

  return Array.from(new Set(urls)).sort();
}

export async function discoverHigUrlsFromPage(page: Page): Promise<string[]> {
  await waitForHydratedContent(page);
  return collectHigLinks(page);
}

export async function discoverHigUrls(
  rootUrl: string,
  browserOrOptions?: Browser | { browser?: Browser; onProgress?: (state: DiscoveryProgress) => Promise<void> | void },
  maybeOptions?: { onProgress?: (state: DiscoveryProgress) => Promise<void> | void }
): Promise<string[]> {
  const browser =
    browserOrOptions && "newPage" in browserOrOptions
      ? browserOrOptions
      : browserOrOptions?.browser;
  const onProgress =
    browserOrOptions && "newPage" in browserOrOptions
      ? maybeOptions?.onProgress
      : browserOrOptions?.onProgress;
  const ownedBrowser = browser ?? (await chromium.launch());
  const page = await ownedBrowser.newPage();
  const normalizedRootUrl = normalizeHigUrl(rootUrl);
  const queue = [normalizedRootUrl];
  const seen = new Set<string>([normalizedRootUrl]);
  const visited = new Set<string>();

  try {
    while (queue.length > 0) {
      const currentUrl = queue.shift();

      if (!currentUrl || visited.has(currentUrl)) {
        continue;
      }

      visited.add(currentUrl);

      await page.goto(currentUrl, {
        waitUntil: "domcontentloaded"
      });

      const discoveredUrls = await discoverHigUrlsFromPage(page);

      for (const discoveredUrl of discoveredUrls) {
        if (!seen.has(discoveredUrl)) {
          seen.add(discoveredUrl);
          queue.push(discoveredUrl);
        }
      }

      await onProgress?.({
        visitedCount: visited.size,
        queuedCount: queue.length,
        discoveredCount: visited.size + queue.length,
        currentUrl,
        discoveredUrls: Array.from(new Set([...visited, ...queue])).sort()
      });
    }

    return Array.from(visited).sort();
  } finally {
    await page.close();

    if (!browser) {
      await ownedBrowser.close();
    }
  }
}
