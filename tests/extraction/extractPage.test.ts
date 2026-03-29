import fs from "node:fs/promises";

import { chromium } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { extractPage } from "../../src/extraction/extractPage.js";

const fixturePath = new URL("../fixtures/pages/accessibility.html", import.meta.url);
const sourceUrl =
  "https://developer.apple.com/design/human-interface-guidelines/accessibility";

describe("extractPage", () => {
  let browser: Awaited<ReturnType<typeof chromium.launch>>;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it("extracts title, breadcrumbs, blocks, related links, and Apple update metadata", async () => {
    const page = await browser.newPage();
    const html = await fs.readFile(fixturePath, "utf8");

    await page.setContent(html, {
      waitUntil: "domcontentloaded"
    });

    const result = await extractPage(page, sourceUrl);

    expect(result.title).toBe("Accessibility");
    expect(result.description).toBe(
      "Design accessible experiences across Apple platforms."
    );
    expect(result.breadcrumbs).toEqual([
      "Human Interface Guidelines",
      "Foundations",
      "Accessibility"
    ]);
    expect(result.appleChanges).toEqual([
      {
        raw: "Updated February 14, 2026"
      }
    ]);
    expect(result.internalLinks).toEqual([
      "/components/buttons"
    ]);
    expect(result.externalLinks).toEqual([
      "https://developer.apple.com/documentation/uikit"
    ]);
    expect(result.contentBlocks).toEqual([
      {
        type: "heading",
        level: 1,
        text: "Accessibility"
      },
      {
        type: "paragraph",
        text: "Design accessible experiences across Apple platforms."
      },
      {
        type: "heading",
        level: 2,
        text: "Overview"
      },
      {
        type: "paragraph",
        text: "Accessible experiences help everyone use your app."
      },
      {
        type: "list",
        ordered: false,
        items: ["Support VoiceOver.", "Respect contrast."]
      },
      {
        type: "heading",
        level: 2,
        text: "Sizes"
      },
      {
        type: "table",
        headers: ["Control", "Minimum size"],
        rows: [["Button", "44 x 44 pt"]]
      },
      {
        type: "related-resources",
        links: [
          {
            href: "https://developer.apple.com/design/human-interface-guidelines/components/buttons",
            title: "Buttons"
          },
          {
            href: "https://developer.apple.com/documentation/uikit",
            title: "UIKit"
          }
        ]
      }
    ]);

    await page.close();
  });
});
