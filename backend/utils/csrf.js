'use strict';

const crypto = require('crypto');

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function ensureCsrf(req, res, next) {
  if (!req.session) return next();
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCsrfToken();
  }
  next();
}

function verifyCsrf(req, res, next) {
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return next();
  const urlPath = (req.originalUrl || req.path || '').split('?')[0];
  if (urlPath === '/api/auth/login' || req.path === '/auth/login') return next();

  const token = req.get('x-csrf-token') || req.body?._csrf;
  if (!token || !req.session?.csrfToken || token !== req.session.csrfToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
    });
  }
  next();
}

module.exports = { generateCsrfToken, ensureCsrf, verifyCsrf };
