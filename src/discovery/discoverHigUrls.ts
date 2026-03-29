import { chromium, type Browser, type Page } from "playwright";

import { classifyAppleUrl, normalizeHigUrl } from "./urlRules.js";

async function collectHigLinks(page: Page): Promise<string[]> {
  const hrefs = await page.locator("a[href]").evaluateAll((links) =>
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
  return collectHigLinks(page);
}

export async function discoverHigUrls(
  rootUrl: string,
  browser?: Browser
): Promise<string[]> {
  const ownedBrowser = browser ?? (await chromium.launch());
  const page = await ownedBrowser.newPage();

  try {
    await page.goto(rootUrl, {
      waitUntil: "domcontentloaded"
    });

    return await collectHigLinks(page);
  } finally {
    await page.close();

    if (!browser) {
      await ownedBrowser.close();
    }
  }
}
