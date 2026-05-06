import { describe, expect, it } from "vitest";
import { isGenerationJobInProgress } from "./creationPanelState";
import { validateReferenceImageUpload } from "./useReferenceImageUploads";
import {
  canClickStudioGenerate,
  getStudioGenerationBlockReason,
} from "./useStudioGenerationSubmit";

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

describe("CreationPanel reference image uploads", () => {
  it("rejects oversized image uploads before storage work starts", () => {
    const file = new File([new Uint8Array(11 * 1024 * 1024)], "large.png", { type: "image/png" });

    expect(validateReferenceImageUpload(file, { currentCount: 0, maxImages: 1 })).toBe("oversized");
  });
});

describe("CreationPanel generation submit guards", () => {
  const readyState = {
    prompt: "A cinematic portrait",
    isGenerationBusy: false,
    hasModel: true,
    isUploading: false,
    hasPendingUploads: false,
    isAuthenticated: true,
    credits: 4,
    cost: 2,
  };

  it("blocks submit while reference uploads are unresolved", () => {
    const reason = getStudioGenerationBlockReason({
      ...readyState,
      hasPendingUploads: true,
    });

    expect(reason).toBe("pending_uploads");
    expect(canClickStudioGenerate(reason)).toBe(false);
  });

  it("lets unauthenticated users click generate so auth can open", () => {
    const reason = getStudioGenerationBlockReason({
      ...readyState,
      isAuthenticated: false,
    });

    expect(reason).toBe("auth_required");
    expect(canClickStudioGenerate(reason)).toBe(true);
  });

  it("lets low-credit users click generate so upgrade can open", () => {
    const reason = getStudioGenerationBlockReason({
      ...readyState,
      credits: 1,
    });

    expect(reason).toBe("insufficient_credits");
    expect(canClickStudioGenerate(reason)).toBe(true);
  });
});
