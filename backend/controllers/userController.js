'use strict';

const { success, fail } = require('../utils/apiResponse');
const userService = require('../services/userService');

function handleKnown(err, res) {
  if (err.code === 'DUPLICATE_EMAIL') {
    return fail(res, 'Validation failed', 409, { email: 'Email already exists' });
  }
  if (err.code === 'INVALID_ROLE') {
    return fail(res, 'Validation failed', 400, { roleId: 'Role is invalid' });
  }
  if (err.code === 'SELF_DELETE' || err.code === 'SELF_DEACTIVATE') {
    return fail(res, err.message, 400);
  }
  return null;
}

async function list(req, res, next) {
  try {
    const data = await userService.listUsers(req.query);
    return success(res, 'Users retrieved', data);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const user = await userService.getUser(req.params.id);
    if (!user) return fail(res, 'User not found', 404);
    return success(res, 'User retrieved', user);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const user = await userService.createUser(req.body, req.user, req);
    return success(res, 'User created successfully', user, 201);
  } catch (err) {
    if (handleKnown(err, res)) return;
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user, req);
    if (!user) return fail(res, 'User not found', 404);
    return success(res, 'User updated successfully', user);
  } catch (err) {
    if (handleKnown(err, res)) return;
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const ok = await userService.deleteUser(req.params.id, req.user, req);
    if (!ok) return fail(res, 'User not found', 404);
    return success(res, 'User deleted successfully');
  } catch (err) {
    if (handleKnown(err, res)) return;
    next(err);
  }
}

async function status(req, res, next) {
  try {
    const user = await userService.setStatus(req.params.id, req.body.status, req.user, req);
    if (!user) return fail(res, 'User not found', 404);
    return success(res, 'User status updated', user);
  } catch (err) {
    if (handleKnown(err, res)) return;
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const ok = await userService.resetPassword(req.params.id, req.body.password, req.user, req);
    if (!ok) return fail(res, 'User not found', 404);
    return success(res, 'Password reset successfully');
  } catch (err) {
    next(err);
  }
}

async function setPermissions(req, res, next) {
  try {
    const user = await userService.setUserPermissions(req.params.id, req.body.permissions, req.user, req);
    if (!user) return fail(res, 'User not found', 404);
    return success(res, 'Permissions updated successfully', user);
  } catch (err) {
    next(err);
  }
}

async function options(req, res, next) {
  try {
    const users = await require('../config/prisma').user.findMany({
      where: { status: 'active' },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: 'asc' },
    });
    return success(res, 'User options retrieved', users);
  } catch (err) {
    next(err);
  }
}

async function roles(req, res, next) {
  try {
    const data = await userService.listRoles();
    return success(res, 'Roles retrieved', data);
  } catch (err) {
    next(err);
  }
}

async function permissions(req, res, next) {
  try {
    const data = await userService.listPermissionsCatalog();
    return success(res, 'Permissions retrieved', data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  status,
  resetPassword,
  setPermissions,
  roles,
  options,
  permissions,
};
