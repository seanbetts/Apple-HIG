import os from "node:os";
import path from "node:path";

import fs from "node:fs/promises";
import { afterAll, describe, expect, it, vi } from "vitest";

import { runRender } from "../../src/commands/render.js";
import type { ExtractedPage } from "../../src/extraction/extractPage.js";
import type { NormalizedPage } from "../../src/types/content.js";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "apple-hig-render-"));
  tempDirs.push(directory);
  return directory;
}

afterAll(async () => {
  await Promise.all(tempDirs.map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

describe("runRender", () => {
  it("writes checkpoint manifests and emits progress during render", async () => {
    const rootDir = await makeTempDir();
    const extractedPage: ExtractedPage = {
      sourceUrl:
        "https://developer.apple.com/design/human-interface-guidelines/accessibility",
      title: "Accessibility",
      breadcrumbs: ["Human Interface Guidelines", "Accessibility"],
      appleChanges: [{ raw: "Updated February 14, 2026" }],
      internalLinks: [],
      externalLinks: [],
      contentBlocks: []
    };
    const normalizedPage: NormalizedPage = {
      ...extractedPage,
      canonicalPath: "/accessibility",
      appleChanges: [{ label: "Updated", raw: "Updated February 14, 2026" }]
    };
    const writeManifest = vi.fn(async (options: { fileName: string }) =>
      path.join(rootDir, "data", "manifests", options.fileName)
    );
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };

    const result = await runRender(
      {
        contentRoot: path.join(rootDir, "content"),
        manifestsRoot: path.join(rootDir, "data", "manifests")
      },
      {
        readPlanManifest: async () => ({
          discoveredUrls: [
            "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "https://developer.apple.com/design/human-interface-guidelines/toolbars"
          ],
          newUrls: [],
          changedUrls: [
            "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "https://developer.apple.com/design/human-interface-guidelines/toolbars"
          ],
          unchangedUrls: [],
          removedUrls: [],
          renderUrls: [
            "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "https://developer.apple.com/design/human-interface-guidelines/toolbars"
          ]
        }),
        extractPageFromUrl: async (url) => {
          if (url.endsWith("/toolbars")) {
            throw new Error("boom");
          }

          return { ...extractedPage, sourceUrl: url };
        },
        normalizePage: (rawPage) => ({
          ...normalizedPage,
          sourceUrl: rawPage.sourceUrl
        }),
        renderMarkdown: (page) => `# ${page.title}\n`,
        writePage: async () =>
          path.join(rootDir, "content", "accessibility", "index.md"),
        deletePage: async () => undefined,
        writeManifest,
        logger
      }
    );

    expect(writeManifest).toHaveBeenCalledTimes(3);
    expect(writeManifest.mock.calls[0]?.[0]).toEqual({
      manifestsRoot: path.join(rootDir, "data", "manifests"),
      fileName: "render.checkpoint.json",
      manifest: {
        discoveredUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/accessibility",
          "https://developer.apple.com/design/human-interface-guidelines/toolbars"
        ],
        processedUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/accessibility"
        ],
        failedUrls: [],
        removedUrls: []
      }
    });
    expect(writeManifest.mock.calls[1]?.[0]).toEqual({
      manifestsRoot: path.join(rootDir, "data", "manifests"),
      fileName: "render.checkpoint.json",
      manifest: {
        discoveredUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/accessibility",
          "https://developer.apple.com/design/human-interface-guidelines/toolbars"
        ],
        processedUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/accessibility"
        ],
        failedUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/toolbars"
        ],
        removedUrls: []
      }
    });
    expect(writeManifest.mock.calls[2]?.[0]).toEqual({
      manifestsRoot: path.join(rootDir, "data", "manifests"),
      fileName: "render.json",
      manifest: {
        discoveredUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/accessibility",
          "https://developer.apple.com/design/human-interface-guidelines/toolbars"
        ],
        processedUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/accessibility"
        ],
        failedUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/toolbars"
        ],
        removedUrls: []
      }
    });
    expect(logger.info).toHaveBeenNthCalledWith(
      1,
      "Render progress: processed 1/2, failed 0, current https://developer.apple.com/design/human-interface-guidelines/accessibility"
    );
    expect(logger.info).toHaveBeenNthCalledWith(
      2,
      "Render progress: processed 1/2, failed 1, current https://developer.apple.com/design/human-interface-guidelines/toolbars"
    );
    expect(result).toEqual({
      discoveredUrls: [
        "https://developer.apple.com/design/human-interface-guidelines/accessibility",
        "https://developer.apple.com/design/human-interface-guidelines/toolbars"
      ],
      processedUrls: [
        "https://developer.apple.com/design/human-interface-guidelines/accessibility"
      ],
      failedUrls: [
        "https://developer.apple.com/design/human-interface-guidelines/toolbars"
      ],
      removedUrls: []
    });
  });

  it("renders the planned URLs and deletes removed pages", async () => {
    const rootDir = await makeTempDir();
    const callOrder: string[] = [];
    const extractedPage: ExtractedPage = {
      sourceUrl:
        "https://developer.apple.com/design/human-interface-guidelines/accessibility",
      title: "Accessibility",
      breadcrumbs: ["Human Interface Guidelines", "Accessibility"],
      appleChanges: [{ raw: "Updated February 14, 2026" }],
      internalLinks: [],
      externalLinks: [],
      contentBlocks: []
    };
    const normalizedPage: NormalizedPage = {
      ...extractedPage,
      canonicalPath: "/accessibility",
      appleChanges: [{ label: "Updated", raw: "Updated February 14, 2026" }]
    };

    const result = await runRender(
      {
        contentRoot: path.join(rootDir, "content"),
        manifestsRoot: path.join(rootDir, "data", "manifests")
      },
      {
        readPlanManifest: async () => ({
          discoveredUrls: [
            "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "https://developer.apple.com/design/human-interface-guidelines/toolbars"
          ],
          newUrls: [],
          changedUrls: [
            "https://developer.apple.com/design/human-interface-guidelines/accessibility"
          ],
          unchangedUrls: [],
          removedUrls: [
            "https://developer.apple.com/design/human-interface-guidelines/toolbars"
          ],
          renderUrls: [
            "https://developer.apple.com/design/human-interface-guidelines/accessibility"
          ]
        }),
        extractPageFromUrl: async (url) => {
          callOrder.push(`extract:${url}`);
          return { ...extractedPage, sourceUrl: url };
        },
        normalizePage: (rawPage) => {
          callOrder.push("normalize");
          return { ...normalizedPage, sourceUrl: rawPage.sourceUrl };
        },
        renderMarkdown: (page) => {
          callOrder.push("render");
          return `# ${page.title}\n`;
        },
        writePage: async () => {
          callOrder.push("writePage");
          return path.join(rootDir, "content", "accessibility", "index.md");
        },
        deletePage: async (options) => {
          callOrder.push(`delete:${options.canonicalPath}`);
        },
        writeManifest: async () => {
          callOrder.push("writeManifest");
          return path.join(rootDir, "data", "manifests", "render.json");
        }
      }
    );

    expect(callOrder).toEqual([
      "extract:https://developer.apple.com/design/human-interface-guidelines/accessibility",
      "normalize",
      "render",
      "writePage",
      "writeManifest",
      "delete:/toolbars",
      "writeManifest"
    ]);
    expect(result).toEqual({
      discoveredUrls: [
        "https://developer.apple.com/design/human-interface-guidelines/accessibility",
        "https://developer.apple.com/design/human-interface-guidelines/toolbars"
      ],
      processedUrls: [
        "https://developer.apple.com/design/human-interface-guidelines/accessibility"
      ],
      failedUrls: [],
      removedUrls: [
        "https://developer.apple.com/design/human-interface-guidelines/toolbars"
      ]
    });
  });

  it("records failed page extractions in the render manifest", async () => {
    const rootDir = await makeTempDir();

    const result = await runRender(
      {
        contentRoot: path.join(rootDir, "content"),
        manifestsRoot: path.join(rootDir, "data", "manifests")
      },
      {
        readPlanManifest: async () => ({
          discoveredUrls: [
            "https://developer.apple.com/design/human-interface-guidelines/accessibility"
          ],
          newUrls: [],
          changedUrls: [
            "https://developer.apple.com/design/human-interface-guidelines/accessibility"
          ],
          unchangedUrls: [],
          removedUrls: [],
          renderUrls: [
            "https://developer.apple.com/design/human-interface-guidelines/accessibility"
          ]
        }),
        extractPageFromUrl: async () => {
          throw new Error("boom");
        },
        normalizePage: () => {
          throw new Error("unused");
        },
        renderMarkdown: () => "# unused\n",
        writePage: async () => path.join(rootDir, "content", "unused", "index.md"),
        deletePage: async () => undefined,
        writeManifest: async () => path.join(rootDir, "data", "manifests", "render.json")
      }
    );

    expect(result.processedUrls).toEqual([]);
    expect(result.failedUrls).toEqual([
      "https://developer.apple.com/design/human-interface-guidelines/accessibility"
    ]);
  });
});
