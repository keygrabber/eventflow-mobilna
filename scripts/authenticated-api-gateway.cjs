const http = require('node:http');

const PREFIX = '/eventflow-api';

module.exports = function gateway(next) {
  return (req, res, fallback) => {
    if (!req.url?.startsWith(PREFIX)) {
      return next ? next(req, res, fallback) : (fallback ? fallback() : undefined);
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
        'Cache-Control': 'no-store',
      });
      res.end();
      return;
    }

    const rawSuffix = req.url.slice(PREFIX.length);
    const suffix = rawSuffix.startsWith('/') ? rawSuffix : `/${rawSuffix}`;
    const upstreamPath = `/api/v1${suffix === '/' ? '' : suffix}`;

    const headers = { ...req.headers };
    headers.host = '127.0.0.1:8000';

    const upstream = http.request(
      {
        hostname: '127.0.0.1',
        port: 8000,
        path: upstreamPath,
        method: req.method,
        headers,
      },
      (upstreamRes) => {
        const responseHeaders = {
          ...upstreamRes.headers,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        };
        res.writeHead(upstreamRes.statusCode || 500, responseHeaders);
        upstreamRes.pipe(res);
      }
    );

    upstream.setTimeout(30000, () => {
      upstream.destroy(new Error('Backend timeout (30s)'));
    });

    upstream.on('error', (err) => {
      if (!res.headersSent) {
        res.writeHead(502, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        });
        res.end(
          JSON.stringify({
            message: 'Błąd połączenia z backendem Laravel na porcie 8000. Upewnij się, że backend działa.',
            error: err.message,
          })
        );
      } else {
        res.destroy();
      }
    });

    req.on('aborted', () => upstream.destroy());
    res.on('close', () => {
      if (!res.writableEnded) upstream.destroy();
    });

    req.pipe(upstream);
  };
};
