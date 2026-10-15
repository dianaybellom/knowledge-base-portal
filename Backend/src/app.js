const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const solutionsRoutes = require('./routes/solutions');
const componentsRoutes = require('./routes/components');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/solutions', solutionsRoutes);
app.use('/api/components', componentsRoutes);

app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
