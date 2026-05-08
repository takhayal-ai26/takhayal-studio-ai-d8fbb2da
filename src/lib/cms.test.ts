import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LEGAL_POLICY_TYPES,
  getPlanFeatureBullets,
  legalPolicyUpdatePayload,
  mergeTranslationOverrideRows,
  sanitizeLegalPolicyHtml,
} from "./cms";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("translation override merging", () => {
  it("merges Supabase rows over local fallback overrides by language", () => {
    const merged = mergeTranslationOverrideRows(
      [
        {
          key: "nav.pricing",
          section: "Navigation",
          value_en: "Plans",
          value_ar: "الباقات",
        },
        {
          key: "landing.heroSubtitle",
          section: "Home",
          value_en: "Create campaigns without design bottlenecks",
          value_ar: null,
        },
      ],
      {
        en: { "nav.pricing": "Local pricing", "nav.tools": "Local tools" },
        ar: { "landing.heroSubtitle": "محلي", "nav.tools": "الأدوات" },
      }
    );

    expect(merged.en).toMatchObject({
      "nav.pricing": "Plans",
      "landing.heroSubtitle": "Create campaigns without design bottlenecks",
      "nav.tools": "Local tools",
    });
    expect(merged.ar).toMatchObject({
      "nav.pricing": "الباقات",
      "landing.heroSubtitle": "محلي",
      "nav.tools": "الأدوات",
    });
  });
});

describe("pricing feature bullets", () => {
  it("uses pricing_plans.features before legacy pricing_plan_features rows", () => {
    const bullets = getPlanFeatureBullets(
      {
        id: "creator",
        features: [
          { en: "Admin managed plan feature", ar: "ميزة من الإدارة" },
        ],
      },
      [
        {
          id: "legacy-1",
          plan_id: "creator",
          text_en: "Legacy feature",
          text_ar: "ميزة قديمة",
          active: true,
          sort_order: 1,
        },
      ]
    );

    expect(bullets).toEqual([{ en: "Admin managed plan feature", ar: "ميزة من الإدارة" }]);
  });

  it("falls back to active legacy feature rows when a plan has no JSON features", () => {
    const bullets = getPlanFeatureBullets(
      { id: "starter", features: [] },
      [
        {
          id: "legacy-2",
          plan_id: "starter",
          text_en: "Second",
          text_ar: "الثانية",
          active: true,
          sort_order: 2,
        },
        {
          id: "legacy-1",
          plan_id: "starter",
          text_en: "First",
          text_ar: "الأولى",
          active: true,
          sort_order: 1,
        },
        {
          id: "legacy-hidden",
          plan_id: "starter",
          text_en: "Hidden",
          text_ar: "مخفية",
          active: false,
          sort_order: 0,
        },
      ]
    );

    expect(bullets).toEqual([
      { en: "First", ar: "الأولى" },
      { en: "Second", ar: "الثانية" },
    ]);
  });
});

describe("legal policy coverage", () => {
  it("keeps terms, privacy, and refund editable in admin", () => {
    expect(LEGAL_POLICY_TYPES).toEqual(["terms", "privacy", "refund"]);
  });

  it("removes unsafe HTML from legal policy content while preserving formatting", () => {
    const html = `
      <h2 onclick="alert('xss')">Terms</h2>
      <p>Allowed <strong>copy</strong><img src=x onerror="alert('xss')" /></p>
      <script>alert('xss')</script>
      <a href="javascript:alert('xss')" target="_blank">Bad link</a>
      <a href="mailto:support@takhayal.ai">Support</a>
    `;

    const sanitized = sanitizeLegalPolicyHtml(html);

    expect(sanitized).toContain("<h2>Terms</h2>");
    expect(sanitized).toContain("<strong>copy</strong>");
    expect(sanitized).toContain('<a>Bad link</a>');
    expect(sanitized).toContain('<a href="mailto:support@takhayal.ai">Support</a>');
    expect(sanitized).not.toMatch(/script|onclick|onerror|javascript:|<img/i);
  });

  it("keeps legal policy content visible when the DOM parser is unavailable", () => {
    const html = "<h2 onclick=\"alert('xss')\">Terms</h2><script>alert('xss')</script>";
    const browserSanitized = sanitizeLegalPolicyHtml(html);

    vi.stubGlobal("document", undefined);

    expect(sanitizeLegalPolicyHtml(html)).toBe(browserSanitized);
    expect(sanitizeLegalPolicyHtml(html)).toBe("<h2>Terms</h2>");
  });

  it("builds sanitized legal policy update payloads", () => {
    expect(
      legalPolicyUpdatePayload(
        '<p onclick="alert(1)">Terms</p>',
        '<p>الشروط</p><script>alert(1)</script>',
        '2026-05-08T09:00:00.000Z'
      )
    ).toEqual({
      content_en: '<p>Terms</p>',
      content_ar: '<p>الشروط</p>',
      last_updated: '2026-05-08T09:00:00.000Z',
    });
  });
});
