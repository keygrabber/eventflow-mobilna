const http = require('node:http');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const addresses = Object.values(os.networkInterfaces())
  .flat()
  .filter((a) => a && a.family === 'IPv4' && !a.internal);
const host =
  process.env.EVENTFLOW_LAN_HOST ||
  addresses.find((a) => /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(a.address))?.address;
if (!host || !addresses.some((a) => a.address === host))
  throw new Error(
    'Nie znaleziono lokalnego adresu IPv4. Ustaw EVENTFLOW_LAN_HOST na adres komputera w sieci telefonu.',
  );
const server = http.createServer((req, res) => {
  if (!req.url?.startsWith('/api/v1/')) {
    res.writeHead(404);
    res.end();
    return;
  }
  const upstream = http.request(
    {
      hostname: '127.0.0.1',
      port: 8000,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: '127.0.0.1:8000' },
    },
    (result) => {
      res.writeHead(result.statusCode || 502, result.headers);
      result.pipe(res);
    },
  );
  upstream.setTimeout(25000, () => upstream.destroy());
  upstream.on('error', () => {
    if (res.destroyed) return;
    if (res.headersSent) {
      res.destroy();
      return;
    }
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Backend na komputerze nie odpowiada na porcie 8000.' }));
  });
  req.on('aborted', () => upstream.destroy());
  res.on('close', () => {
    if (!res.writableEnded) upstream.destroy();
  });
  req.pipe(upstream);
});
server.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(8000, host, () => {
  const file = path.join(__dirname, '..', '.env.local');
  const previous = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const setting = `EXPO_PUBLIC_API_URL=http://${host}:8000/api/v1`;
  fs.writeFileSync(
    file,
    /^EXPO_PUBLIC_API_URL=.*$/m.test(previous)
      ? previous.replace(/^EXPO_PUBLIC_API_URL=.*$/m, setting)
      : `${previous.trimEnd()}\n${setting}\n`,
  );
  console.log(`API telefonu: http://${host}:8000/api/v1 (tylko sieć lokalna). Odśwież Expo Go.`);
});
