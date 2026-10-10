'use strict';

const prisma = require('../config/prisma');

async function logActivity({ userId, action, description, req }) {
  const ip =
    req?.ip ||
    req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    req?.socket?.remoteAddress ||
    null;
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId || null,
        action,
        description,
        ipAddress: ip,
      },
    });
  } catch (err) {
    console.error('Failed to write activity log', err.message);
  }
}

module.exports = { logActivity };
