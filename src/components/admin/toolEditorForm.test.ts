import { describe, expect, it } from "vitest";
import type { ToolRecord } from "@/hooks/useToolsDB";
import {
  applyToolMediaType,
  applyToolSlug,
  defaultRouteFor,
  normalizeToolFormBeforeSave,
  shouldRefreshRoute,
  validateToolFormBeforeSave,
} from "./toolEditorForm";

const baseForm: Partial<ToolRecord> = {
  title_en: "Upscale",
  slug: "upscale",
  route: "/tools/upscale",
  media_type: "image",
  result_type: "image",
  tool_mode: "standard",
  input_type: "upload",
  icon_name: "Sparkles",
  selected_model_id: "image-model",
  selected_video_model_id: null,
};

describe("tool editor form helpers", () => {
  it("builds default image and video routes from slugs", () => {
    expect(defaultRouteFor("image", "upscale")).toBe("/tools/upscale");
    expect(defaultRouteFor("video", "generate-video")).toBe("/video/generate-video");
    expect(defaultRouteFor("image", "")).toBe("/tools/");
    expect(defaultRouteFor("video")).toBe("/video/");
  });

  it("only refreshes generated tool routes", () => {
    expect(shouldRefreshRoute(undefined)).toBe(true);
    expect(shouldRefreshRoute("/tools/upscale")).toBe(true);
    expect(shouldRefreshRoute("/video/generate-video")).toBe(true);
    expect(shouldRefreshRoute("/campaign/custom-tool")).toBe(false);
    expect(shouldRefreshRoute("/tools/custom/deep-link")).toBe(false);
  });

  it("updates a standard route when the slug changes", () => {
    const nextForm = applyToolSlug(baseForm, "enhance");

    expect(nextForm.slug).toBe("enhance");
    expect(nextForm.route).toBe("/tools/enhance");
  });

  it("preserves custom routes when the slug changes", () => {
    const nextForm = applyToolSlug({ ...baseForm, route: "/campaign/upscale" }, "enhance");

    expect(nextForm.slug).toBe("enhance");
    expect(nextForm.route).toBe("/campaign/upscale");
  });

  it("switches image tools to video defaults", () => {
    const nextForm = applyToolMediaType({
      ...baseForm,
      slug: "launch-clip",
      tool_mode: "guided_image",
      selected_video_model_id: "video-model",
    }, "video");

    expect(nextForm).toMatchObject({
      media_type: "video",
      result_type: "video",
      tool_mode: "video",
      input_type: "prompt",
      icon_name: "Film",
      route: "/video/launch-clip",
      selected_model_id: null,
      selected_video_model_id: "video-model",
    });
  });

  it("normalizes save payloads and keeps custom routes intact", () => {
    const standardRoute = normalizeToolFormBeforeSave({
      ...baseForm,
      slug: "  new-slug  ",
      route: "/tools/old-slug",
    });
    const customRoute = normalizeToolFormBeforeSave({
      ...baseForm,
      slug: "custom-slug",
      route: "/campaign/custom-upscale",
    });

    expect(standardRoute).toMatchObject({ slug: "new-slug", route: "/tools/new-slug" });
    expect(customRoute).toMatchObject({ slug: "custom-slug", route: "/campaign/custom-upscale" });
  });

  it("validates required title and slug before save", () => {
    expect(validateToolFormBeforeSave({ ...baseForm, title_en: " " })).toMatchObject({
      description: "English title is required",
    });
    expect(validateToolFormBeforeSave({ ...baseForm, slug: " " })).toMatchObject({
      description: "Slug is required",
    });
    expect(validateToolFormBeforeSave(baseForm)).toBeNull();
  });
});
