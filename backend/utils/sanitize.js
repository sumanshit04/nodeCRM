'use strict';

function stripTags(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/<[^>]*>/g, '').trim();
}

function sanitizeObject(obj, skipKeys = ['password', 'confirmPassword', 'newPassword']) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (skipKeys.includes(key)) {
      out[key] = value;
    } else if (typeof value === 'string') {
      out[key] = stripTags(value);
    } else if (value && typeof value === 'object') {
      out[key] = sanitizeObject(value, skipKeys);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function sanitizeRequest(req, _res, next) {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  next();
}

module.exports = { stripTags, sanitizeObject, sanitizeRequest };
