require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

// Routes imports will go here

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const employeeRoutes = require('./modules/employees/employees.routes');
const departmentRoutes = require('./modules/departments/departments.routes');
const campaignRoutes = require('./modules/campaigns/campaigns.routes');
const formRoutes = require('./modules/forms/forms.routes');
const feedbackRoutes = require('./modules/feedback/feedback.routes');
const notificationRoutes = require('./modules/notifications/notifications.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const auditRoutes = require('./modules/audit/audit.routes');

// Use routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/forms', formRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/audit', auditRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
