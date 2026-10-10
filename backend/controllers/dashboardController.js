'use strict';

const { success, fail } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboardService');

async function stats(req, res, next) {
  try {
    if (!req.permissionKeys.includes('dashboard.view')) {
      return fail(res, 'You do not have permission to perform this action', 403);
    }
    const data = await dashboardService.getStats(req.permissionKeys);
    return success(res, 'Dashboard stats retrieved', data);
  } catch (err) {
    next(err);
  }
}

async function logs(req, res, next) {
  try {
    const data = await dashboardService.listLogs(req.query);
    return success(res, 'Activity logs retrieved', data);
  } catch (err) {
    next(err);
  }
}

module.exports = { stats, logs };
