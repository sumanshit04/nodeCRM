'use strict';

const http = require('http');

function request(options, body, cookie) {
  return new Promise((resolve, reject) => {
    const headers = { ...(options.headers || {}) };
    if (cookie) headers.Cookie = cookie;
    if (body) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = http.request({ hostname: 'localhost', port: 3000, ...options, headers }, (res) => {
      let data = '';
      res.on('data', (c) => {
        data += c;
      });
      res.on('end', () => {
        const setCookie = res.headers['set-cookie']?.[0]?.split(';')[0];
        resolve({ status: res.statusCode, cookie: setCookie, body: data });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const login = await request(
    { path: '/api/auth/login', method: 'POST' },
    JSON.stringify({ email: 'admin@crm.local', password: 'Admin@123' })
  );
  const cookie = login.cookie;
  const parsed = JSON.parse(login.body);
  const csrf = parsed.data.csrfToken;
  const checks = [];

  const leads = await request({ path: '/api/leads?page=1&limit=10', method: 'GET' }, null, cookie);
  checks.push(['GET /api/leads', leads.status, JSON.parse(leads.body).success]);

  const users = await request({ path: '/api/users?page=1&limit=10', method: 'GET' }, null, cookie);
  checks.push(['GET /api/users', users.status, JSON.parse(users.body).success]);

  const stats = await request({ path: '/api/dashboard/stats', method: 'GET' }, null, cookie);
  checks.push(['GET /api/dashboard/stats', stats.status, JSON.parse(stats.body).success]);

  const logs = await request({ path: '/api/activity-logs', method: 'GET' }, null, cookie);
  checks.push(['GET /api/activity-logs', logs.status, JSON.parse(logs.body).success]);

  const denied = await request(
    { path: '/api/leads', method: 'POST', headers: { 'X-CSRF-Token': csrf } },
    JSON.stringify({})
  );
  // no cookie should 401
  checks.push(['POST /api/leads unauth', denied.status, denied.status === 401]);

  for (const [name, status, ok] of checks) {
    console.log(`${ok ? 'OK' : 'FAIL'} ${name} (${status})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
