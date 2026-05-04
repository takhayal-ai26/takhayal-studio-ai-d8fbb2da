import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  GenerateButton,
  MAX_IMAGE_UPLOAD_BYTES,
  generationHandoffUrl,
  isOversizedImage,
} from "./ux";

describe("image upload guards", () => {
  it("allows files at the configured size limit", () => {
    const file = new File([new Uint8Array(MAX_IMAGE_UPLOAD_BYTES)], "limit.png", {
      type: "image/png",
    });

    expect(isOversizedImage(file)).toBe(false);
  });

  it("rejects files above the configured size limit", () => {
    const file = new File([new Uint8Array(MAX_IMAGE_UPLOAD_BYTES + 1)], "large.png", {
      type: "image/png",
    });

    expect(isOversizedImage(file)).toBe(true);
  });
});

describe("generation handoff URLs", () => {
  it("preserves the source image and only includes defined extras", () => {
    expect(
      generationHandoffUrl("/video/generate-video", "https://cdn.example.com/image one.png", {
        modelId: "kling",
        empty: "",
        missing: undefined,
      })
    ).toBe("/video/generate-video?imageUrl=https%3A%2F%2Fcdn.example.com%2Fimage+one.png&modelId=kling");
  });
});

describe("GenerateButton", () => {
  it("prevents double submission while loading", () => {
    render(
      <GenerateButton loading credits={24} loadingLabel="Generating">
        Generate
      </GenerateButton>
    );

    expect(screen.getByRole("button", { name: /generating/i })).toBeDisabled();
  });
});
