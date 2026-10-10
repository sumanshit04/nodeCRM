'use strict';

const { success, fail } = require('../utils/apiResponse');
const leadService = require('../services/leadService');

function handleKnown(err, res) {
  if (err.code === 'DUPLICATE_EMAIL') {
    return fail(res, 'Validation failed', 409, { email: 'Email already exists' });
  }
  if (err.code === 'DUPLICATE') {
    return fail(res, 'Validation failed', 409, { name: err.message });
  }
  if (err.code === 'IN_USE') {
    return fail(res, err.message, 409);
  }
  return null;
}

async function list(req, res, next) {
  try {
    const data = await leadService.listLeads(req.query);
    return success(res, 'Leads retrieved', data);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const lead = await leadService.getLead(req.params.id);
    if (!lead) return fail(res, 'Lead not found', 404);
    return success(res, 'Lead retrieved', lead);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const lead = await leadService.createLead(req.body, req.user, req);
    return success(res, 'Lead created successfully', lead, 201);
  } catch (err) {
    if (handleKnown(err, res)) return;
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const lead = await leadService.updateLead(req.params.id, req.body, req.user, req);
    if (!lead) return fail(res, 'Lead not found', 404);
    return success(res, 'Lead updated successfully', lead);
  } catch (err) {
    if (handleKnown(err, res)) return;
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const ok = await leadService.deleteLead(req.params.id, req.user, req);
    if (!ok) return fail(res, 'Lead not found', 404);
    return success(res, 'Lead deleted successfully');
  } catch (err) {
    next(err);
  }
}

async function exportCsv(req, res, next) {
  try {
    const items = await leadService.exportLeads(req.query);
    const header = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Country',
      'Company',
      'Status',
      'Assigned To',
      'Created Date',
    ];
    const rows = items.map((l) =>
      [
        l.id,
        l.name,
        l.email,
        l.phone,
        l.country,
        l.company || '',
        l.status?.name || '',
        l.assignedUser?.fullName || '',
        l.createdAt,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

async function listStatuses(req, res, next) {
  try {
    const data = await leadService.listStatuses();
    return success(res, 'Lead statuses retrieved', data);
  } catch (err) {
    next(err);
  }
}

async function createStatus(req, res, next) {
  try {
    const data = await leadService.createStatus(req.body, req.user, req);
    return success(res, 'Lead status created successfully', data, 201);
  } catch (err) {
    if (handleKnown(err, res)) return;
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const data = await leadService.updateStatus(req.params.id, req.body, req.user, req);
    if (!data) return fail(res, 'Lead status not found', 404);
    return success(res, 'Lead status updated successfully', data);
  } catch (err) {
    if (handleKnown(err, res)) return;
    next(err);
  }
}

async function removeStatus(req, res, next) {
  try {
    const ok = await leadService.deleteStatus(req.params.id, req.user, req);
    if (!ok) return fail(res, 'Lead status not found', 404);
    return success(res, 'Lead status deleted successfully');
  } catch (err) {
    if (handleKnown(err, res)) return;
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  exportCsv,
  listStatuses,
  createStatus,
  updateStatus,
  removeStatus,
};
