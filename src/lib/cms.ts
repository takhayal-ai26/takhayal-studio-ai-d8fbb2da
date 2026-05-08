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

const LEGAL_POLICY_ALLOWED_TAGS = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'em',
  'h1',
  'h2',
  'hr',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'strong',
  'ul',
]);

const LEGAL_POLICY_DROP_TAGS = new Set([
  'base',
  'button',
  'embed',
  'form',
  'iframe',
  'img',
  'input',
  'link',
  'math',
  'meta',
  'object',
  'script',
  'select',
  'style',
  'svg',
  'textarea',
]);

const LEGAL_POLICY_SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const LEGAL_POLICY_DROP_TAG_PATTERN = Array.from(LEGAL_POLICY_DROP_TAGS).join('|');
const LEGAL_POLICY_WRAPPED_DROP_TAG_RE = new RegExp(
  `<\\s*(${LEGAL_POLICY_DROP_TAG_PATTERN})\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*\\1\\s*>`,
  'gi'
);
const LEGAL_POLICY_SELF_CLOSING_DROP_TAG_RE = new RegExp(
  `<\\s*(${LEGAL_POLICY_DROP_TAG_PATTERN})\\b[^>]*\\/?\\s*>`,
  'gi'
);
const LEGAL_POLICY_TAG_RE = /<\s*(\/?)\s*([a-z0-9-]+)([^>]*)>/gi;

function isSafeLegalPolicyHref(href: string) {
  try {
    const url = new URL(href.trim(), 'https://takhayal.ai');
    return LEGAL_POLICY_SAFE_LINK_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

function escapeLegalPolicyAttribute(value: string) {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function removeDroppedLegalPolicyElements(html: string) {
  return html
    .replace(LEGAL_POLICY_WRAPPED_DROP_TAG_RE, '')
    .replace(LEGAL_POLICY_SELF_CLOSING_DROP_TAG_RE, '');
}

function getLegalPolicyHref(attrs: string) {
  const hrefMatch = attrs.match(/\s href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  return hrefMatch?.[1] || hrefMatch?.[2] || hrefMatch?.[3] || '';
}

function sanitizeLegalPolicyTag(_match: string, slash: string, rawTag: string, attrs = '') {
  const tag = rawTag.toLowerCase();
  if (!LEGAL_POLICY_ALLOWED_TAGS.has(tag)) return '';

  if (slash) {
    return tag === 'br' || tag === 'hr' ? '' : `</${tag}>`;
  }

  if (tag === 'br' || tag === 'hr') return `<${tag}>`;

  if (tag === 'a') {
    const href = getLegalPolicyHref(attrs);
    return href && isSafeLegalPolicyHref(href)
      ? `<a href="${escapeLegalPolicyAttribute(href.trim())}">`
      : '<a>';
  }

  return `<${tag}>`;
}

function sanitizeLegalPolicyHtmlString(html: string) {
  return removeDroppedLegalPolicyElements(html || '')
    .replace(LEGAL_POLICY_TAG_RE, sanitizeLegalPolicyTag)
    .trim();
}

export function sanitizeLegalPolicyHtml(html: string) {
  if (typeof document === 'undefined') return sanitizeLegalPolicyHtmlString(html);

  const template = document.createElement('template');
  template.innerHTML = html || '';

  const sanitizeChildren = (source: ParentNode, target: ParentNode) => {
    source.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        target.appendChild(document.createTextNode(child.textContent || ''));
        return;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) return;

      const element = child as HTMLElement;
      const tag = element.tagName.toLowerCase();

      if (LEGAL_POLICY_DROP_TAGS.has(tag)) return;

      if (!LEGAL_POLICY_ALLOWED_TAGS.has(tag)) {
        sanitizeChildren(element, target);
        return;
      }

      const cleanElement = document.createElement(tag);

      if (tag === 'a') {
        const href = element.getAttribute('href');
        if (href && isSafeLegalPolicyHref(href)) {
          cleanElement.setAttribute('href', href.trim());
        }
      }

      sanitizeChildren(element, cleanElement);
      target.appendChild(cleanElement);
    });
  };

  const cleanContainer = document.createElement('div');
  sanitizeChildren(template.content, cleanContainer);

  return cleanContainer.innerHTML.trim();
}

export function legalPolicyUpdatePayload(contentEn: string, contentAr: string, lastUpdated = new Date().toISOString()) {
  return {
    content_en: sanitizeLegalPolicyHtml(contentEn),
    content_ar: sanitizeLegalPolicyHtml(contentAr),
    last_updated: lastUpdated,
  };
}
