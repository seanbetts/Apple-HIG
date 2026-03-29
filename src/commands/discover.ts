import { discoverHigUrls } from "../discovery/discoverHigUrls.js";
import { writeManifest } from "../io/writeManifest.js";
import type { Manifest } from "../types/manifest.js";

interface DiscoverOptions {
  rootUrl: string;
  manifestsRoot: string;
}

interface DiscoverDependencies {
  discoverHigUrls: typeof discoverHigUrls;
  writeManifest: typeof writeManifest;
}

const defaultDependencies: DiscoverDependencies = {
  discoverHigUrls,
  writeManifest
};

export async function runDiscover(
  options: DiscoverOptions,
  dependencies: DiscoverDependencies = defaultDependencies
): Promise<Manifest> {
  const discoveredUrls = await dependencies.discoverHigUrls(options.rootUrl);
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
