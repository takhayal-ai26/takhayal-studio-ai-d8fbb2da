const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
};

export default function handler(request, response) {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      ...jsonHeaders,
      Allow: 'GET, HEAD, OPTIONS',
    });
    response.end();
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, {
      ...jsonHeaders,
      Allow: 'GET, HEAD, OPTIONS',
    });
    response.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  response.writeHead(200, jsonHeaders);

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  response.end(JSON.stringify({
    ok: true,
    service: 'takhayal-web',
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
  }));
}
