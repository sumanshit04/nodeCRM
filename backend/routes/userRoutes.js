'use strict';

const express = require('express');
const userController = require('../controllers/userController');
const { requireAuth, requirePermission, requireAnyPermission } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const {
  createUserValidators,
  updateUserValidators,
  listUserValidators,
  permissionsValidators,
} = require('../validators/userValidators');
const { resetPasswordValidators } = require('../validators/authValidators');
const { body } = require('express-validator');

const router = express.Router();

router.use(requireAuth);

router.get('/roles', requirePermission('users.view'), userController.roles);
router.get(
  '/options',
  requireAnyPermission(['users.view', 'leads.create', 'leads.update']),
  userController.options
);
router.get(
  '/permissions',
  requirePermission('permissions.manage'),
  userController.permissions
);

router.get('/', requirePermission('users.view'), listUserValidators, handleValidation, userController.list);
router.post('/', requirePermission('users.create'), createUserValidators, handleValidation, userController.create);
router.get('/:id', requirePermission('users.view'), userController.getOne);
router.put('/:id', requirePermission('users.update'), updateUserValidators, handleValidation, userController.update);
router.delete('/:id', requirePermission('users.delete'), userController.remove);
router.patch(
  '/:id/status',
  requirePermission('users.update'),
  body('status').isIn(['active', 'inactive']),
  handleValidation,
  userController.status
);
router.post(
  '/:id/reset-password',
  requirePermission('users.update'),
  resetPasswordValidators,
  handleValidation,
  userController.resetPassword
);
router.post(
  '/:id/permissions',
  requirePermission('permissions.manage'),
  permissionsValidators,
  handleValidation,
  userController.setPermissions
);

module.exports = router;
