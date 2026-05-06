import { describe, expect, it, vi } from "vitest";
import {
  GenerationJobError,
  assertUsableGenerationJob,
  deductCredits,
  makeCreditRefunder,
  markJobCompleted,
  markJobFailed,
  markJobGenerating,
} from "./jobs";

function updateChain() {
  return {
    eq: vi.fn().mockResolvedValue({ error: null }),
  };
}

describe("generation job helpers", () => {
  it("rejects missing, forbidden, and completed jobs", () => {
    expect(() => assertUsableGenerationJob(null, "user-1")).toThrow(GenerationJobError);
    expect(() => assertUsableGenerationJob({ id: "job-1", user_id: "user-2", status: "queued" }, "user-1")).toThrow("Forbidden");
    expect(() => assertUsableGenerationJob({ id: "job-1", user_id: "user-1", status: "completed" }, "user-1")).toThrow("Generation job already completed");
  });

  it("allows the owner to reuse an unfinished job", () => {
    expect(() => assertUsableGenerationJob({ id: "job-1", user_id: "user-1", status: "failed" }, "user-1")).not.toThrow();
  });

  it("deducts credits through the existing RPC shape", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: { success: false, error: "insufficient_credits" } }),
    };

    const result = await deductCredits(supabase, {
      userId: "user-1",
      amount: 5,
      modelId: "model-1",
      resolution: "2K",
      toolId: "studio",
    });

    expect(result).toEqual({ success: false, error: "insufficient_credits" });
    expect(supabase.rpc).toHaveBeenCalledWith("deduct_credits", {
      p_user_id: "user-1",
      p_amount: 5,
      p_model_id: "model-1",
      p_resolution: "2K",
      p_tool_id: "studio",
    });
  });

  it("refunds charged credits at most once", async () => {
    const supabase = { rpc: vi.fn().mockResolvedValue({ data: null, error: null }) };
    const refunder = makeCreditRefunder();

    refunder.trackCharge("user-1", 7);
    await refunder.refund(supabase);
    await refunder.refund(supabase);

    expect(supabase.rpc).toHaveBeenCalledTimes(1);
    expect(supabase.rpc).toHaveBeenCalledWith("refund_credits", { p_user_id: "user-1", p_amount: 7 });
  });

  it("marks job statuses with existing generation_logs updates", async () => {
    const eqChain = updateChain();
    const update = vi.fn().mockReturnValue(eqChain);
    const supabase = { from: vi.fn().mockReturnValue({ update }) };

    await markJobGenerating(supabase, "job-1", { credits_used: 5 });
    await markJobFailed(supabase, "job-2", "provider failed", { credits_used: 0 });
    await markJobCompleted(supabase, "job-3", { image_url: "https://cdn.test/final.png" });

    expect(update).toHaveBeenNthCalledWith(1, { status: "generating", credits_used: 5 });
    expect(update).toHaveBeenNthCalledWith(2, { status: "failed", error_message: "provider failed", credits_used: 0 });
    expect(update).toHaveBeenNthCalledWith(3, { status: "completed", image_url: "https://cdn.test/final.png" });
    expect(eqChain.eq).toHaveBeenCalledTimes(3);
  });
});
