'use strict';

const { body } = require('express-validator');
const { isValidPassword } = require('../utils/validationRules');

const loginValidators = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('rememberMe').optional().isBoolean().withMessage('Remember Me must be true or false'),
];

const resetPasswordValidators = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .custom((value) => isValidPassword(value))
    .withMessage(
      'Password must contain at least 8 characters including uppercase, lowercase, number, and special character'
    ),
];

module.exports = { loginValidators, resetPasswordValidators };
