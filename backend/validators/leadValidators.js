'use strict';

const { body, query } = require('express-validator');
const { isValidName, isValidPhone, isValidPin } = require('../utils/validationRules');

const leadBody = [
  body('name')
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
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required')
    .isLength({ min: 2, max: 56 })
    .withMessage('Country is invalid'),
  body('address').optional({ values: 'falsy' }).isLength({ max: 255 }),
  body('pinCode')
    .trim()
    .notEmpty()
    .withMessage('PIN / ZIP code is required')
    .custom((v, { req }) => isValidPin(req.body.country, v))
    .withMessage('Please enter a valid PIN / ZIP code for the selected country'),
  body('company').optional({ values: 'falsy' }).isLength({ max: 120 }),
  body('source').optional({ values: 'falsy' }).isLength({ max: 80 }),
  body('notes').optional({ values: 'falsy' }).isLength({ max: 2000 }),
  body('statusId').notEmpty().withMessage('Lead status is required').isInt(),
  body('assignedUserId').optional({ values: 'falsy' }).isInt(),
];

const listLeadValidators = [
  query('q').optional().isString().trim().isLength({ max: 100 }),
  query('country').optional().isString().trim().isLength({ max: 56 }),
  query('statusId').optional().isInt(),
  query('assignedUserId').optional().isInt(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const statusValidators = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }),
  body('color').optional().isString().isLength({ max: 20 }),
  body('sortOrder').optional().isInt(),
  body('isActive').optional().isBoolean(),
];

module.exports = { leadBody, listLeadValidators, statusValidators };
