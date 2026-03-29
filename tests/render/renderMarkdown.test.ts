import fs from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { renderFrontmatter } from "../../src/render/renderFrontmatter.js";
import { renderMarkdown } from "../../src/render/renderMarkdown.js";

const fixturePath = new URL("../fixtures/pages/accessibility.normalized.json", import.meta.url);

describe("renderFrontmatter", () => {
  it("emits frontmatter in a stable key order with apple_changes", async () => {
    const page = JSON.parse(await fs.readFile(fixturePath, "utf8"));

    expect(renderFrontmatter(page)).toBe(`---
title: Accessibility
source_url: https://developer.apple.com/design/human-interface-guidelines/accessibility
canonical_path: /accessibility
description: Design accessible experiences across Apple platforms.
section: Foundations
breadcrumbs:
  - Human Interface Guidelines
  - Foundations
  - Accessibility
apple_changes:
  - label: Updated
    date: 2026-02-14
    raw: Updated February 14, 2026
internal_links:
  - /components/buttons
external_links:
  - https://developer.apple.com/documentation/uikit
---`);
  });
});

describe("renderMarkdown", () => {
  it("renders headings, paragraphs, lists, tables, and related resources deterministically", async () => {
    const page = JSON.parse(await fs.readFile(fixturePath, "utf8"));

    expect(renderMarkdown(page)).toBe(`---
title: Accessibility
source_url: https://developer.apple.com/design/human-interface-guidelines/accessibility
canonical_path: /accessibility
description: Design accessible experiences across Apple platforms.
section: Foundations
breadcrumbs:
  - Human Interface Guidelines
  - Foundations
  - Accessibility
apple_changes:
  - label: Updated
    date: 2026-02-14
    raw: Updated February 14, 2026
internal_links:
  - /components/buttons
external_links:
  - https://developer.apple.com/documentation/uikit
---

# Accessibility

Design accessible experiences across Apple platforms.

## Overview

Accessible experiences help everyone use your app.

- Support VoiceOver.
- Respect contrast.

| Control | Minimum size |
| --- | --- |
| Button | 44 x 44 pt |

## Related resources

- [Buttons](../components/buttons/)
- [UIKit](https://developer.apple.com/documentation/uikit)
`);
  });
});
