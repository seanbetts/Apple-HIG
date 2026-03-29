import fs from "node:fs/promises";
import path from "node:path";

import type { Manifest } from "../types/manifest.js";

export async function writeManifest(options: {
  manifestsRoot: string;
  fileName: string;
  manifest: Manifest;
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
