import { describe, expect, it } from "vitest";

import { commands } from "../../src/cli.js";

describe("commands", () => {
  it("registers the top-level CLI commands", () => {
    expect(Object.keys(commands).sort()).toEqual([
      "discover",
      "mintlify",
      "plan",
      "render",
      "sync",
      "verify"
    ]);
  });
});
