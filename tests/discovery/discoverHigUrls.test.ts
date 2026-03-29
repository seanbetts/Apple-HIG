import fs from "node:fs/promises";

import { chromium } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { discoverHigUrlsFromPage } from "../../src/discovery/discoverHigUrls.js";

const fixturePath = new URL("../fixtures/pages/hig-home.html", import.meta.url);

describe("discoverHigUrlsFromPage", () => {
  let browser: Awaited<ReturnType<typeof chromium.launch>>;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  it("collects canonical HIG links, deduplicates them, and excludes external Apple docs", async () => {
    const page = await browser.newPage();
    const html = await fs.readFile(fixturePath, "utf8");

    await page.setContent(html, {
      waitUntil: "domcontentloaded"
    });

    const urls = await discoverHigUrlsFromPage(page);

    expect(urls).toEqual([
      "https://developer.apple.com/design/human-interface-guidelines/components",
      "https://developer.apple.com/design/human-interface-guidelines/components/buttons",
      "https://developer.apple.com/design/human-interface-guidelines/foundations",
      "https://developer.apple.com/design/human-interface-guidelines/getting-started",
      "https://developer.apple.com/design/human-interface-guidelines/inputs",
      "https://developer.apple.com/design/human-interface-guidelines/patterns",
      "https://developer.apple.com/design/human-interface-guidelines/technologies"
    ]);

    await page.close();
  });
});
