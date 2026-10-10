'use strict';

const NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,79}$/;
const PHONE_RE = /^\+?[0-9]{7,15}$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const ZIP_PATTERNS = {
  US: /^\d{5}(-\d{4})?$/,
  IN: /^\d{6}$/,
  GB: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
  CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
  AU: /^\d{4}$/,
  DE: /^\d{5}$/,
  IT: /^\d{5}$/,
  FR: /^\d{5}$/,
};

function isValidName(value) {
  return typeof value === 'string' && NAME_RE.test(value.trim());
}

function isValidPhone(value) {
  return typeof value === 'string' && PHONE_RE.test(value.replace(/[\s()-]/g, ''));
}

function isValidPassword(value) {
  return typeof value === 'string' && PASSWORD_RE.test(value);
}

function isValidPin(country, pin) {
  if (!pin || String(pin).length < 3 || String(pin).length > 12) return false;
  const pattern = ZIP_PATTERNS[String(country || '').toUpperCase()];
  if (!pattern) return /^[A-Za-z0-9\s-]{3,12}$/.test(pin);
  return pattern.test(String(pin).trim());
}

module.exports = {
  NAME_RE,
  PHONE_RE,
  PASSWORD_RE,
  ZIP_PATTERNS,
  isValidName,
  isValidPhone,
  isValidPassword,
  isValidPin,
};
