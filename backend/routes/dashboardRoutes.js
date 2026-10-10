'use strict';

const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/dashboard/stats', requirePermission('dashboard.view'), dashboardController.stats);
router.get('/activity-logs', requirePermission('activity_logs.view'), dashboardController.logs);

module.exports = router;
