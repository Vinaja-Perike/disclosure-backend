const pool = require('../db');

// Submit Disclosure
async function submitDisclosure({ director_id, type_id, recipient_id, details, status = 'pending' }) {
  const [result] = await pool.query(
    'INSERT INTO disclosures (director_id, type_id, recipient_id, details, status) VALUES (?, ?, ?, ?, ?)',
    [director_id, type_id, recipient_id, details, status]
  );
  return result.insertId;
}

// Get Disclosures by Director and Status
async function getByDirectorStatus(director_id, status) {
  const [rows] = await pool.query(
    'SELECT * FROM disclosures WHERE director_id = ? AND status = ?',
    [director_id, status]
  );
  return rows;
}

module.exports = { submitDisclosure, getByDirectorStatus };
