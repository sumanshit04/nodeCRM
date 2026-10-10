'use strict';

const express = require('express');
const leadController = require('../controllers/leadController');
const { requireAuth, requirePermission, requireAnyPermission } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const { statusValidators } = require('../validators/leadValidators');

const router = express.Router();
router.use(requireAuth);

router.get('/', requireAnyPermission(['leads.view', 'lead_statuses.manage']), leadController.listStatuses);
router.post(
  '/',
  requirePermission('lead_statuses.manage'),
  statusValidators,
  handleValidation,
  leadController.createStatus
);
router.put(
  '/:id',
  requirePermission('lead_statuses.manage'),
  statusValidators,
  handleValidation,
  leadController.updateStatus
);
router.delete('/:id', requirePermission('lead_statuses.manage'), leadController.removeStatus);

module.exports = router;
