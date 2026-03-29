import { describe, expect, it } from "vitest";

import {
  classifyAppleUrl,
  normalizeHigUrl
} from "../../src/discovery/urlRules.js";

describe("normalizeHigUrl", () => {
  it("normalizes trailing slash variants to a canonical HIG URL", () => {
    expect(
      normalizeHigUrl(
        "https://developer.apple.com/design/human-interface-guidelines/accessibility/"
      )
    ).toBe(
      "https://developer.apple.com/design/human-interface-guidelines/accessibility"
    );
  });

  it("drops fragments when determining canonical page identity", () => {
    expect(
      normalizeHigUrl(
        "https://developer.apple.com/design/human-interface-guidelines/accessibility#vision"
      )
    ).toBe(
      "https://developer.apple.com/design/human-interface-guidelines/accessibility"
    );
  });
});

describe("classifyAppleUrl", () => {
  it("accepts HIG URLs as crawl targets", () => {
    expect(
      classifyAppleUrl(
        "https://developer.apple.com/design/human-interface-guidelines/components/buttons"
      )
    ).toBe("hig");
  });

  it("accepts local HIG path variants for crawler testing and local mirrors", () => {
    expect(
      classifyAppleUrl(
        "http://127.0.0.1:4173/design/human-interface-guidelines/components/buttons"
      )
    ).toBe("hig");
  });

  it("keeps non-HIG Apple docs out of crawl targets", () => {
    expect(
      classifyAppleUrl("https://developer.apple.com/documentation/uikit")
    ).toBe("externalApple");
  });

  it("rejects out-of-scope URLs", () => {
    expect(classifyAppleUrl("https://example.com/anything")).toBe("outOfScope");
  });
});
