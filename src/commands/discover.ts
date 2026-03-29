import { discoverHigUrls } from "../discovery/discoverHigUrls.js";
import { writeManifest } from "../io/writeManifest.js";
import { logger, type Logger } from "../logging.js";
import type { DiscoverManifest, DiscoveryPageRecord } from "../types/discovery.js";

interface DiscoverOptions {
  rootUrl: string;
  manifestsRoot: string;
}

interface DiscoverDependencies {
  discoverHigUrls: (
    rootUrl: string,
    options?: {
      onProgress?: (state: {
        visitedCount: number;
        queuedCount: number;
        discoveredCount: number;
        currentUrl: string;
        discoveredUrls: string[];
      }) => Promise<void> | void;
      onPageDiscovered?: (page: DiscoveryPageRecord) => Promise<void> | void;
    }
  ) => Promise<string[]>;
  writeManifest: typeof writeManifest;
  logger: Logger;
}

const defaultDependencies: DiscoverDependencies = {
  discoverHigUrls,
  writeManifest,
  logger
};

export async function runDiscover(
  options: DiscoverOptions,
  dependencies: DiscoverDependencies = defaultDependencies
): Promise<DiscoverManifest> {
  const pagesByUrl: Record<string, DiscoveryPageRecord> = {};
  const sortPagesByUrl = (urls: string[]) =>
    Object.fromEntries(
      urls
        .filter((url) => url in pagesByUrl)
        .sort()
        .map((url) => [url, pagesByUrl[url]])
    );
  const discoveredUrls = await dependencies.discoverHigUrls(options.rootUrl, {
    onPageDiscovered: async (page) => {
      pagesByUrl[page.url] = page;
    },
    onProgress: async (state) => {
      dependencies.logger.info(
        `Discovery progress: visited ${state.visitedCount}, queued ${state.queuedCount}, discovered ${state.discoveredCount}, current ${state.currentUrl}`
      );

      await dependencies.writeManifest({
        manifestsRoot: options.manifestsRoot,
        fileName: "discover.checkpoint.json",
        manifest: {
          discoveredUrls: state.discoveredUrls,
          processedUrls: [],
          failedUrls: [],
          removedUrls: [],
          pages: sortPagesByUrl(state.discoveredUrls)
        }
      });
    }
  });
  const manifest: DiscoverManifest = {
    discoveredUrls,
    processedUrls: [],
    failedUrls: [],
    removedUrls: [],
    pages: sortPagesByUrl(discoveredUrls)
  };

  await dependencies.writeManifest({
    manifestsRoot: options.manifestsRoot,
    fileName: "discover.json",
    manifest
  });

  return manifest;
}
