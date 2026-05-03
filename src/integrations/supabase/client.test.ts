import { afterEach, describe, expect, it, vi } from "vitest";

async function loadClientWithoutEnv() {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", "");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
  return import("./client");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Supabase fallback client", () => {
  it("uses the no-op client when browser env vars are missing", async () => {
    const { supabase, supabaseConfigMissing } = await loadClientWithoutEnv();

    expect(supabaseConfigMissing).toBe(true);
    await expect(
      supabase.from("platform_config").select("config_key").eq("config_key", "video_hero_enabled")
    ).resolves.toEqual({ data: [], error: null });
  });

  it("returns a safe function error instead of throwing during local smoke tests", async () => {
    const { supabase } = await loadClientWithoutEnv();

    await expect(supabase.functions.invoke("create-payment-checkout")).resolves.toMatchObject({
      data: { success: false, error: "platform_not_configured" },
      error: { message: "Supabase is not configured." },
    });
  });
});
