import { describe, expect, it, vi } from "vitest";
import {
  getFalImageResultUrl,
  pollFalQueueUntilDone,
  runFalQueue,
} from "./fal";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(typeof body === "string" ? body : JSON.stringify(body)),
  } as unknown as Response;
}

describe("fal queue helpers", () => {
  it("extracts image URLs from supported provider response shapes", () => {
    expect(getFalImageResultUrl({ images: [{ url: "https://cdn.test/image.png" }] })).toBe("https://cdn.test/image.png");
    expect(getFalImageResultUrl({ image: { url: "https://cdn.test/single.png" } })).toBe("https://cdn.test/single.png");
    expect(getFalImageResultUrl({ output: { url: "https://cdn.test/output.png" } })).toBe("https://cdn.test/output.png");
    expect(getFalImageResultUrl({ output: "https://cdn.test/string.png" })).toBe("https://cdn.test/string.png");
    expect(getFalImageResultUrl({ output: [{ url: "https://cdn.test/array.png" }] })).toBe("https://cdn.test/array.png");
    expect(getFalImageResultUrl({})).toBeNull();
  });

  it("polls until a queued request completes", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ status: "IN_PROGRESS" }))
      .mockResolvedValueOnce(jsonResponse({ status: "COMPLETED" }))
      .mockResolvedValueOnce(jsonResponse({ images: [{ url: "https://cdn.test/final.png" }] }));

    const result = await pollFalQueueUntilDone(
      { status_url: "https://fal.test/status", response_url: "https://fal.test/result" },
      { Authorization: "Key test" },
      { maxAttempts: 3, intervalMs: 0, fetchFn, wait: vi.fn().mockResolvedValue(undefined), logEvery: 999 },
    );

    expect(result).toEqual({ data: { images: [{ url: "https://cdn.test/final.png" }] } });
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it("returns an error when the queue reports failure", async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(jsonResponse({ status: "FAILED", detail: "bad prompt" }));

    const result = await pollFalQueueUntilDone(
      { status_url: "https://fal.test/status", response_url: "https://fal.test/result" },
      { Authorization: "Key test" },
      { maxAttempts: 1, intervalMs: 0, fetchFn, wait: vi.fn().mockResolvedValue(undefined) },
    );

    expect(result.error).toContain("Generation failed");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("submits and polls queue runs", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ status_url: "https://fal.test/status", response_url: "https://fal.test/result" }))
      .mockResolvedValueOnce(jsonResponse({ status: "COMPLETED" }))
      .mockResolvedValueOnce(jsonResponse({ image: { url: "https://cdn.test/run.png" } }));

    const result = await runFalQueue(
      "fal-ai/example",
      { prompt: "test" },
      { Authorization: "Key test", "Content-Type": "application/json" },
      { fetchFn, wait: vi.fn().mockResolvedValue(undefined), maxAttempts: 1, intervalMs: 0 },
    );

    expect(result.data).toEqual({ image: { url: "https://cdn.test/run.png" } });
    expect(fetchFn).toHaveBeenCalledWith(
      "https://queue.fal.run/fal-ai/example",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
