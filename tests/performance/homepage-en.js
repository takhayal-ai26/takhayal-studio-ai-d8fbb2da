import { sleep } from 'k6';
import http from 'k6/http';
import { buildUrl, checkStatus, requestParams, safeLoadOptions } from './config.js';

export const options = safeLoadOptions;

export default function () {
  const route = '/en';
  const res = http.get(buildUrl(route), requestParams('homepage-en'));

  checkStatus(res, `GET ${route}`);
  sleep(1);
}
