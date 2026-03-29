import fs from "node:fs/promises";
import path from "node:path";

import { runDiscover } from "./discover.js";
import { runPlan } from "./plan.js";
import { runRender } from "./render.js";
import { writeManifest } from "../io/writeManifest.js";
import type { Manifest } from "../types/manifest.js";

interface SyncOptions {
  rootUrl: string;
  contentRoot: string;
  manifestsRoot: string;
}

interface SyncDependencies {
  preparePreviousDiscoverManifest: (manifestsRoot: string) => Promise<void>;
  runDiscover: typeof runDiscover;
  runPlan: typeof runPlan;
  runRender: typeof runRender;
  writeManifest: typeof writeManifest;
}

async function preparePreviousDiscoverManifest(manifestsRoot: string): Promise<void> {
  const currentManifestPath = path.join(manifestsRoot, "discover.json");
  const previousManifestPath = path.join(manifestsRoot, "discover.previous.json");

  try {
    await fs.mkdir(manifestsRoot, {
      recursive: true
    });
    await fs.copyFile(currentManifestPath, previousManifestPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await fs.rm(previousManifestPath, {
        force: true
      });
      return;
    }

    throw error;
  }
}

const defaultDependencies: SyncDependencies = {
  preparePreviousDiscoverManifest,
  runDiscover,
  runPlan,
  runRender,
  writeManifest
};

export async function runSync(
  options: SyncOptions,
  dependencies: SyncDependencies = defaultDependencies
): Promise<Manifest> {
  await dependencies.preparePreviousDiscoverManifest(options.manifestsRoot);
  await dependencies.runDiscover({
    rootUrl: options.rootUrl,
    manifestsRoot: options.manifestsRoot
  });
  await dependencies.runPlan({
    manifestsRoot: options.manifestsRoot
  });
  const manifest = await dependencies.runRender({
    contentRoot: options.contentRoot,
    manifestsRoot: options.manifestsRoot
  });

  await dependencies.writeManifest({
    manifestsRoot: options.manifestsRoot,
    fileName: "sync.json",
    manifest
  });

  return manifest;
}
