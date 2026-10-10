'use strict';

const { fail } = require('../utils/apiResponse');
const { getEffectivePermissionKeys } = require('../services/permissionService');
const prisma = require('../config/prisma');

async function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return fail(res, 'Authentication required', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

  if (!user || user.status !== 'active') {
    req.session.destroy(() => {});
    return fail(res, 'Authentication required', 401);
  }

  req.user = user;
  req.permissionKeys = await getEffectivePermissionKeys(user.id);
  next();
}

function requirePermission(key) {
  return (req, res, next) => {
    if (!req.permissionKeys?.includes(key)) {
      return fail(res, 'You do not have permission to perform this action', 403);
    }
    next();
  };
}

function requireAnyPermission(keys) {
  return (req, res, next) => {
    const ok = keys.some((k) => req.permissionKeys?.includes(k));
    if (!ok) {
      return fail(res, 'You do not have permission to perform this action', 403);
    }
    next();
  };
}

module.exports = { requireAuth, requirePermission, requireAnyPermission };
