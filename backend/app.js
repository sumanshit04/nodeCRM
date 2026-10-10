'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const config = require('./config');
const { sanitizeRequest } = require('./utils/sanitize');
const { ensureCsrf, verifyCsrf } = require('./utils/csrf');
const { fail } = require('./utils/apiResponse');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const leadRoutes = require('./routes/leadRoutes');
const leadStatusRoutes = require('./routes/leadStatusRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { requireAuth, requirePermission } = require('./middleware/auth');
const userController = require('./controllers/userController');

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'script-src': ["'self'", 'https://cdn.jsdelivr.net'],
        'style-src': ["'self'", 'https://cdn.jsdelivr.net', "'unsafe-inline'"],
        'font-src': ["'self'", 'https://cdn.jsdelivr.net', 'data:'],
        'img-src': ["'self'", 'data:'],
        'connect-src': ["'self'"],
      },
    },
  })
);

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sanitizeRequest);

const pool = new Pool({ connectionString: config.databaseUrl });

app.use(
  session({
    store: new pgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: false,
    }),
    name: config.sessionCookieName,
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: config.cookieSameSite,
      maxAge: 8 * 60 * 60 * 1000,
    },
  })
);

app.use(ensureCsrf);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

app.use('/api', apiLimiter);
app.use('/api', verifyCsrf);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/lead-statuses', leadStatusRoutes);
app.use('/api', dashboardRoutes);

app.get('/api/permissions', requireAuth, requirePermission('permissions.manage'), userController.permissions);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'OK' });
});

const frontendDir = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendDir));

app.get(['/login', '/login.html'], (_req, res) => {
  res.sendFile(path.join(frontendDir, 'login.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.use((req, res) => fail(res, 'Not found', 404));

app.use((err, _req, res, _next) => {
  console.error(err);
  const message = config.isProd ? 'Internal server error' : err.message;
  return fail(res, message, 500);
});

module.exports = app;
