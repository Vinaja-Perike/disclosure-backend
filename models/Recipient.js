const pool = require('../db');

// Get All Recipients
async function getAll() {
  const [rows] = await pool.query('SELECT * FROM recipients');
  return rows;
}

module.exports = { getAll };
