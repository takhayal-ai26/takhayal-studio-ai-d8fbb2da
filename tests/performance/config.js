import { check } from 'k6';
import { Rate } from 'k6/metrics';

export const BASE_URL = (__ENV.BASE_URL || 'https://takhayal.ai').replace(/\/+$/, '');

export const statusIs200 = new Rate('status_is_200');

export const safeLoadOptions = {
  discardResponseBodies: true,
  stages: [
    { duration: '1m', target: 10 },
    { duration: '2m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    status_is_200: ['rate>0.99'],
  },
};

export const defaultRequestParams = {
  headers: {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'User-Agent': 'takhayal-k6-load-test/1.0',
  },
};

export function buildUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${normalizedPath}`;
}

export function requestParams(routeName) {
  return {
    ...defaultRequestParams,
    tags: { route: routeName },
  };
}

export function checkStatus(res, label) {
  const isOk = res.status === 200;
  statusIs200.add(isOk);
  check(res, {
    [`${label} returned 200`]: () => isOk,
  });
}
