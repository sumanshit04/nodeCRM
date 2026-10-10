'use strict';

const prisma = require('../config/prisma');

async function getEffectivePermissionKeys(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
      permissions: { include: { permission: true } },
    },
  });
  if (!user) return [];

  const granted = new Set(user.role.permissions.map((rp) => rp.permission.key));
  for (const up of user.permissions) {
    if (up.effect === 'grant') granted.add(up.permission.key);
    if (up.effect === 'deny') granted.delete(up.permission.key);
  }
  return [...granted];
}

async function userHasPermission(userId, key) {
  const keys = await getEffectivePermissionKeys(userId);
  return keys.includes(key);
}

module.exports = { getEffectivePermissionKeys, userHasPermission };
