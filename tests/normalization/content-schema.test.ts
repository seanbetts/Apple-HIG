import { describe, expect, it } from "vitest";

import { normalizedPageSchema } from "../../src/types/content.js";
import { manifestSchema } from "../../src/types/manifest.js";

describe("normalizedPageSchema", () => {
  it("requires the canonical normalized page fields", () => {
    const result = normalizedPageSchema.safeParse({
      sourceUrl: "https://developer.apple.com/design/human-interface-guidelines/accessibility",
      canonicalPath: "/accessibility",
      title: "Accessibility",
      breadcrumbs: ["Human Interface Guidelines", "Accessibility"],
      appleChanges: [],
      internalLinks: ["/components/buttons"],
      externalLinks: ["https://developer.apple.com/documentation/uikit"],
      contentBlocks: []
    });

    expect(result.success).toBe(true);
  });
});

describe("manifestSchema", () => {
  it("requires the canonical manifest URL buckets", () => {
    const result = manifestSchema.safeParse({
      discoveredUrls: ["https://developer.apple.com/design/human-interface-guidelines/accessibility"],
      processedUrls: ["https://developer.apple.com/design/human-interface-guidelines/accessibility"],
      failedUrls: [],
      removedUrls: []
    });

    expect(result.success).toBe(true);
  });
});
