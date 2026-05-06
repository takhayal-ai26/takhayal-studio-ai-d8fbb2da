export const LEGAL_POLICY_TYPES = ['terms', 'privacy', 'refund'] as const;

export type LegalPolicyType = (typeof LEGAL_POLICY_TYPES)[number];

export type TranslationOverrideRow = {
  key: string;
  section?: string | null;
  value_en?: string | null;
  value_ar?: string | null;
};

export type TranslationOverrideMap = {
  en: Record<string, string>;
  ar: Record<string, string>;
};

export const EMPTY_TRANSLATION_OVERRIDES: TranslationOverrideMap = {
  en: {},
  ar: {},
};

export function mergeTranslationOverrideRows(
  rows: TranslationOverrideRow[] | null | undefined,
  localFallback: TranslationOverrideMap = EMPTY_TRANSLATION_OVERRIDES
): TranslationOverrideMap {
  const merged: TranslationOverrideMap = {
    en: { ...localFallback.en },
    ar: { ...localFallback.ar },
  };

  for (const row of rows || []) {
    if (!row?.key) continue;
    if (typeof row.value_en === 'string' && row.value_en.length > 0) {
      merged.en[row.key] = row.value_en;
    }
    if (typeof row.value_ar === 'string' && row.value_ar.length > 0) {
      merged.ar[row.key] = row.value_ar;
    }
  }

  return merged;
}

export type PlanFeatureBullet = {
  en: string;
  ar: string;
};

export type PlanWithJsonFeatures = {
  id: string;
  features?: unknown;
};

export type LegacyPricingFeatureRow = {
  id?: string;
  plan_id: string;
  text_en?: string | null;
  text_ar?: string | null;
  sort_order?: number | null;
  active?: boolean | null;
};

export function getPlanFeatureBullets(
  plan: PlanWithJsonFeatures,
  legacyRows: LegacyPricingFeatureRow[] = []
): PlanFeatureBullet[] {
  const jsonFeatures = Array.isArray(plan.features)
    ? plan.features
        .map((feature) => {
          const row = feature && typeof feature === 'object'
            ? feature as Partial<PlanFeatureBullet>
            : {};
          return {
            en: row.en?.trim() || '',
            ar: row.ar?.trim() || '',
          };
        })
        .filter((feature) => feature.en || feature.ar)
    : [];

  if (jsonFeatures.length > 0) return jsonFeatures;

  return legacyRows
    .filter((row) => row.plan_id === plan.id && row.active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((row) => ({
      en: row.text_en?.trim() || '',
      ar: row.text_ar?.trim() || '',
    }))
    .filter((feature) => feature.en || feature.ar);
}

export function cmsText(
  lang: 'en' | 'ar',
  values: { en?: string | null; ar?: string | null },
  fallback = ''
) {
  return (lang === 'ar' ? values.ar || values.en : values.en || values.ar) || fallback;
}
