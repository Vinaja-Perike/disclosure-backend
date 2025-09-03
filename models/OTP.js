const pool = require('../db');

// Create OTP
async function createOTP(director_id, otp_code, expires_at) {
  await pool.query(
    'INSERT INTO otps (director_id, otp_code, expires_at) VALUES (?, ?, ?)',
    [director_id, otp_code, expires_at]
  );
}

// Verify OTP (and mark used)
async function verifyOTP(director_id, otp_code) {
  const [rows] = await pool.query(
    'SELECT * FROM otps WHERE director_id = ? AND otp_code = ? AND used = 0',
    [director_id, otp_code]
  );
  if (!rows.length) return false;
  const otp = rows[0];
  if (new Date(otp.expires_at) < new Date()) return false;
  await pool.query('UPDATE otps SET used = 1 WHERE id = ?', [otp.id]);
  return true;
}

module.exports = { createOTP, verifyOTP };
