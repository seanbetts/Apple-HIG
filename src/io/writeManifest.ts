import fs from "node:fs/promises";
import path from "node:path";

export async function writeManifest<T>(options: {
  manifestsRoot: string;
  fileName: string;
  manifest: T;
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
