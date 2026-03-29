import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { writeManifest } from "../../src/io/writeManifest.js";
import { writePage } from "../../src/io/writePage.js";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "apple-hig-"));
  tempDirs.push(directory);
  return directory;
}

afterAll(async () => {
  await Promise.all(tempDirs.map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

describe("writePage", () => {
  it("writes markdown to the mirrored URL path and is stable across repeated writes", async () => {
    const rootDir = await makeTempDir();
    const outputPath = await writePage({
      contentRoot: path.join(rootDir, "content"),
      canonicalPath: "/components/buttons",
      markdown: "# Buttons\n"
    });

    expect(outputPath).toBe(path.join(rootDir, "content", "components", "buttons", "index.md"));
    expect(await fs.readFile(outputPath, "utf8")).toBe("# Buttons\n");

    await writePage({
      contentRoot: path.join(rootDir, "content"),
      canonicalPath: "/components/buttons",
      markdown: "# Buttons\n"
    });

    expect(await fs.readFile(outputPath, "utf8")).toBe("# Buttons\n");
  });
});

describe("writeManifest", () => {
  it("writes manifest JSON into the manifests directory", async () => {
    const rootDir = await makeTempDir();
    const outputPath = await writeManifest({
      manifestsRoot: path.join(rootDir, "data", "manifests"),
      fileName: "latest.json",
      manifest: {
        discoveredUrls: [
          "https://developer.apple.com/design/human-interface-guidelines/accessibility"
        ],
        processedUrls: [],
        failedUrls: [],
        removedUrls: []
      }
    });

    expect(outputPath).toBe(path.join(rootDir, "data", "manifests", "latest.json"));
    expect(JSON.parse(await fs.readFile(outputPath, "utf8"))).toEqual({
      discoveredUrls: [
        "https://developer.apple.com/design/human-interface-guidelines/accessibility"
      ],
      processedUrls: [],
      failedUrls: [],
      removedUrls: []
    });
  });
});
