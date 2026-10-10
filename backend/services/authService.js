'use strict';

const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const { getEffectivePermissionKeys } = require('./permissionService');
const { publicUser } = require('../utils/serializers');
const { logActivity } = require('./activityLogService');

async function login({ email, password, rememberMe, req }) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { role: true },
  });
  if (!user) {
    return { ok: false, status: 401, message: 'Invalid email or password' };
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return { ok: false, status: 401, message: 'Invalid email or password' };
  }
  if (user.status !== 'active') {
    return { ok: false, status: 403, message: 'Your account is inactive. Contact an administrator.' };
  }

  await new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
  req.session.userId = user.id;
  req.session.csrfToken = require('../utils/csrf').generateCsrfToken();
  if (rememberMe) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
  } else {
    req.session.cookie.maxAge = 8 * 60 * 60 * 1000;
  }

  await logActivity({
    userId: user.id,
    action: 'auth.login',
    description: 'User logged in',
    req,
  });

  const permissions = await getEffectivePermissionKeys(user.id);
  return { ok: true, user: publicUser(user, { permissions }), csrfToken: req.session.csrfToken };
}

async function logout(req) {
  const userId = req.session?.userId;
  if (userId) {
    await logActivity({
      userId,
      action: 'auth.logout',
      description: 'User logged out',
      req,
    });
  }
  await new Promise((resolve) => {
    req.session.destroy(() => resolve());
  });
}

async function currentUser(user) {
  const permissions = await getEffectivePermissionKeys(user.id);
  return publicUser(user, { permissions });
}

module.exports = { login, logout, currentUser };
