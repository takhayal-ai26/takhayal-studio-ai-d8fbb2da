import { fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthModal } from "./AuthModal";

const authModalMocks = vi.hoisted(() => ({
  closeAuthModal: vi.fn(),
  navigate: vi.fn(),
  user: null as null | { id: string },
}));

vi.mock("@/context/AppContext", () => ({
  useApp: () => ({
    authModalOpen: true,
    authModalTab: "signup",
    closeAuthModal: authModalMocks.closeAuthModal,
  }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: authModalMocks.user,
  }),
}));

vi.mock("@/hooks/useMedia", () => ({
  useMedia: () => ({
    getUrlByName: () => "/auth-visual.jpg",
  }),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => authModalMocks.navigate,
  };
});

vi.mock("@/i18n/LanguageContext", () => ({
  useLanguage: () => ({
    lang: "en",
    t: {
      auth: {
        alreadyHaveAccount: "Already have an account?",
        arabicFirstBadge: "Arabic-first",
        backToOptions: "Back",
        brandTagline: "Create with Takhayal",
        campaignCreatives: "Campaign creatives",
        confirmPassword: "Confirm password",
        continueWithApple: "Continue with Apple",
        continueWithEmail: "Continue with email",
        continueWithGoogle: "Continue with Google",
        createAccount: "Create account",
        dontHaveAccount: "Don't have an account?",
        email: "Email",
        emailPlaceholder: "you@example.com",
        logIn: "Log in",
        name: "Name",
        or: "or",
        password: "Password",
        productShots: "Product shots",
        signUp: "Sign up",
        socialVisuals: "Social visuals",
        startCreatingWith: "Start creating with Takhayal",
        turnIdeas: "Turn ideas into visuals.",
        yourName: "Your name",
      },
    },
  }),
}));

describe("AuthModal", () => {
  beforeEach(() => {
    authModalMocks.closeAuthModal.mockClear();
    authModalMocks.navigate.mockClear();
    authModalMocks.user = null;
    sessionStorage.clear();
  });

  it("closes when Escape is pressed", () => {
    render(<AuthModal />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(authModalMocks.closeAuthModal).toHaveBeenCalled();
  });

  it("closes and redirects when a user logs in while the modal is open", async () => {
    authModalMocks.user = { id: "user-1" };
    sessionStorage.setItem("redirectAfterLogin", "/gallery");

    render(<AuthModal />);

    await waitFor(() => {
      expect(authModalMocks.closeAuthModal).toHaveBeenCalled();
      expect(authModalMocks.navigate).toHaveBeenCalledWith("/gallery", { replace: true });
    });
    expect(sessionStorage.getItem("redirectAfterLogin")).toBeNull();
  });
});
