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
  it("runs discover, plan, render, and sync-manifest writing in order", async () => {
    const rootDir = await makeTempDir();
    const callOrder: string[] = [];

    const result = await runSync(
      {
        rootUrl: "https://developer.apple.com/design/human-interface-guidelines/",
        contentRoot: path.join(rootDir, "content"),
        manifestsRoot: path.join(rootDir, "data", "manifests")
      },
      {
        preparePreviousDiscoverManifest: async () => {
          callOrder.push("prepare");
        },
        runDiscover: async () => {
          callOrder.push("discover");
          return {
            discoveredUrls: [
              "https://developer.apple.com/design/human-interface-guidelines/accessibility"
            ],
            processedUrls: [],
            failedUrls: [],
            removedUrls: []
          };
        },
        runPlan: async () => {
          callOrder.push("plan");
          return {
            discoveredUrls: [
              "https://developer.apple.com/design/human-interface-guidelines/accessibility"
            ],
            newUrls: [
              "https://developer.apple.com/design/human-interface-guidelines/accessibility"
            ],
            changedUrls: [],
            unchangedUrls: [],
            removedUrls: [],
            renderUrls: [
              "https://developer.apple.com/design/human-interface-guidelines/accessibility"
            ]
          };
        },
        runRender: async () => {
          callOrder.push("render");
          return {
            discoveredUrls: [
              "https://developer.apple.com/design/human-interface-guidelines/accessibility"
            ],
            processedUrls: [
              "https://developer.apple.com/design/human-interface-guidelines/accessibility"
            ],
            failedUrls: [],
            removedUrls: []
          };
        },
        writeManifest: async () => {
          callOrder.push("writeSyncManifest");
          return path.join(rootDir, "data", "manifests", "sync.json");
        }
      }
    );

    expect(callOrder).toEqual([
      "prepare",
      "discover",
      "plan",
      "render",
      "writeSyncManifest"
    ]);
    expect(result.failedUrls).toEqual([]);
    expect(result.processedUrls).toEqual([
      "https://developer.apple.com/design/human-interface-guidelines/accessibility"
    ]);
  });

  it("returns failed URLs from the render phase", async () => {
    const rootDir = await makeTempDir();

    const result = await runSync(
      {
        rootUrl: "https://developer.apple.com/design/human-interface-guidelines/",
        contentRoot: path.join(rootDir, "content"),
        manifestsRoot: path.join(rootDir, "data", "manifests")
      },
      {
        preparePreviousDiscoverManifest: async () => undefined,
        runDiscover: async () => ({
          discoveredUrls: [
            "https://developer.apple.com/design/human-interface-guidelines/accessibility"
          ],
          processedUrls: [],
          failedUrls: [],
          removedUrls: []
        }),
        runPlan: async () => ({
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
        runRender: async () => ({
          discoveredUrls: [
            "https://developer.apple.com/design/human-interface-guidelines/accessibility"
          ],
          processedUrls: [],
          failedUrls: [
            "https://developer.apple.com/design/human-interface-guidelines/accessibility"
          ],
          removedUrls: []
        }),
        writeManifest: async () => path.join(rootDir, "data", "manifests", "sync.json")
      }
    );

    expect(result.processedUrls).toEqual([]);
    expect(result.failedUrls).toEqual([
      "https://developer.apple.com/design/human-interface-guidelines/accessibility"
    ]);
  });
});
