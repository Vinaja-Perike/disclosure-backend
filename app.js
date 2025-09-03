const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const disclosuresRoutes = require('./routes/disclosures');
app.get('/check', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is working' });
});
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/disclosures', disclosuresRoutes);
app.listen(port, () => {
  console.log('Server running on port 3000');
});
