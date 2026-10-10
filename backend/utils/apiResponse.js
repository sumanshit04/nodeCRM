'use strict';

function success(res, message, data = null, status = 200) {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(status).json(payload);
}

function fail(res, message, status = 400, errors = null) {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(status).json(payload);
}

function validationFail(res, errors) {
  return fail(res, 'Validation failed', 400, errors);
}

module.exports = { success, fail, validationFail };
