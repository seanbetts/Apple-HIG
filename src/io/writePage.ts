import fs from "node:fs/promises";
import path from "node:path";

function canonicalPathToOutputPath(contentRoot: string, canonicalPath: string): string {
  const cleanedPath = canonicalPath.replace(/^\/+|\/+$/g, "");
  const segments = cleanedPath ? cleanedPath.split("/") : [];

  return path.join(contentRoot, ...segments, "index.md");
}

export async function writePage(options: {
  contentRoot: string;
  canonicalPath: string;
  markdown: string;
}): Promise<string> {
  const outputPath = canonicalPathToOutputPath(
    options.contentRoot,
    options.canonicalPath
  );

  await fs.mkdir(path.dirname(outputPath), {
    recursive: true
  });
  await fs.writeFile(outputPath, options.markdown, "utf8");

  return outputPath;
}
