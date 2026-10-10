'use strict';

function publicUser(user, extra = {}) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    status: user.status,
    roleId: user.roleId,
    role: user.role
      ? { id: user.role.id, name: user.role.name, slug: user.role.slug }
      : undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    ...extra,
  };
}

function serializeLead(lead) {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    country: lead.country,
    address: lead.address,
    pinCode: lead.pinCode,
    company: lead.company,
    source: lead.source,
    notes: lead.notes,
    statusId: lead.statusId,
    status: lead.status
      ? { id: lead.status.id, name: lead.status.name, slug: lead.status.slug, color: lead.status.color }
      : undefined,
    assignedUserId: lead.assignedUserId,
    assignedUser: lead.assignedUser
      ? { id: lead.assignedUser.id, fullName: lead.assignedUser.fullName, email: lead.assignedUser.email }
      : null,
    createdById: lead.createdById,
    createdBy: lead.createdBy
      ? { id: lead.createdBy.id, fullName: lead.createdBy.fullName }
      : undefined,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

module.exports = { publicUser, serializeLead };
