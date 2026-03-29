import os from "node:os";
import path from "node:path";

import fs from "node:fs/promises";
import { afterAll, describe, expect, it, vi } from "vitest";

import { runDiscover } from "../../src/commands/discover.js";
import { runSync } from "../../src/commands/sync.js";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "apple-hig-sync-"));
  tempDirs.push(directory);
  return directory;
}

afterAll(async () => {
  await Promise.all(tempDirs.map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

describe("runDiscover", () => {
  it("writes a canonical URL inventory manifest", async () => {
    const rootDir = await makeTempDir();
    const writeManifest = vi.fn(async () => path.join(rootDir, "data", "manifests", "discover.json"));

    const result = await runDiscover(
      {
        rootUrl: "https://developer.apple.com/design/human-interface-guidelines/",
        manifestsRoot: path.join(rootDir, "data", "manifests")
      },
      {
        discoverHigUrls: async () => [
          "https://developer.apple.com/design/human-interface-guidelines/accessibility"
        ],
        writeManifest
      }
    );

    expect(writeManifest).toHaveBeenCalledWith({
      manifestsRoot: path.join(rootDir, "data", "manifests"),
      fileName: "discover.json",
      manifest: {
        discoveredUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/accessibility"
        ],
        processedUrls: [],
        failedUrls: [],
        removedUrls: []
      }
    });
    expect(result.discoveredUrls).toEqual([
      "https://developer.apple.com/design/human-interface-guidelines/accessibility"
    ]);
  });
});

describe("runSync", () => {
  it("runs discovery, extraction, normalization, rendering, and output writing in order", async () => {
    const rootDir = await makeTempDir();
    const callOrder: string[] = [];

    const result = await runSync(
      {
        rootUrl: "https://developer.apple.com/design/human-interface-guidelines/",
        contentRoot: path.join(rootDir, "content"),
        manifestsRoot: path.join(rootDir, "data", "manifests")
      },
      {
        discoverHigUrls: async () => {
          callOrder.push("discover");
          return [
            "https://developer.apple.com/design/human-interface-guidelines/accessibility"
          ];
        },
        extractPageFromUrl: async (url) => {
          callOrder.push(`extract:${url}`);
          return {
            sourceUrl: url,
            title: "Accessibility",
            breadcrumbs: ["Human Interface Guidelines", "Foundations", "Accessibility"],
            appleChanges: [{ raw: "Updated February 14, 2026" }],
            internalLinks: [],
            externalLinks: [],
            contentBlocks: []
          };
        },
        normalizePage: (rawPage) => {
          callOrder.push("normalize");
          return {
            ...rawPage,
            canonicalPath: "/accessibility",
            section: "Foundations",
            internalLinks: [],
            externalLinks: []
          };
        },
        renderMarkdown: (page) => {
          callOrder.push("render");
          return `# ${page.title}\n`;
        },
        writePage: async () => {
          callOrder.push("writePage");
          return path.join(rootDir, "content", "accessibility", "index.md");
        },
        writeManifest: async () => {
          callOrder.push("writeManifest");
          return path.join(rootDir, "data", "manifests", "sync.json");
        }
      }
    );

    expect(callOrder).toEqual([
      "discover",
      "extract:https://developer.apple.com/design/human-interface-guidelines/accessibility",
      "normalize",
      "render",
      "writePage",
      "writeManifest"
    ]);
    expect(result.failedUrls).toEqual([]);
    expect(result.processedUrls).toEqual([
      "https://developer.apple.com/design/human-interface-guidelines/accessibility"
    ]);
  });

  it("records failed page extractions in the manifest", async () => {
    const rootDir = await makeTempDir();

    const result = await runSync(
      {
        rootUrl: "https://developer.apple.com/design/human-interface-guidelines/",
        contentRoot: path.join(rootDir, "content"),
        manifestsRoot: path.join(rootDir, "data", "manifests")
      },
      {
        discoverHigUrls: async () => [
          "https://developer.apple.com/design/human-interface-guidelines/accessibility"
        ],
        extractPageFromUrl: async () => {
          throw new Error("boom");
        },
        normalizePage: (rawPage) => rawPage,
        renderMarkdown: () => "# unused\n",
        writePage: async () => path.join(rootDir, "content", "unused", "index.md"),
        writeManifest: async () => path.join(rootDir, "data", "manifests", "sync.json")
      }
    );

    expect(result.processedUrls).toEqual([]);
    expect(result.failedUrls).toEqual([
      "https://developer.apple.com/design/human-interface-guidelines/accessibility"
    ]);
  });
});
