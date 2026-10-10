'use strict';

const prisma = require('../config/prisma');
const { serializeLead } = require('../utils/serializers');
const { logActivity } = require('./activityLogService');

function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function leadWhere({ q, country, statusId, assignedUserId, dateFrom, dateTo }) {
  const where = {};
  if (country) where.country = country;
  if (statusId) where.statusId = Number(statusId);
  if (assignedUserId) where.assignedUserId = Number(assignedUserId);
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { company: { contains: q, mode: 'insensitive' } },
    ];
  }
  return where;
}

const leadInclude = {
  status: true,
  assignedUser: { select: { id: true, fullName: true, email: true } },
  createdBy: { select: { id: true, fullName: true } },
};

async function listLeads(filters) {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const where = leadWhere(filters);
  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: leadInclude,
      orderBy: { id: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);
  return {
    items: items.map(serializeLead),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
}

async function getLead(id) {
  const lead = await prisma.lead.findUnique({
    where: { id: Number(id) },
    include: leadInclude,
  });
  return lead ? serializeLead(lead) : null;
}

async function assertUniqueEmail(email, excludeId) {
  const existing = await prisma.lead.findFirst({
    where: {
      email: email.toLowerCase(),
      ...(excludeId ? { id: { not: Number(excludeId) } } : {}),
    },
  });
  if (existing) {
    const err = new Error('Email already exists');
    err.code = 'DUPLICATE_EMAIL';
    throw err;
  }
}

function leadData(payload, extras = {}) {
  return {
    name: payload.name,
    email: payload.email.toLowerCase(),
    phone: payload.phone.replace(/[\s()-]/g, ''),
    country: payload.country.toUpperCase(),
    address: payload.address || null,
    pinCode: payload.pinCode,
    company: payload.company || null,
    source: payload.source || null,
    notes: payload.notes || null,
    statusId: Number(payload.statusId),
    assignedUserId: payload.assignedUserId ? Number(payload.assignedUserId) : null,
    ...extras,
  };
}

async function createLead(payload, actor, req) {
  await assertUniqueEmail(payload.email);
  const lead = await prisma.lead.create({
    data: leadData(payload, { createdById: actor.id }),
    include: leadInclude,
  });
  await logActivity({
    userId: actor.id,
    action: 'lead.create',
    description: `User created lead ${lead.name} (${lead.email})`,
    req,
  });
  return serializeLead(lead);
}

async function updateLead(id, payload, actor, req) {
  const current = await prisma.lead.findUnique({ where: { id: Number(id) } });
  if (!current) return null;
  await assertUniqueEmail(payload.email, current.id);
  const lead = await prisma.lead.update({
    where: { id: current.id },
    data: leadData(payload),
    include: leadInclude,
  });
  await logActivity({
    userId: actor.id,
    action: 'lead.update',
    description: `User updated lead ${lead.name} (${lead.email})`,
    req,
  });
  return serializeLead(lead);
}

async function deleteLead(id, actor, req) {
  const current = await prisma.lead.findUnique({ where: { id: Number(id) } });
  if (!current) return null;
  await prisma.lead.delete({ where: { id: current.id } });
  await logActivity({
    userId: actor.id,
    action: 'lead.delete',
    description: `User deleted lead ${current.name} (${current.email})`,
    req,
  });
  return true;
}

async function exportLeads(filters) {
  const where = leadWhere(filters);
  const items = await prisma.lead.findMany({
    where,
    include: leadInclude,
    orderBy: { id: 'desc' },
  });
  return items.map(serializeLead);
}

async function listStatuses() {
  return prisma.leadStatus.findMany({ orderBy: { sortOrder: 'asc' } });
}

async function createStatus(payload, actor, req) {
  const slug = slugify(payload.name);
  const existing = await prisma.leadStatus.findFirst({
    where: { OR: [{ slug }, { name: payload.name }] },
  });
  if (existing) {
    const err = new Error('Lead status already exists');
    err.code = 'DUPLICATE';
    throw err;
  }
  const max = await prisma.leadStatus.aggregate({ _max: { sortOrder: true } });
  const status = await prisma.leadStatus.create({
    data: {
      name: payload.name,
      slug,
      color: payload.color || '#64748b',
      sortOrder: payload.sortOrder ?? (max._max.sortOrder || 0) + 1,
      isActive: payload.isActive !== false,
    },
  });
  await logActivity({
    userId: actor.id,
    action: 'lead_status.create',
    description: `Admin created lead status ${status.name}`,
    req,
  });
  return status;
}

async function updateStatus(id, payload, actor, req) {
  const current = await prisma.leadStatus.findUnique({ where: { id: Number(id) } });
  if (!current) return null;
  const data = {
    name: payload.name,
    color: payload.color || current.color,
    sortOrder: payload.sortOrder ?? current.sortOrder,
    isActive: payload.isActive ?? current.isActive,
  };
  if (payload.name && payload.name !== current.name) {
    data.slug = slugify(payload.name);
  }
  const status = await prisma.leadStatus.update({ where: { id: current.id }, data });
  await logActivity({
    userId: actor.id,
    action: 'lead_status.update',
    description: `Admin updated lead status ${status.name}`,
    req,
  });
  return status;
}

async function deleteStatus(id, actor, req) {
  const current = await prisma.leadStatus.findUnique({
    where: { id: Number(id) },
    include: { _count: { select: { leads: true } } },
  });
  if (!current) return null;
  if (current._count.leads > 0) {
    const err = new Error('Cannot delete a status that is assigned to leads');
    err.code = 'IN_USE';
    throw err;
  }
  await prisma.leadStatus.delete({ where: { id: current.id } });
  await logActivity({
    userId: actor.id,
    action: 'lead_status.delete',
    description: `Admin deleted lead status ${current.name}`,
    req,
  });
  return true;
}

module.exports = {
  listLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  exportLeads,
  listStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
};
