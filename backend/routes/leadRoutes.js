'use strict';

const express = require('express');
const leadController = require('../controllers/leadController');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const { leadBody, listLeadValidators, statusValidators } = require('../validators/leadValidators');

const router = express.Router();
router.use(requireAuth);

router.get('/', requirePermission('leads.view'), listLeadValidators, handleValidation, leadController.list);
router.get('/export', requirePermission('leads.export'), listLeadValidators, handleValidation, leadController.exportCsv);
router.post('/', requirePermission('leads.create'), leadBody, handleValidation, leadController.create);
router.get('/:id', requirePermission('leads.view'), leadController.getOne);
router.put('/:id', requirePermission('leads.update'), leadBody, handleValidation, leadController.update);
router.delete('/:id', requirePermission('leads.delete'), leadController.remove);

module.exports = router;
