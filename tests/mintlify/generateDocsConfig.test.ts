import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

import { afterAll, describe, expect, it } from "vitest";

import { syncMintlifyPreview } from "../../src/mintlify/syncMintlifyPreview.js";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "apple-hig-mintlify-"));
  tempDirs.push(directory);
  return directory;
}

afterAll(async () => {
  await Promise.all(tempDirs.map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

describe("syncMintlifyPreview", () => {
  it("writes a docs.json navigation tree from the mirrored content structure", async () => {
    const rootDir = await makeTempDir();
    const contentRoot = path.join(rootDir, "content");

    await fs.mkdir(path.join(contentRoot, "accessibility"), { recursive: true });
    await fs.mkdir(path.join(contentRoot, "components", "layout-and-organization", "tab-views"), {
      recursive: true
    });

    await fs.writeFile(path.join(contentRoot, "index.md"), "---\ntitle: Home\n---\n\n# Home\n");
    await fs.writeFile(
      path.join(contentRoot, "accessibility", "index.md"),
      "---\ntitle: Accessibility\n---\n\n# Accessibility\n"
    );
    await fs.writeFile(
      path.join(contentRoot, "components", "index.md"),
      "---\ntitle: Components\n---\n\n# Components\n"
    );
    await fs.writeFile(
      path.join(contentRoot, "components", "layout-and-organization", "tab-views", "index.md"),
      "---\ntitle: Tab views\n---\n\n# Tab views\n"
    );

    const outputPath = await syncMintlifyPreview(contentRoot);
    const docsConfig = JSON.parse(await fs.readFile(outputPath, "utf8")) as {
      navigation: {
        groups: Array<{
          group: string;
          pages: Array<string | { group: string; pages: unknown[] }>;
        }>;
      };
    };

    expect(outputPath).toBe(path.join(contentRoot, "docs.json"));
    expect(docsConfig.navigation.groups).toEqual([
      {
        group: "Overview",
        pages: ["index"]
      },
      {
        group: "Mirror",
        pages: [
          "accessibility/index",
          {
            group: "Components",
            pages: [
              "components/index",
              {
                group: "Layout And Organization",
                pages: ["components/layout-and-organization/tab-views/index"]
              }
            ]
          }
        ]
      }
    ]);
  });
});
