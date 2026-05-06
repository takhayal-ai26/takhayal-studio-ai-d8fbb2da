import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StudioGenerationFeed } from "./StudioGenerationFeed";

const refetch = vi.fn();

vi.mock("@/hooks/useGenerationJobs", () => ({
  useGenerationJobs: () => ({
    jobs: [],
    loading: false,
    retryJob: vi.fn(),
    refetch,
  }),
}));

vi.mock("@/i18n/LanguageContext", () => ({
  useLanguage: () => ({
    lang: "en",
    t: {
      studio: {
        generating: "Generating",
        failedToLoad: "Failed",
        retry: "Retry",
      },
    },
  }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

describe("StudioGenerationFeed", () => {
  it("refetches when a new studio job is announced", () => {
    render(<StudioGenerationFeed section="featured" />);

    act(() => {
      window.dispatchEvent(new CustomEvent("takhayal:studio:recent-job", {
        detail: { jobId: "job-1" },
      }));
    });

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
