'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const PERMISSIONS = [
  { key: 'dashboard.view', name: 'View Dashboard', groupName: 'Dashboard' },
  { key: 'reports.view', name: 'View Reports', groupName: 'Dashboard' },
  { key: 'users.view', name: 'View Users', groupName: 'Users' },
  { key: 'users.create', name: 'Add User', groupName: 'Users' },
  { key: 'users.update', name: 'Edit User', groupName: 'Users' },
  { key: 'users.delete', name: 'Delete User', groupName: 'Users' },
  { key: 'leads.view', name: 'View Leads', groupName: 'Leads' },
  { key: 'leads.create', name: 'Add Lead', groupName: 'Leads' },
  { key: 'leads.update', name: 'Edit Lead', groupName: 'Leads' },
  { key: 'leads.delete', name: 'Delete Lead', groupName: 'Leads' },
  { key: 'leads.export', name: 'Export Leads', groupName: 'Leads' },
  { key: 'lead_statuses.manage', name: 'Manage Lead Statuses', groupName: 'Lead Status' },
  { key: 'activity_logs.view', name: 'View Activity Logs', groupName: 'Activity Logs' },
  { key: 'permissions.manage', name: 'Assign Permissions', groupName: 'Users' },
];

const USER_ROLE_KEYS = [
  'dashboard.view',
  'leads.view',
  'leads.create',
  'leads.update',
];

const STATUSES = [
  { name: 'New', slug: 'new', color: '#3b82f6', sortOrder: 1 },
  { name: 'Contacted', slug: 'contacted', color: '#8b5cf6', sortOrder: 2 },
  { name: 'Interested', slug: 'interested', color: '#06b6d4', sortOrder: 3 },
  { name: 'Follow-up', slug: 'follow-up', color: '#f59e0b', sortOrder: 4 },
  { name: 'Qualified', slug: 'qualified', color: '#10b981', sortOrder: 5 },
  { name: 'Converted', slug: 'converted', color: '#22c55e', sortOrder: 6 },
  { name: 'Lost', slug: 'lost', color: '#ef4444', sortOrder: 7 },
];

async function main() {
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { name: p.name, groupName: p.groupName },
      create: p,
    });
  }

  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: { name: 'Admin' },
    create: { name: 'Admin', slug: 'admin', description: 'Full system access' },
  });

  const userRole = await prisma.role.upsert({
    where: { slug: 'user' },
    update: { name: 'User' },
    create: { name: 'User', slug: 'user', description: 'Standard CRM user' },
  });

  const allPermissions = await prisma.permission.findMany();
  const byKey = Object.fromEntries(allPermissions.map((p) => [p.key, p]));

  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
  });

  await prisma.rolePermission.deleteMany({ where: { roleId: userRole.id } });
  await prisma.rolePermission.createMany({
    data: USER_ROLE_KEYS.map((key) => ({
      roleId: userRole.id,
      permissionId: byKey[key].id,
    })),
  });

  for (const s of STATUSES) {
    await prisma.leadStatus.upsert({
      where: { slug: s.slug },
      update: { name: s.name, color: s.color, sortOrder: s.sortOrder },
      create: s,
    });
  }

  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const userPassword = await bcrypt.hash('User@1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.local' },
    update: {},
    create: {
      fullName: 'System Admin',
      email: 'admin@crm.local',
      phone: '+15555550100',
      passwordHash: adminPassword,
      roleId: adminRole.id,
      status: 'active',
    },
  });

  const john = await prisma.user.upsert({
    where: { email: 'john@crm.local' },
    update: {},
    create: {
      fullName: 'John Carter',
      email: 'john@crm.local',
      phone: '+15555550101',
      passwordHash: userPassword,
      roleId: userRole.id,
      status: 'active',
    },
  });

  await prisma.userPermission.deleteMany({ where: { userId: john.id } });
  await prisma.userPermission.createMany({
    data: [
      { userId: john.id, permissionId: byKey['reports.view'].id, effect: 'grant' },
      { userId: john.id, permissionId: byKey['leads.delete'].id, effect: 'deny' },
      { userId: john.id, permissionId: byKey['leads.export'].id, effect: 'deny' },
    ],
  });

  const newStatus = await prisma.leadStatus.findUnique({ where: { slug: 'new' } });
  const contacted = await prisma.leadStatus.findUnique({ where: { slug: 'contacted' } });
  const qualified = await prisma.leadStatus.findUnique({ where: { slug: 'qualified' } });

  const existingLeads = await prisma.lead.count();
  if (existingLeads === 0) {
    await prisma.lead.createMany({
      data: [
        {
          name: 'Ava Sharma',
          email: 'ava.sharma@example.com',
          phone: '+919876543210',
          country: 'IN',
          address: '12 MG Road, Bengaluru',
          pinCode: '560001',
          company: 'Nimbus Tech',
          source: 'Website',
          notes: 'Requested a product demo.',
          statusId: newStatus.id,
          assignedUserId: john.id,
          createdById: admin.id,
        },
        {
          name: 'Michael Chen',
          email: 'michael.chen@example.com',
          phone: '+14155550123',
          country: 'US',
          address: '88 Market St, San Francisco',
          pinCode: '94105',
          company: 'Pacific Goods',
          source: 'Referral',
          notes: 'Follow up after pricing call.',
          statusId: contacted.id,
          assignedUserId: john.id,
          createdById: admin.id,
        },
        {
          name: 'Sofia Rossi',
          email: 'sofia.rossi@example.com',
          phone: '+390612345678',
          country: 'IT',
          address: 'Via Roma 4, Rome',
          pinCode: '00184',
          company: 'Rossi Import',
          source: 'LinkedIn',
          notes: 'Qualified after discovery call.',
          statusId: qualified.id,
          assignedUserId: admin.id,
          createdById: admin.id,
        },
      ],
    });
  }

  console.log('Seed complete.');
  console.log('Admin login: admin@crm.local / Admin@123');
  console.log('User login:  john@crm.local / User@1234');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
