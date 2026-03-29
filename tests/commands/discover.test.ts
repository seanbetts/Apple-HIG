import os from "node:os";
import path from "node:path";

import fs from "node:fs/promises";
import { afterAll, describe, expect, it, vi } from "vitest";

import { runDiscover } from "../../src/commands/discover.js";
import type { DiscoverManifest, DiscoveryPageRecord } from "../../src/types/discovery.js";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "apple-hig-discover-"));
  tempDirs.push(directory);
  return directory;
}

afterAll(async () => {
  await Promise.all(tempDirs.map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

describe("runDiscover", () => {
  it("writes checkpoint manifests and emits progress during discovery", async () => {
    const rootDir = await makeTempDir();
    const writeManifest = vi.fn(async () =>
      path.join(rootDir, "data", "manifests", "discover.json")
    );
    const onProgress = vi.fn();
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };

    const accessibilityPage = {
      url: "https://developer.apple.com/design/human-interface-guidelines/accessibility",
      canonicalPath: "/accessibility",
      title: "Accessibility",
      breadcrumbs: ["Human Interface Guidelines", "Accessibility"],
      appleChanges: [{ raw: "Updated February 14, 2026" }],
      internalLinks: ["/components/buttons"],
      discoveryHash: "hash-accessibility"
    } satisfies DiscoveryPageRecord;
    const buttonsPage = {
      url: "https://developer.apple.com/design/human-interface-guidelines/components/buttons",
      canonicalPath: "/components/buttons",
      title: "Buttons",
      breadcrumbs: ["Human Interface Guidelines", "Components", "Buttons"],
      appleChanges: [],
      internalLinks: [],
      discoveryHash: "hash-buttons"
    } satisfies DiscoveryPageRecord;

    const result = await runDiscover(
      {
        rootUrl: "https://developer.apple.com/design/human-interface-guidelines/",
        manifestsRoot: path.join(rootDir, "data", "manifests")
      },
      {
        discoverHigUrls: async (_rootUrl: string, options?: {
          onProgress?: (state: {
            visitedCount: number;
            queuedCount: number;
            discoveredCount: number;
            currentUrl: string;
            discoveredUrls: string[];
          }) => Promise<void> | void;
          onPageDiscovered?: (page: DiscoveryPageRecord) => Promise<void> | void;
        }) => {
          await options?.onPageDiscovered?.(accessibilityPage);
          await options?.onProgress?.({
            visitedCount: 1,
            queuedCount: 2,
            discoveredCount: 3,
            currentUrl:
              "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            discoveredUrls: [
              "https://developer.apple.com/design/human-interface-guidelines/accessibility",
              "https://developer.apple.com/design/human-interface-guidelines/components/buttons",
              "https://developer.apple.com/design/human-interface-guidelines/foundations"
            ]
          });
          await options?.onPageDiscovered?.(buttonsPage);

          return [
            "https://developer.apple.com/design/human-interface-guidelines/accessibility",
            "https://developer.apple.com/design/human-interface-guidelines/components/buttons"
          ];
        },
        writeManifest,
        logger
      }
    );

    expect(writeManifest).toHaveBeenCalledTimes(2);
    const manifestCalls = writeManifest.mock.calls as unknown as Array<
      [
        {
          manifestsRoot: string;
          fileName: string;
          manifest: DiscoverManifest;
        }
      ]
    >;

    expect(manifestCalls[0]?.[0]).toEqual({
      manifestsRoot: path.join(rootDir, "data", "manifests"),
      fileName: "discover.checkpoint.json",
      manifest: {
        discoveredUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/accessibility",
          "https://developer.apple.com/design/human-interface-guidelines/components/buttons",
          "https://developer.apple.com/design/human-interface-guidelines/foundations"
        ],
        processedUrls: [],
        failedUrls: [],
        removedUrls: [],
        pages: {
          "https://developer.apple.com/design/human-interface-guidelines/accessibility":
            accessibilityPage
        }
      } satisfies DiscoverManifest
    });
    expect(manifestCalls[1]?.[0]).toEqual({
      manifestsRoot: path.join(rootDir, "data", "manifests"),
      fileName: "discover.json",
      manifest: {
        discoveredUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/accessibility",
          "https://developer.apple.com/design/human-interface-guidelines/components/buttons"
        ],
        processedUrls: [],
        failedUrls: [],
        removedUrls: [],
        pages: {
          "https://developer.apple.com/design/human-interface-guidelines/accessibility":
            accessibilityPage,
          "https://developer.apple.com/design/human-interface-guidelines/components/buttons":
            buttonsPage
        }
      } satisfies DiscoverManifest
    });
    expect(logger.info).toHaveBeenCalledWith(
      "Discovery progress: visited 1, queued 2, discovered 3, current https://developer.apple.com/design/human-interface-guidelines/accessibility"
    );
    expect(result.discoveredUrls).toEqual([
      "https://developer.apple.com/design/human-interface-guidelines/accessibility",
      "https://developer.apple.com/design/human-interface-guidelines/components/buttons"
    ]);
    expect(result.pages).toEqual({
      "https://developer.apple.com/design/human-interface-guidelines/accessibility":
        accessibilityPage,
      "https://developer.apple.com/design/human-interface-guidelines/components/buttons":
        buttonsPage
    });
    expect(onProgress).not.toHaveBeenCalled();
  });
});
