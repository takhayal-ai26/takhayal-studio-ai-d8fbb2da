import { describe, expect, it, vi } from "vitest";
import {
  buildOptimisticJob,
  createGenerationLog,
  fetchGenerationJobs,
  getFunctionErrorMessage,
  markGenerationJobFailed,
  mapGenerationLogToJob,
  normalizeStatus,
} from "./generationJobs";

describe("generation job helpers", () => {
  it("normalizes unknown successful statuses to completed", () => {
    expect(normalizeStatus("queued")).toBe("queued");
    expect(normalizeStatus("processing")).toBe("processing");
    expect(normalizeStatus("mystery")).toBe("completed");
    expect(normalizeStatus(null)).toBe("completed");
  });

  it("maps generation log rows into gallery jobs", () => {
    expect(mapGenerationLogToJob({
      id: "job-1",
      status: "processing",
      prompt: "hello",
      image_url: null,
      ratio: "1:1",
      resolution: null,
      quality_tier: "2K",
      model_id: "model-1",
      credits_used: 4,
      created_at: "2026-05-06T00:00:00.000Z",
      tool_id: "studio",
      input_image_urls: ["https://cdn.test/ref.png"],
    })).toMatchObject({
      id: "job-1",
      status: "processing",
      resolution: "2K",
      tool_id: "studio",
      input_image_urls: ["https://cdn.test/ref.png"],
    });
  });

  it("builds optimistic image and video jobs without changing public shape", () => {
    const imageJob = buildOptimisticJob({
      kind: "image",
      id: "image-job",
      prompt: "image prompt",
      ratio: "1:1",
      qualityTier: "1K",
      modelId: "model-1",
      creditCost: 2,
      sourceTag: "studio",
      createdAt: "2026-05-06T00:00:00.000Z",
    });

    const videoJob = buildOptimisticJob({
      kind: "video",
      id: "video-job",
      prompt: "video prompt",
      ratio: "16:9",
      qualityTier: "HD",
      modelId: "video-model",
      creditCost: 12,
      duration: "5",
      sourceMode: "image-to-video",
      inputImageUrls: ["https://cdn.test/ref.png"],
      createdAt: "2026-05-06T00:00:01.000Z",
    });

    expect(imageJob).toMatchObject({ id: "image-job", status: "queued", media_type: "image", tool_id: "studio" });
    expect(videoJob).toMatchObject({
      id: "video-job",
      media_type: "video",
      duration: "5",
      source_mode: "image-to-video",
      input_image_urls: ["https://cdn.test/ref.png"],
    });
  });

  it("parses Supabase function HTTP errors into readable messages", async () => {
    const response = new Response(JSON.stringify({ error: "insufficient_credits" }), { status: 402 });
    const error = { name: "FunctionsHttpError", message: "Edge Function returned a non-2xx status code", context: response };

    await expect(getFunctionErrorMessage(error)).resolves.toBe("insufficient_credits (402)");
  });

  it("falls back to plain error messages", async () => {
    await expect(getFunctionErrorMessage(new Error("network down"))).resolves.toBe("network down");
    await expect(getFunctionErrorMessage(null)).resolves.toBe("Unknown generation error");
  });

  it("fetches and maps generation jobs through the database helper", async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [{ id: "job-1", status: "completed", prompt: "done", credits_used: 3 }],
      error: null,
    });
    const order = vi.fn().mockReturnValue({ limit });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const supabase = { from: vi.fn().mockReturnValue({ select }) };

    const result = await fetchGenerationJobs(supabase, "user-1");

    expect(result.error).toBeNull();
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0]).toMatchObject({ id: "job-1", status: "completed", credits_used: 3 });
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("keeps fetch failures distinguishable from an empty gallery", async () => {
    const limit = vi.fn().mockResolvedValue({ data: null, error: new Error("offline") });
    const order = vi.fn().mockReturnValue({ limit });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const supabase = { from: vi.fn().mockReturnValue({ select }) };

    const result = await fetchGenerationJobs(supabase, "user-1");

    expect(result.jobs).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });


  it("retries image job creation without a stale model id", async () => {
    const firstSingle = vi.fn().mockResolvedValue({ data: null, error: { code: "23503" } });
    const secondSingle = vi.fn().mockResolvedValue({ data: { id: "job-2" }, error: null });
    const select = vi
      .fn()
      .mockReturnValueOnce({ single: firstSingle })
      .mockReturnValueOnce({ single: secondSingle });
    const insert = vi.fn().mockReturnValue({ select });
    const supabase = { from: vi.fn().mockReturnValue({ insert }) };

    const result = await createGenerationLog(supabase, {
      userId: "user-1",
      prompt: "hello",
      ratio: "1:1",
      qualityTier: "1K",
      modelId: "missing-model",
      creditCost: 2,
      sourceTag: "studio",
    });

    expect(result).toEqual({ id: "job-2", modelId: null, error: null });
    expect(insert).toHaveBeenCalledTimes(2);
    expect(insert).toHaveBeenLastCalledWith(expect.objectContaining({ model_id: null }));
  });

  it("marks generation jobs failed through the database helper", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    const supabase = { from: vi.fn().mockReturnValue({ update }) };

    await expect(markGenerationJobFailed(supabase, "job-3", "provider failed")).resolves.toBeNull();

    expect(update).toHaveBeenCalledWith({ status: "failed", error_message: "provider failed" });
    expect(eq).toHaveBeenCalledWith("id", "job-3");
  });
});
