const pool = require('../db');

// Get All Companies
async function getAll() {
  const [rows] = await pool.query('SELECT * FROM companies');
  return rows;
}

module.exports = { getAll };
