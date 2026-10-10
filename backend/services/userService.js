'use strict';

const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const { publicUser } = require('../utils/serializers');
const { logActivity } = require('./activityLogService');
const { getEffectivePermissionKeys } = require('./permissionService');

const SALT_ROUNDS = 12;

function userListWhere({ q, status, roleId }) {
  const where = {};
  if (status) where.status = status;
  if (roleId) where.roleId = Number(roleId);
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
    ];
  }
  return where;
}

async function listUsers({ q, status, roleId, page = 1, limit = 10 }) {
  const where = userListWhere({ q, status, roleId });
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { role: true },
      orderBy: { id: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.user.count({ where }),
  ]);
  return {
    items: items.map((u) => publicUser(u)),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

async function getUser(id) {
  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    include: { role: true, permissions: { include: { permission: true } } },
  });
  if (!user) return null;
  const permissions = await getEffectivePermissionKeys(user.id);
  const overrides = user.permissions.map((p) => ({
    key: p.permission.key,
    effect: p.effect,
  }));
  return publicUser(user, { permissions, overrides });
}

async function createUser(payload, actor, req) {
  const existing = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
  if (existing) {
    const err = new Error('Email already exists');
    err.code = 'DUPLICATE_EMAIL';
    throw err;
  }
  const role = await prisma.role.findUnique({ where: { id: Number(payload.roleId) } });
  if (!role) {
    const err = new Error('Role is invalid');
    err.code = 'INVALID_ROLE';
    throw err;
  }
  const passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      fullName: payload.fullName,
      email: payload.email.toLowerCase(),
      phone: payload.phone.replace(/[\s()-]/g, ''),
      passwordHash,
      roleId: role.id,
      status: payload.status,
    },
    include: { role: true },
  });
  await logActivity({
    userId: actor.id,
    action: 'user.create',
    description: `Admin created user ${user.email}`,
    req,
  });
  return publicUser(user);
}

async function updateUser(id, payload, actor, req) {
  const current = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!current) return null;
  if (payload.email) {
    const existing = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
    if (existing && existing.id !== current.id) {
      const err = new Error('Email already exists');
      err.code = 'DUPLICATE_EMAIL';
      throw err;
    }
  }
  const data = {
    fullName: payload.fullName,
    email: payload.email.toLowerCase(),
    phone: payload.phone.replace(/[\s()-]/g, ''),
    roleId: Number(payload.roleId),
    status: payload.status,
  };
  if (payload.password) {
    data.passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS);
  }
  const user = await prisma.user.update({
    where: { id: current.id },
    data,
    include: { role: true },
  });
  await logActivity({
    userId: actor.id,
    action: 'user.update',
    description: `Admin updated user ${user.email}`,
    req,
  });
  return publicUser(user);
}

async function deleteUser(id, actor, req) {
  const current = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!current) return null;
  if (current.id === actor.id) {
    const err = new Error('You cannot delete your own account');
    err.code = 'SELF_DELETE';
    throw err;
  }
  await prisma.user.delete({ where: { id: current.id } });
  await logActivity({
    userId: actor.id,
    action: 'user.delete',
    description: `Admin deleted user ${current.email}`,
    req,
  });
  return true;
}

async function setStatus(id, status, actor, req) {
  const current = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!current) return null;
  if (current.id === actor.id && status === 'inactive') {
    const err = new Error('You cannot deactivate your own account');
    err.code = 'SELF_DEACTIVATE';
    throw err;
  }
  const user = await prisma.user.update({
    where: { id: current.id },
    data: { status },
    include: { role: true },
  });
  await logActivity({
    userId: actor.id,
    action: 'user.status',
    description: `Admin set user ${user.email} to ${status}`,
    req,
  });
  return publicUser(user);
}

async function resetPassword(id, password, actor, req) {
  const current = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!current) return null;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await prisma.user.update({ where: { id: current.id }, data: { passwordHash } });
  await logActivity({
    userId: actor.id,
    action: 'user.reset_password',
    description: `Admin reset password for ${current.email}`,
    req,
  });
  return true;
}

async function setUserPermissions(id, permissions, actor, req) {
  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
  if (!user) return null;

  const catalog = await prisma.permission.findMany();
  const byKey = Object.fromEntries(catalog.map((p) => [p.key, p]));
  const roleKeys = new Set(user.role.permissions.map((rp) => rp.permission.key));

  const rows = [];
  for (const item of permissions) {
    const perm = byKey[item.key];
    if (!perm) continue;
    const allowed = Boolean(item.allowed);
    const roleHas = roleKeys.has(item.key);
    if (allowed && !roleHas) {
      rows.push({ userId: user.id, permissionId: perm.id, effect: 'grant' });
    } else if (!allowed && roleHas) {
      rows.push({ userId: user.id, permissionId: perm.id, effect: 'deny' });
    }
  }

  await prisma.$transaction([
    prisma.userPermission.deleteMany({ where: { userId: user.id } }),
    ...(rows.length
      ? [prisma.userPermission.createMany({ data: rows })]
      : []),
  ]);

  await logActivity({
    userId: actor.id,
    action: 'permissions.update',
    description: `Admin changed permissions for ${user.email}`,
    req,
  });

  return getUser(user.id);
}

async function listRoles() {
  return prisma.role.findMany({ orderBy: { id: 'asc' } });
}

async function listPermissionsCatalog() {
  return prisma.permission.findMany({ orderBy: [{ groupName: 'asc' }, { id: 'asc' }] });
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  setStatus,
  resetPassword,
  setUserPermissions,
  listRoles,
  listPermissionsCatalog,
};
