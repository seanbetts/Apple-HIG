import fs from "node:fs/promises";

import { describe, expect, it } from "vitest";

const workflowPath = new URL("../../.github/workflows/weekly-sync.yml", import.meta.url);
const fixturePath = new URL("../fixtures/workflows/weekly-sync.expected.yml", import.meta.url);

describe("weekly-sync workflow", () => {
  it("matches the expected scheduled sync workflow", async () => {
    const workflow = await fs.readFile(workflowPath, "utf8");
    const expected = await fs.readFile(fixturePath, "utf8");

    expect(workflow).toBe(expected);
  });
});
