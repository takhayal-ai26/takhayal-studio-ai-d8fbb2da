import { useEffect, useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { localizePath, stripLocalePrefix } from '@/lib/localized-routes';

export const SITE_URL = 'https://takhayal.ai';
const DEFAULT_OG_IMAGE = '/og-cover.jpg';
const SITE_NAME = 'Takhayal.ai';
const TWITTER_HANDLE = '@takhayal_ai';

type JsonLd = Record<string, unknown>;

interface PageSeoProps {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  pageType?: string;
  noIndex?: boolean;
  schemas?: JsonLd[];
  includeSiteSchema?: boolean;
  dateModified?: string;
}

function toAbsoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return new URL(pathOrUrl, SITE_URL).toString();
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let node = document.head.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;

  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }

  node.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let node = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;

  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', rel);
    document.head.appendChild(node);
  }

  node.setAttribute('href', href);
}

function upsertAlternate(hreflang: string, href: string) {
  let node = document.head.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`) as HTMLLinkElement | null;

  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', 'alternate');
    node.setAttribute('hreflang', hreflang);
    document.head.appendChild(node);
  }

  node.setAttribute('href', href);
}

export function absoluteUrl(pathOrUrl: string) {
  return toAbsoluteUrl(pathOrUrl);
}

export function PageSeo({
  title,
  description,
  canonicalPath,
  image = DEFAULT_OG_IMAGE,
  pageType = 'WebPage',
  noIndex = false,
  schemas = [],
  includeSiteSchema = true,
  dateModified,
}: PageSeoProps) {
  const { lang } = useLanguage();

  const schemaText = useMemo(() => JSON.stringify(schemas), [schemas]);

  useEffect(() => {
    const basePathname = stripLocalePrefix(canonicalPath || window.location.pathname);
    const canonicalUrl = toAbsoluteUrl(localizePath(basePathname, lang));
    const arabicUrl = toAbsoluteUrl(localizePath(basePathname, 'ar'));
    const englishUrl = toAbsoluteUrl(localizePath(basePathname, 'en'));
    const imageUrl = toAbsoluteUrl(image);
    const locale = lang === 'ar' ? 'ar_KW' : 'en_US';
    const languageCode = lang === 'ar' ? 'ar' : 'en';

    document.title = title;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'author', SITE_NAME);
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', imageUrl);
    upsertMeta('name', 'twitter:site', TWITTER_HANDLE);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', imageUrl);
    upsertMeta('property', 'og:locale', locale);
    if (dateModified) {
      upsertMeta('property', 'article:modified_time', dateModified);
    }
    upsertLink('canonical', canonicalUrl);
    upsertAlternate('ar', arabicUrl);
    upsertAlternate('en', englishUrl);
    upsertAlternate('x-default', arabicUrl);

    document.head.querySelectorAll('script[data-seo-schema="true"]').forEach((node) => node.remove());

    const schemaPayloads: JsonLd[] = [];

    if (includeSiteSchema) {
      schemaPayloads.push(
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          '@id': `${SITE_URL}/#organization`,
          name: SITE_NAME,
          url: SITE_URL,
          logo: toAbsoluteUrl('/favicon.ico'),
          sameAs: [
            'https://instagram.com/takhayal.ai',
            'https://x.com/takhayal_ai',
            'https://linkedin.com/company/takhayal',
          ],
          contactPoint: [
            {
              '@type': 'ContactPoint',
              contactType: 'customer support',
              email: 'support@takhayal.ai',
              availableLanguage: ['Arabic', 'English'],
            },
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: SITE_URL,
          name: SITE_NAME,
          inLanguage: languageCode,
          publisher: {
            '@id': `${SITE_URL}/#organization`,
          },
        },
      );
    }

    schemaPayloads.push({
      '@context': 'https://schema.org',
      '@type': pageType,
      name: title,
      description,
      url: canonicalUrl,
      inLanguage: languageCode,
      isPartOf: {
        '@id': `${SITE_URL}/#website`,
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: imageUrl,
      },
      ...(dateModified ? { dateModified } : {}),
    });

    JSON.parse(schemaText).forEach((schema: JsonLd) => {
      schemaPayloads.push(schema);
    });

    schemaPayloads.forEach((schema) => {
      const node = document.createElement('script');
      node.type = 'application/ld+json';
      node.dataset.seoSchema = 'true';
      node.text = JSON.stringify(schema);
      document.head.appendChild(node);
    });
  }, [canonicalPath, dateModified, description, image, includeSiteSchema, lang, noIndex, pageType, schemaText, title]);

  return null;
}
