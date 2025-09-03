const pool = require('../db');

// Create Director
async function createDirector({ full_name, email, mobile, din, company_id, password_hash }) {
  const [result] = await pool.query(
    'INSERT INTO directors (full_name, email, mobile, din, company_id, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
    [full_name, email, mobile, din, company_id, password_hash]
  );
  return result.insertId;
}

// Find by Email or Mobile (for Login)
async function findByIdentifier(identifier) {
  const [rows] = await pool.query(
    'SELECT * FROM directors WHERE email = ? OR mobile = ?',
    [identifier, identifier]
  );
  return rows[0];
}

// Find by ID
async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM directors WHERE id = ?', [id]);
  return rows;
}

module.exports = { createDirector, findByIdentifier, findById };
