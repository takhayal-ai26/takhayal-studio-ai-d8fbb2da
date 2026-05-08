import { describe, expect, it } from "vitest";
import { requirePrerenderRows } from "./prerender-data-guard.mjs";

describe("prerender data guard", () => {
  it("returns fulfilled rows", () => {
    expect(requirePrerenderRows({ status: "fulfilled", value: [{ slug: "flux" }] }, "tool detail")).toEqual([
      { slug: "flux" },
    ]);
  });

  it("fails the build when dynamic prerender data cannot be fetched", () => {
    expect(() =>
      requirePrerenderRows({ status: "rejected", reason: new Error("Network down") }, "tool detail")
    ).toThrow("Unable to prerender tool detail routes: Network down");
  });
});
