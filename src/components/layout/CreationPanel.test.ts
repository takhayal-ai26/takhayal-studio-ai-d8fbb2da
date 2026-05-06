import { describe, expect, it } from "vitest";
import { isGenerationJobInProgress } from "./creationPanelState";

describe("CreationPanel generation state", () => {
  it("keeps the generate button loading while the submitted job is still in progress", () => {
    expect(isGenerationJobInProgress([
      { id: "job-1", status: "generating" },
    ], "job-1")).toBe(true);
  });

  it("releases the generate button once the submitted job is complete or failed", () => {
    expect(isGenerationJobInProgress([
      { id: "job-1", status: "completed" },
    ], "job-1")).toBe(false);
    expect(isGenerationJobInProgress([
      { id: "job-2", status: "failed" },
    ], "job-2")).toBe(false);
  });
});
