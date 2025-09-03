const pool = require('../db');

// Get All Disclosure Types
async function getAll() {
  const [rows] = await pool.query('SELECT * FROM disclosure_types');
  return rows;
}

module.exports = { getAll };
