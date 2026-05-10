import { sleep } from 'k6';
import http from 'k6/http';
import { buildUrl, checkStatus, requestParams, safeLoadOptions } from './config.js';

export const options = safeLoadOptions;

const healthRoutes = [
  { name: 'api-health', path: '/api/health' },
  { name: 'robots', path: '/robots.txt' },
  { name: 'sitemap', path: '/sitemap.xml' },
  { name: 'favicon', path: '/favicon.ico' },
];

// Future API checks that need auth-safe contracts and test credentials:
// - /api/auth
// - /api/user
// - /api/credits
// - /api/templates
// - /api/generation-status?job_id=<safe-test-job-id>
//
// Supabase functions such as generate-image, generate-video, run-tool,
// check-provider-health, notify-contact, and create-payment-checkout remain
// intentionally excluded because they can require auth, send email, touch
// payments, or call paid AI providers.

export default function () {
  for (const route of healthRoutes) {
    const res = http.get(buildUrl(route.path), requestParams(route.name));

    checkStatus(res, `GET ${route.path}`);
    sleep(0.5);
  }
}
