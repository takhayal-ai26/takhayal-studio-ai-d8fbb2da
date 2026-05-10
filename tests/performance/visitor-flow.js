import { sleep } from 'k6';
import http from 'k6/http';
import { buildUrl, checkStatus, requestParams, safeLoadOptions } from './config.js';

export const options = safeLoadOptions;

const visitorRoutes = [
  { name: 'home-ar', path: '/ar' },
  { name: 'tools-directory-ar', path: '/ar/tools' },
  { name: 'generate-tool-page-ar', path: '/ar/tools/generate' },
  { name: 'pricing-ar', path: '/ar/pricing' },
  { name: 'community-ar', path: '/ar/community' },
  { name: 'templates-ar', path: '/ar/templates' },
  { name: 'models-ar', path: '/ar/models' },
  { name: 'seo-landing-ar', path: '/ar/ai-tools-for-arabic-brands' },
  { name: 'about-ar', path: '/ar/about' },
  { name: 'contact-ar', path: '/ar/contact' },
];

// Skipped on purpose:
// - /ar/studio and /ar/gallery can initialize heavier app/user data surfaces.
// - /ar/checkout and /admin routes are protected or operational surfaces.
// - Supabase generation functions are not visited here because they can trigger paid provider work.

export default function () {
  for (const route of visitorRoutes) {
    const res = http.get(buildUrl(route.path), requestParams(route.name));

    checkStatus(res, `GET ${route.path}`);
    sleep(0.5);
  }
}
