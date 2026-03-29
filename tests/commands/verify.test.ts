import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { verifyGeneratedContent } from "../../src/commands/verify.js";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "apple-hig-verify-"));
  tempDirs.push(directory);
  return directory;
}

afterAll(async () => {
  await Promise.all(tempDirs.map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

describe("verifyGeneratedContent", () => {
  it("reports malformed frontmatter", async () => {
    const rootDir = await makeTempDir();
    const pagePath = path.join(rootDir, "content", "accessibility", "index.md");

    await fs.mkdir(path.dirname(pagePath), { recursive: true });
    await fs.writeFile(pagePath, "# Accessibility\n", "utf8");

    const result = await verifyGeneratedContent({
      contentRoot: path.join(rootDir, "content")
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      `${pagePath}: missing frontmatter`
    );
  });

  it("reports broken internal canonical links", async () => {
    const rootDir = await makeTempDir();
    const pagePath = path.join(rootDir, "content", "accessibility", "index.md");

    await fs.mkdir(path.dirname(pagePath), { recursive: true });
    await fs.writeFile(
      pagePath,
      `---
title: Accessibility
source_url: https://developer.apple.com/design/human-interface-guidelines/accessibility
canonical_path: /accessibility
breadcrumbs:
  - Human Interface Guidelines
apple_changes:
  - label: Updated
    raw: Updated February 14, 2026
internal_links:
  - /components/buttons
external_links: []
---

# Accessibility
`,
      "utf8"
    );

    const result = await verifyGeneratedContent({
      contentRoot: path.join(rootDir, "content")
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      `${pagePath}: broken internal link /components/buttons`
    );
  });

  it("passes valid generated content", async () => {
    const rootDir = await makeTempDir();
    const accessibilityPath = path.join(rootDir, "content", "accessibility", "index.md");
    const buttonsPath = path.join(rootDir, "content", "components", "buttons", "index.md");

    await fs.mkdir(path.dirname(accessibilityPath), { recursive: true });
    await fs.mkdir(path.dirname(buttonsPath), { recursive: true });
    await fs.writeFile(
      accessibilityPath,
      `---
title: Accessibility
source_url: https://developer.apple.com/design/human-interface-guidelines/accessibility
canonical_path: /accessibility
breadcrumbs:
  - Human Interface Guidelines
apple_changes:
  - label: Updated
    raw: Updated February 14, 2026
internal_links:
  - /components/buttons
external_links:
  - https://developer.apple.com/documentation/uikit
---

# Accessibility
`,
      "utf8"
    );
    await fs.writeFile(
      buttonsPath,
      `---
title: Buttons
source_url: https://developer.apple.com/design/human-interface-guidelines/components/buttons
canonical_path: /components/buttons
breadcrumbs:
  - Human Interface Guidelines
apple_changes:
  - label: Updated
    raw: Updated February 14, 2026
internal_links: []
external_links: []
---

# Buttons
`,
      "utf8"
    );

    const result = await verifyGeneratedContent({
      contentRoot: path.join(rootDir, "content")
    });

    expect(result).toEqual({
      ok: true,
      errors: []
    });
  });
});
