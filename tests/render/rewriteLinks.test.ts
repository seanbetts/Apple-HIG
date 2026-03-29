import { describe, expect, it } from "vitest";

import { rewriteInternalHigLink } from "../../src/render/rewriteLinks.js";

describe("rewriteInternalHigLink", () => {
  it("rewrites root-relative HIG links to local relative markdown paths", () => {
    expect(rewriteInternalHigLink("/components/buttons", "/accessibility")).toBe(
      "../components/buttons/"
    );
  });

  it("rewrites nested HIG links relative to the current page", () => {
    expect(
      rewriteInternalHigLink("/patterns/navigation/tab-views", "/components/buttons")
    ).toBe("../../patterns/navigation/tab-views/");
  });

  it("preserves fragments on rewritten internal links", () => {
    expect(
      rewriteInternalHigLink("/components/buttons#sizes", "/accessibility")
    ).toBe("../components/buttons/#sizes");
  });

  it("leaves external Apple docs unchanged", () => {
    expect(
      rewriteInternalHigLink(
        "https://developer.apple.com/documentation/uikit",
        "/accessibility"
      )
    ).toBe("https://developer.apple.com/documentation/uikit");
  });
});
