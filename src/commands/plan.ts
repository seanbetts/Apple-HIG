import fs from "node:fs/promises";
import path from "node:path";

import { discoverManifestSchema, type DiscoverManifest } from "../types/discovery.js";
import { manifestSchema } from "../types/manifest.js";
import { planManifestSchema, type PlanManifest } from "../types/plan.js";

interface PlanOptions {
  manifestsRoot: string;
}

interface PlanDependencies {
  readCurrentDiscoverManifest: (manifestsRoot: string) => Promise<DiscoverManifest>;
  readPreviousDiscoverManifest: (manifestsRoot: string) => Promise<DiscoverManifest | null>;
  writePlanManifest: (options: {
    manifestsRoot: string;
    fileName: string;
    manifest: PlanManifest;
  }) => Promise<string>;
}

async function readManifestFile(filePath: string): Promise<DiscoverManifest> {
  const rawManifest = JSON.parse(await fs.readFile(filePath, "utf8")) as unknown;
  const parsedDiscoverManifest = discoverManifestSchema.safeParse(rawManifest);

  if (parsedDiscoverManifest.success) {
    return parsedDiscoverManifest.data;
  }

  const parsedLegacyManifest = manifestSchema.parse(rawManifest);

  return {
    ...parsedLegacyManifest,
    pages: {}
  };
}

async function readCurrentDiscoverManifest(manifestsRoot: string): Promise<DiscoverManifest> {
  return readManifestFile(path.join(manifestsRoot, "discover.json"));
}

async function readPreviousDiscoverManifest(
  manifestsRoot: string
): Promise<DiscoverManifest | null> {
  try {
    return await readManifestFile(path.join(manifestsRoot, "discover.previous.json"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function writePlanManifest(options: {
  manifestsRoot: string;
  fileName: string;
  manifest: PlanManifest;
}): Promise<string> {
  const outputPath = path.join(options.manifestsRoot, options.fileName);

  await fs.mkdir(path.dirname(outputPath), {
    recursive: true
  });
  await fs.writeFile(
    outputPath,
    `${JSON.stringify(options.manifest, null, 2)}\n`,
    "utf8"
  );

  return outputPath;
}

const defaultDependencies: PlanDependencies = {
  readCurrentDiscoverManifest,
  readPreviousDiscoverManifest,
  writePlanManifest
};

export async function runPlan(
  options: PlanOptions,
  dependencies: PlanDependencies = defaultDependencies
): Promise<PlanManifest> {
  const currentManifest = await dependencies.readCurrentDiscoverManifest(
    options.manifestsRoot
  );
  const previousManifest =
    (await dependencies.readPreviousDiscoverManifest(options.manifestsRoot)) ?? {
      discoveredUrls: [],
      processedUrls: [],
      failedUrls: [],
      removedUrls: [],
      pages: {}
    };

  const currentUrls = new Set(currentManifest.discoveredUrls);
  const previousUrls = new Set(previousManifest.discoveredUrls);
  const getDiscoveryHash = (manifest: DiscoverManifest, url: string) =>
    manifest.pages[url]?.discoveryHash;

  const newUrls = currentManifest.discoveredUrls.filter((url) => !previousUrls.has(url));
  const changedUrls = currentManifest.discoveredUrls.filter(
    (url) =>
      previousUrls.has(url) &&
      (getDiscoveryHash(currentManifest, url) == null ||
        getDiscoveryHash(previousManifest, url) == null ||
        getDiscoveryHash(currentManifest, url) !== getDiscoveryHash(previousManifest, url))
  );
  const unchangedUrls = currentManifest.discoveredUrls.filter(
    (url) =>
      previousUrls.has(url) &&
      getDiscoveryHash(currentManifest, url) != null &&
      getDiscoveryHash(currentManifest, url) === getDiscoveryHash(previousManifest, url)
  );
  const removedUrls = previousManifest.discoveredUrls.filter((url) => !currentUrls.has(url));
  const renderUrls = [...newUrls, ...changedUrls].sort();

  const manifest = planManifestSchema.parse({
    discoveredUrls: currentManifest.discoveredUrls,
    newUrls,
    changedUrls,
    unchangedUrls,
    removedUrls,
    renderUrls
  });

  await dependencies.writePlanManifest({
    manifestsRoot: options.manifestsRoot,
    fileName: "plan.json",
    manifest
  });

  return manifest;
}
