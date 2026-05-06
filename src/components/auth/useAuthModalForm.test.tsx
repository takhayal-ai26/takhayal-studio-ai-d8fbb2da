import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthModalForm } from "./useAuthModalForm";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
      signInWithOAuth: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}));

function submitEvent() {
  return {
    preventDefault: vi.fn(),
  } as unknown as React.FormEvent;
}

describe("useAuthModalForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resets loading when OAuth throws", async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useAuthModalForm({
      initialTab: "signup",
      language: "en",
      authRedirectUrl: "https://takhayal.ai/auth/callback",
      resetRedirectUrl: "https://takhayal.ai/auth/reset",
    }));

    await act(async () => {
      await result.current.handleGoogle();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Something went wrong. Please try again.");
  });

  it("resets loading when email login throws", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useAuthModalForm({
      initialTab: "login",
      language: "en",
      authRedirectUrl: "https://takhayal.ai/auth/callback",
      resetRedirectUrl: "https://takhayal.ai/auth/reset",
    }));

    act(() => {
      result.current.setEmail("hello@takhayal.ai");
      result.current.setPassword("password123");
    });

    await act(async () => {
      await result.current.handleSubmit(submitEvent());
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Something went wrong. Please try again.");
  });

  it("prevents signup when passwords do not match", async () => {
    const { result } = renderHook(() => useAuthModalForm({
      initialTab: "signup",
      language: "en",
      authRedirectUrl: "https://takhayal.ai/auth/callback",
      resetRedirectUrl: "https://takhayal.ai/auth/reset",
    }));

    act(() => {
      result.current.setEmail("hello@takhayal.ai");
      result.current.setPassword("password123");
      result.current.setConfirmPassword("different123");
    });

    await act(async () => {
      await result.current.handleSubmit(submitEvent());
    });

    expect(result.current.error).toBe("Passwords do not match.");
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("clears form mode messages when switching tabs", () => {
    const { result } = renderHook(() => useAuthModalForm({
      initialTab: "signup",
      language: "en",
      authRedirectUrl: "https://takhayal.ai/auth/callback",
      resetRedirectUrl: "https://takhayal.ai/auth/reset",
    }));

    act(() => {
      result.current.showEmailOptions();
      result.current.setError("Broken");
      result.current.setSuccessMessage("Sent");
      result.current.selectTab("login");
    });

    expect(result.current.tab).toBe("login");
    expect(result.current.showEmailForm).toBe(false);
    expect(result.current.showForgotPassword).toBe(false);
    expect(result.current.error).toBe("");
    expect(result.current.successMessage).toBe("");
  });

  it("opens the forgot-password form from login mode", () => {
    const { result } = renderHook(() => useAuthModalForm({
      initialTab: "login",
      language: "en",
      authRedirectUrl: "https://takhayal.ai/auth/callback",
      resetRedirectUrl: "https://takhayal.ai/auth/reset",
    }));

    act(() => {
      result.current.showEmailOptions();
      result.current.openForgotPassword();
    });

    expect(result.current.showForgotPassword).toBe(true);
    expect(result.current.showEmailForm).toBe(false);
  });

  it("shows a success message after a password reset email is sent", async () => {
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({ error: null } as any);
    const { result } = renderHook(() => useAuthModalForm({
      initialTab: "login",
      language: "en",
      authRedirectUrl: "https://takhayal.ai/auth/callback",
      resetRedirectUrl: "https://takhayal.ai/auth/reset",
    }));

    act(() => {
      result.current.setEmail("hello@takhayal.ai");
    });

    await act(async () => {
      await result.current.handleForgotPassword(submitEvent());
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.successMessage).toBe("Password reset link sent. Check your email.");
  });

  it("resets loading when password reset throws", async () => {
    vi.mocked(supabase.auth.resetPasswordForEmail).mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useAuthModalForm({
      initialTab: "login",
      language: "en",
      authRedirectUrl: "https://takhayal.ai/auth/callback",
      resetRedirectUrl: "https://takhayal.ai/auth/reset",
    }));

    act(() => {
      result.current.setEmail("hello@takhayal.ai");
    });

    await act(async () => {
      await result.current.handleForgotPassword(submitEvent());
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Something went wrong. Please try again.");
  });
});
