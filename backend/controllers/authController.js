'use strict';

const { success, fail } = require('../utils/apiResponse');
const authService = require('../services/authService');
const { generateCsrfToken } = require('../utils/csrf');

async function csrf(req, res) {
  if (!req.session.csrfToken) req.session.csrfToken = generateCsrfToken();
  return success(res, 'CSRF token', { csrfToken: req.session.csrfToken });
}

async function login(req, res, next) {
  try {
    const result = await authService.login({
      email: req.body.email,
      password: req.body.password,
      rememberMe: Boolean(req.body.rememberMe),
      req,
    });
    if (!result.ok) return fail(res, result.message, result.status);
    return success(res, 'Logged in successfully', {
      user: result.user,
      csrfToken: result.csrfToken,
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req);
    res.clearCookie(require('../config').sessionCookieName);
    return success(res, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.currentUser(req.user);
    return success(res, 'Current user', {
      user,
      csrfToken: req.session.csrfToken,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { csrf, login, logout, me };
