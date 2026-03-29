import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import { promisify } from "node:util";

import { chromium } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { extractPage } from "../../src/extraction/extractPage.js";

const execFileAsync = promisify(execFile);

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

  it("extracts content from the live docs shell without requiring main article or breadcrumb nav", async () => {
    const page = await browser.newPage();

    await page.setContent(
      `<!doctype html>
      <html>
        <head>
          <meta name="description" content="Accessible user interfaces empower everyone." />
        </head>
        <body>
          <main>
            <div class="documentation-hero documentation-hero--disabled">
              <div class="documentation-hero__content short-hero">
                <div class="topictitle">
                  <h1 class="title"><span>Accessibility</span></h1>
                </div>
                <div class="abstract content">Accessible user interfaces empower everyone.</div>
              </div>
            </div>
            <div class="doc-content-wrapper">
              <div class="doc-content">
                <div class="container">
                  <div class="primary-content with-border">
                    <div class="content">
                      <p>As you design interfaces for Apple platforms, keep these principles in mind.</p>
                      <h2 id="overview">Overview</h2>
                      <p>Accessible experiences help everyone use your app.</p>
                      <ul>
                        <li>Support VoiceOver.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </body>
      </html>`,
      { waitUntil: "domcontentloaded" }
    );

    const result = await extractPage(
      page,
      "https://developer.apple.com/design/human-interface-guidelines/accessibility"
    );

    expect(result.title).toBe("Accessibility");
    expect(result.description).toBe("Accessible user interfaces empower everyone.");
    expect(result.breadcrumbs).toEqual(["Human Interface Guidelines", "Accessibility"]);
    expect(result.contentBlocks).toContainEqual({
      type: "paragraph",
      text: "As you design interfaces for Apple platforms, keep these principles in mind."
    });

    await page.close();
  });

  it("works when extractPage runs under the tsx CLI runtime", async () => {
    const scriptPath = new URL(
      "../fixtures/scripts/extractPageRuntimeSmoke.ts",
      import.meta.url
    );

    const { stdout } = await execFileAsync(
      "npx",
      ["tsx", scriptPath.pathname],
      {
        cwd: process.cwd()
      }
    );

    const result = JSON.parse(stdout);

    expect(result.title).toBe("Accessibility");
    expect(result.breadcrumbs).toEqual(["Human Interface Guidelines", "Accessibility"]);
    expect(result.contentBlocks).toContainEqual({
      type: "paragraph",
      text: "As you design interfaces for Apple platforms, keep these principles in mind."
    });
  }, 20000);
});
