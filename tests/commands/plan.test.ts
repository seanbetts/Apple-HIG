import os from "node:os";
import path from "node:path";

import fs from "node:fs/promises";
import { afterAll, describe, expect, it, vi } from "vitest";

import { runPlan } from "../../src/commands/plan.js";
import type { DiscoverManifest } from "../../src/types/discovery.js";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "apple-hig-plan-"));
  tempDirs.push(directory);
  return directory;
}

afterAll(async () => {
  await Promise.all(tempDirs.map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

describe("runPlan", () => {
  it("classifies new, changed, and removed URLs and writes a plan manifest", async () => {
    const rootDir = await makeTempDir();
    const writePlanManifest = vi.fn(async () =>
      path.join(rootDir, "data", "manifests", "plan.json")
    );

    const result = await runPlan(
      {
        manifestsRoot: path.join(rootDir, "data", "manifests")
      },
      {
        readCurrentDiscoverManifest: async () =>
          ({
          discoveredUrls: [
            "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "https://developer.apple.com/design/human-interface-guidelines/components/buttons",
            "https://developer.apple.com/design/human-interface-guidelines/patterns"
          ],
          processedUrls: [],
          failedUrls: [],
          removedUrls: [],
          pages: {
            "https://developer.apple.com/design/human-interface-guidelines/accessibility": {
              url: "https://developer.apple.com/design/human-interface-guidelines/accessibility",
              canonicalPath: "/accessibility",
              title: "Accessibility",
              breadcrumbs: ["Human Interface Guidelines", "Accessibility"],
              appleChanges: [{ raw: "Updated February 14, 2026" }],
              internalLinks: [],
              discoveryHash: "same-hash"
            },
            "https://developer.apple.com/design/human-interface-guidelines/components/buttons": {
              url: "https://developer.apple.com/design/human-interface-guidelines/components/buttons",
              canonicalPath: "/components/buttons",
              title: "Buttons",
              breadcrumbs: ["Human Interface Guidelines", "Components", "Buttons"],
              appleChanges: [],
              internalLinks: [],
              discoveryHash: "new-hash"
            },
            "https://developer.apple.com/design/human-interface-guidelines/patterns": {
              url: "https://developer.apple.com/design/human-interface-guidelines/patterns",
              canonicalPath: "/patterns",
              title: "Patterns",
              breadcrumbs: ["Human Interface Guidelines", "Patterns"],
              appleChanges: [],
              internalLinks: [],
              discoveryHash: "changed-hash-next"
            }
          }
        }) satisfies DiscoverManifest,
        readPreviousDiscoverManifest: async () =>
          ({
          discoveredUrls: [
            "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "https://developer.apple.com/design/human-interface-guidelines/patterns",
            "https://developer.apple.com/design/human-interface-guidelines/toolbars"
          ],
          processedUrls: [],
          failedUrls: [],
          removedUrls: [],
          pages: {
            "https://developer.apple.com/design/human-interface-guidelines/accessibility": {
              url: "https://developer.apple.com/design/human-interface-guidelines/accessibility",
              canonicalPath: "/accessibility",
              title: "Accessibility",
              breadcrumbs: ["Human Interface Guidelines", "Accessibility"],
              appleChanges: [{ raw: "Updated February 14, 2026" }],
              internalLinks: [],
              discoveryHash: "same-hash"
            },
            "https://developer.apple.com/design/human-interface-guidelines/patterns": {
              url: "https://developer.apple.com/design/human-interface-guidelines/patterns",
              canonicalPath: "/patterns",
              title: "Patterns",
              breadcrumbs: ["Human Interface Guidelines", "Patterns"],
              appleChanges: [],
              internalLinks: [],
              discoveryHash: "changed-hash-prev"
            },
            "https://developer.apple.com/design/human-interface-guidelines/toolbars": {
              url: "https://developer.apple.com/design/human-interface-guidelines/toolbars",
              canonicalPath: "/toolbars",
              title: "Toolbars",
              breadcrumbs: ["Human Interface Guidelines", "Components", "Toolbars"],
              appleChanges: [],
              internalLinks: [],
              discoveryHash: "removed-hash"
            }
          }
        }) satisfies DiscoverManifest,
        writePlanManifest
      }
    );

    expect(writePlanManifest).toHaveBeenCalledWith({
      manifestsRoot: path.join(rootDir, "data", "manifests"),
      fileName: "plan.json",
      manifest: {
        discoveredUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/accessibility",
          "https://developer.apple.com/design/human-interface-guidelines/components/buttons",
          "https://developer.apple.com/design/human-interface-guidelines/patterns"
        ],
        newUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/components/buttons"
        ],
        changedUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/patterns"
        ],
        unchangedUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/accessibility"
        ],
        removedUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/toolbars"
        ],
        renderUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/components/buttons",
          "https://developer.apple.com/design/human-interface-guidelines/patterns"
        ]
      }
    });
    expect(result.renderUrls).toEqual([
      "https://developer.apple.com/design/human-interface-guidelines/components/buttons",
      "https://developer.apple.com/design/human-interface-guidelines/patterns"
    ]);
    expect(result.unchangedUrls).toEqual([
      "https://developer.apple.com/design/human-interface-guidelines/accessibility"
    ]);
  });
});
