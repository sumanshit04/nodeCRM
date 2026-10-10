'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const required = ['DATABASE_URL', 'SESSION_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET,
  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'crm.sid',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  cookieSecure: process.env.COOKIE_SECURE === 'true' || isProd,
  cookieSameSite: process.env.COOKIE_SAMESITE || (isProd ? 'strict' : 'lax'),
};
