import { discoverHigUrls } from "../discovery/discoverHigUrls.js";
import { writeManifest } from "../io/writeManifest.js";
import { logger, type Logger } from "../logging.js";
import type { Manifest } from "../types/manifest.js";

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
): Promise<Manifest> {
  const discoveredUrls = await dependencies.discoverHigUrls(options.rootUrl, {
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
          removedUrls: []
        }
      });
    }
  });
  const manifest: Manifest = {
    discoveredUrls,
    processedUrls: [],
    failedUrls: [],
    removedUrls: []
  };

  await dependencies.writeManifest({
    manifestsRoot: options.manifestsRoot,
    fileName: "discover.json",
    manifest
  });

  return manifest;
}
