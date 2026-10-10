'use strict';

const { validationResult } = require('express-validator');
const { validationFail } = require('../utils/apiResponse');

function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = {};
  for (const err of result.array()) {
    if (!errors[err.path]) errors[err.path] = err.msg;
  }
  return validationFail(res, errors);
}

module.exports = { handleValidation };
