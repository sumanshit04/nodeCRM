'use strict';

const prisma = require('../config/prisma');

async function getStats(permissionKeys) {
  const canViewUsers = permissionKeys.includes('users.view');
  const canViewReports = permissionKeys.includes('reports.view') || permissionKeys.includes('dashboard.view');

  const statuses = await prisma.leadStatus.findMany({ orderBy: { sortOrder: 'asc' } });
  const totalLeads = canViewReports ? await prisma.lead.count() : 0;

  const byStatus = {};
  if (canViewReports) {
    const grouped = await prisma.lead.groupBy({
      by: ['statusId'],
      _count: { _all: true },
    });
    const countMap = Object.fromEntries(grouped.map((g) => [g.statusId, g._count._all]));
    for (const s of statuses) {
      byStatus[s.slug] = countMap[s.id] || 0;
    }
  }

  const userStats = canViewUsers
    ? {
        totalUsers: await prisma.user.count(),
        activeUsers: await prisma.user.count({ where: { status: 'active' } }),
      }
    : null;

  return {
    totalLeads,
    newLeads: byStatus.new || 0,
    contactedLeads: byStatus.contacted || 0,
    qualifiedLeads: byStatus.qualified || 0,
    convertedLeads: byStatus.converted || 0,
    lostLeads: byStatus.lost || 0,
    byStatus: statuses.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      color: s.color,
      count: byStatus[s.slug] || 0,
    })),
    totalUsers: userStats?.totalUsers,
    activeUsers: userStats?.activeUsers,
  };
}

async function listLogs({ q, action, userId, dateFrom, dateTo, page = 1, limit = 20 }) {
  const where = {};
  if (action) where.action = action;
  if (userId) where.userId = Number(userId);
  if (q) {
    where.OR = [
      { description: { contains: q, mode: 'insensitive' } },
      { action: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.activityLog.count({ where }),
  ]);
  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

module.exports = { getStats, listLogs };
