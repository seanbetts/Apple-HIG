import fs from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { normalizePage } from "../../src/normalization/normalizePage.js";

const fixturePath = new URL("../fixtures/pages/accessibility.raw.json", import.meta.url);

describe("normalizePage", () => {
  it("normalizes canonical fields, links, and Apple changes", async () => {
    const rawPage = JSON.parse(await fs.readFile(fixturePath, "utf8"));

    const page = normalizePage(rawPage);

    expect(page).toEqual({
      sourceUrl:
        "https://developer.apple.com/design/human-interface-guidelines/accessibility",
      canonicalPath: "/accessibility",
      title: "Accessibility",
      description: "Design accessible experiences across Apple platforms.",
      breadcrumbs: [
        "Human Interface Guidelines",
        "Foundations",
        "Accessibility"
      ],
      section: "Foundations",
      appleChanges: [
        {
          label: "Updated",
          date: "2026-02-14",
          raw: "Updated February 14, 2026"
        }
      ],
      internalLinks: ["/components/buttons"],
      externalLinks: ["https://developer.apple.com/documentation/uikit"],
      contentBlocks: [
        {
          type: "heading",
          level: 1,
          text: "Accessibility"
        },
        {
          type: "paragraph",
          text: "Design accessible experiences across Apple platforms."
        }
      ]
    });
  });
});
