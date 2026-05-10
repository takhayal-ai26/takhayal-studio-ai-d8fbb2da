# Takhayal k6 Performance Tests

These tests provide a safe pre-launch HTTP load check for the public Takhayal website. They do not run a browser, submit forms, log in, or trigger AI generation.

## Prerequisite

Install the k6 CLI:

```sh
brew install k6
```

## Base URL

The default target is production:

```sh
https://takhayal.ai
```

Override it with `BASE_URL` when testing staging, previews, or local preview servers:

```sh
BASE_URL=https://staging.takhayal.ai k6 run tests/performance/homepage-ar.js
BASE_URL=http://127.0.0.1:4173 k6 run tests/performance/visitor-flow.js
```

## Load Profile

All tests use the same safe launch-readiness profile:

- Ramp up to 10 virtual users for 1 minute
- Increase to 50 virtual users for 2 minutes
- Briefly test 100 virtual users for 30 seconds
- Ramp back down to 0 for 1 minute

## Thresholds

Each test fails if:

- HTTP error rate is 1% or higher
- p95 response time is 1000ms or higher
- Fewer than 99% of status checks return `200`

## Commands

Run from the project root:

```sh
npm run test:load:home-ar
npm run test:load:home-en
npm run test:load:visitor
npm run test:load:api
```

Or call k6 directly:

```sh
BASE_URL=https://takhayal.ai k6 run tests/performance/homepage-ar.js
BASE_URL=https://takhayal.ai k6 run tests/performance/homepage-en.js
BASE_URL=https://takhayal.ai k6 run tests/performance/visitor-flow.js
BASE_URL=https://takhayal.ai k6 run tests/performance/api-health.js
```

## Test Coverage

- `homepage-ar.js` checks the real Arabic homepage route: `/ar`
- `homepage-en.js` checks the real English homepage route: `/en`
- `visitor-flow.js` checks safe public Arabic visitor routes including tools, pricing, community, templates, models, an SEO landing page, about, and contact
- `api-health.js` checks the public no-op API health endpoint plus lightweight public health-style routes: `/api/health`, `/robots.txt`, `/sitemap.xml`, and `/favicon.ico`

Protected or stateful APIs are intentionally not load tested until they have auth-safe contracts, test credentials, and read-only fixtures. That includes `/api/auth`, `/api/user`, `/api/credits`, `/api/templates`, and `/api/generation-status`.

Expensive or operational Supabase functions are intentionally skipped, including `generate-image`, `generate-video`, `run-tool`, `check-provider-health`, `notify-contact`, and `create-payment-checkout`.
