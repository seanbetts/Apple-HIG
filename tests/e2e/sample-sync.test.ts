import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import type { DiscoverManifest } from "../../src/types/discovery.js";
import type { PlanManifest } from "../../src/types/plan.js";
import { runRender } from "../../src/commands/render.js";
import { runSync } from "../../src/commands/sync.js";
import type { ExtractedPage } from "../../src/extraction/extractPage.js";
import { writeManifest } from "../../src/io/writeManifest.js";
import { writePage } from "../../src/io/writePage.js";
import { normalizePage } from "../../src/normalization/normalizePage.js";
import { renderMarkdown } from "../../src/render/renderMarkdown.js";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "apple-hig-e2e-"));
  tempDirs.push(directory);
  return directory;
}

afterAll(async () => {
  await Promise.all(tempDirs.map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

describe("sample HIG sync", () => {
  it("writes mirrored markdown with apple_changes and rewritten local links, and stays stable on repeated runs", async () => {
    const rootDir = await makeTempDir();
    const contentRoot = path.join(rootDir, "content");
    const manifestsRoot = path.join(rootDir, "data", "manifests");

    const pages = new Map<string, ExtractedPage>([
      [
        "https://developer.apple.com/design/human-interface-guidelines/accessibility",
        {
          sourceUrl:
            "https://developer.apple.com/design/human-interface-guidelines/accessibility",
          title: "Accessibility",
          description: "Design accessible experiences across Apple platforms.",
          breadcrumbs: [
            "Human Interface Guidelines",
            "Foundations",
            "Accessibility"
          ],
          appleChanges: [{ raw: "Updated February 14, 2026" }],
          internalLinks: ["/components/buttons"],
          externalLinks: ["https://developer.apple.com/documentation/uikit"],
          contentBlocks: [
            { type: "heading", level: 1, text: "Accessibility" },
            {
              type: "related-resources",
              links: [
                {
                  href: "https://developer.apple.com/design/human-interface-guidelines/components/buttons",
                  title: "Buttons"
                }
              ]
            }
          ]
        }
      ],
      [
        "https://developer.apple.com/design/human-interface-guidelines/components/buttons",
        {
          sourceUrl:
            "https://developer.apple.com/design/human-interface-guidelines/components/buttons",
          title: "Buttons",
          description: "Use buttons to trigger actions.",
          breadcrumbs: [
            "Human Interface Guidelines",
            "Components",
            "Buttons"
          ],
          appleChanges: [{ raw: "Updated February 14, 2026" }],
          internalLinks: [],
          externalLinks: [],
          contentBlocks: [{ type: "heading", level: 1, text: "Buttons" }]
        }
      ]
    ]);

    const dependencies = {
      preparePreviousDiscoverManifest: async () => undefined,
      runDiscover: async () =>
        ({
          discoveredUrls: Array.from(pages.keys()),
          processedUrls: [],
          failedUrls: [],
          removedUrls: [],
          pages: {}
        }) satisfies DiscoverManifest,
      runPlan: async () =>
        ({
          discoveredUrls: Array.from(pages.keys()),
          newUrls: Array.from(pages.keys()),
          changedUrls: [],
          unchangedUrls: [],
          removedUrls: [],
          renderUrls: Array.from(pages.keys())
        }) satisfies PlanManifest,
      runRender: async (options: { contentRoot: string; manifestsRoot: string }) =>
        runRender(options, {
          readPlanManifest: async () =>
            ({
              discoveredUrls: Array.from(pages.keys()),
              newUrls: Array.from(pages.keys()),
              changedUrls: [],
              unchangedUrls: [],
              removedUrls: [],
              renderUrls: Array.from(pages.keys())
            }) satisfies PlanManifest,
          extractPageFromUrl: async (url: string) => pages.get(url)!,
          normalizePage,
          renderMarkdown,
          writePage,
          deletePage: async () => undefined,
          writeManifest
        }),
      writeManifest
    };

    await runSync(
      {
        rootUrl: "https://developer.apple.com/design/human-interface-guidelines/",
        contentRoot,
        manifestsRoot
      },
      dependencies
    );

    const accessibilityPath = path.join(contentRoot, "accessibility", "index.md");
    const firstRun = await fs.readFile(accessibilityPath, "utf8");

    expect(firstRun).toContain("apple_changes:");
    expect(firstRun).toContain("- [Buttons](../components/buttons/)");

    await runSync(
      {
        rootUrl: "https://developer.apple.com/design/human-interface-guidelines/",
        contentRoot,
        manifestsRoot
      },
      dependencies
    );

    const secondRun = await fs.readFile(accessibilityPath, "utf8");
    expect(secondRun).toBe(firstRun);
  });
});
