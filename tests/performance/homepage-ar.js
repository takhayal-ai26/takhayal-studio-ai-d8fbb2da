import { sleep } from 'k6';
import http from 'k6/http';
import { buildUrl, checkStatus, requestParams, safeLoadOptions } from './config.js';

export const options = safeLoadOptions;

export default function () {
  const route = '/ar';
  const res = http.get(buildUrl(route), requestParams('homepage-ar'));

  checkStatus(res, `GET ${route}`);
  sleep(1);
}
