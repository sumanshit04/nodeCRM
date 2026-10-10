'use strict';

const { body, query } = require('express-validator');
const { isValidName, isValidPhone, isValidPassword } = require('../utils/validationRules');

const userBody = (isCreate) => [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters')
    .custom((v) => isValidName(v))
    .withMessage('Name contains invalid characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .custom((v) => isValidPhone(v.replace(/[\s()-]/g, '')))
    .withMessage('Please enter a valid phone number'),
  isCreate
    ? body('password')
        .notEmpty()
        .withMessage('Password is required')
        .custom((v) => isValidPassword(v))
        .withMessage(
          'Password must contain at least 8 characters including uppercase, lowercase, number, and special character'
        )
    : body('password')
        .optional({ values: 'falsy' })
        .custom((v) => !v || isValidPassword(v))
        .withMessage(
          'Password must contain at least 8 characters including uppercase, lowercase, number, and special character'
        ),
  body('confirmPassword').custom((value, { req }) => {
    if (isCreate || req.body.password) {
      if (value !== req.body.password) throw new Error('Passwords do not match');
    }
    return true;
  }),
  body('roleId').notEmpty().withMessage('Role is required').isInt().withMessage('Role is invalid'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
];

const createUserValidators = userBody(true);
const updateUserValidators = userBody(false);

const listUserValidators = [
  query('q').optional().isString().trim().isLength({ max: 100 }),
  query('status').optional().isIn(['active', 'inactive']),
  query('roleId').optional().isInt(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const permissionsValidators = [
  body('permissions').isArray().withMessage('Permissions must be an array'),
  body('permissions.*.key').isString().notEmpty(),
  body('permissions.*.allowed').isBoolean(),
];

module.exports = {
  createUserValidators,
  updateUserValidators,
  listUserValidators,
  permissionsValidators,
};
