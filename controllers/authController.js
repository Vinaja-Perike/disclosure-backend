const pool = require('../db');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateOTP } = require('../utils/otpUtils');
const { status } = require('express/lib/response');
const request = require("request");
const axios = require('axios');
const bcrypt = require('bcryptjs'); 
exports.register = async (req, res) => {
  const { full_name, email, mobile, din, company_id, company_name, password } = req.body;
  // password policy check here as needed
  try {
    const [existing] = await pool.query('SELECT id FROM directors WHERE email = ?', [email]);
    if (existing.length)
      return res.status(400).json({ message: 'Email already exists.' });

    const password_hash = await hashPassword(password);
    const [rows] = await pool.query(
      'INSERT INTO directors (full_name, email, mobile, din, company_id, company_name, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [full_name, email, mobile, din, company_id, company_name || '', password_hash]
    );

    res.status(200).json({
      message: 'Registered successfully.',
      din: rows.din,
      director_id: rows.insertId,
      user_name: full_name,
      company_name: company_name || '',
      status: 'success',
      status_code: 200
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { identifier, password } = req.body; 

  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, mobile, din, company_id, company_name, password_hash FROM directors WHERE email = ? OR mobile = ?',
      [identifier, identifier]
    );

    if (!rows.length) {
      return res.status(400).json({ status: 'error', message: 'User not found.' });
    }

    const user = rows[0];

    // Validate password using bcrypt
   
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ status: 'error', message: 'Password incorrect.' });
    }

    // If valid, send user info (exclude password_hash)
    return res.status(200).json({
      status_code: 200,
      status: 'success',
      message: 'Login successful',
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      mobile: user.mobile,
      din: user.din,
      company_id: user.company_id,
      company_name: user.company_name
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};



//og
// exports.sendOTP = async (req, res) => {
//   const { mobile } = req.body;
//   try {
//     const [users] = await pool.query('SELECT id FROM directors WHERE mobile = ?', [mobile]);
//     if (!users.length) return res.status(400).json({ message: 'Mobile not found.' });
//     const otp = generateOTP();
//     const expires = new Date(Date.now() + 10 * 60000); // 10 min expiry
//     await pool.query(
//       'INSERT INTO otps (director_id, otp_code, expires_at) VALUES (?, ?, ?)',
//       [users[0].id, otp, expires]
//     );
//     // send OTP via SMS api integration here
//     res.json({ status_code: 200, message: 'OTP sent.', otp, expires_at: expires });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

//v1
// exports.sendOTP = async (req, res) => {
//   const { mobile } = req.body;
//   try {
//     const [users] = await pool.query('SELECT id FROM directors WHERE mobile = ?', [mobile]);
//     if (!users.length) return res.status(400).json({ status_code: 400, message: 'Mobile not found.' });

//     const otp = generateOTP();
//     const expires = new Date(Date.now() + 10 * 60000); // 10 min expiry
//     await pool.query(
//       'INSERT INTO otps (director_id, otp_code, expires_at) VALUES (?, ?, ?)',
//       [users[0].id, otp, expires]
//     );

//     // SMS API Call
//     var options = {
//       method: 'GET',
//       url: 'http://223.30.216.54/V2/http-api.php?',
//       qs: {
//         apikey: 'Iy1Kg6VgfzmQ400L',
//         senderid: 'Desstc',
//         number: mobile,
//         message: `Your OTP is: ${otp}`
//       },
//       strictSSL: false,
//       rejectUnauthorized: false,
//       headers: {
//         'cache-control': 'no-cache'
//       }
//     };

//     request(options, function (error, response, body) {
//       if (error) {
//         // Log the error, but still respond
//         return res.status(500).json({ status_code: 500, message: 'Error sending OTP SMS', error: error.message });
//       }

//       // Optionally log the response or body for debugging
//       console.log(body);

//       // Only send non-sensitive info back
//       res.status(200).json({ status_code: 200, message: 'OTP sent.', expires_at: expires });
//     });

//   } catch (err) {
//     res.status(500).json({ status_code: 500, message: err.message });
//   }
// };

//v2
exports.sendOTP = async (req, res) => {
  const { mobile } = req.body;
  try {
    const [users] = await pool.query('SELECT id FROM directors WHERE mobile = ?', [mobile]);
    if (!users.length) return res.status(400).json({ message: 'Mobile not found.' });


    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60000);
    console.log("User found:", users);

    await pool.query(
      'INSERT INTO otps (director_id, otp_code, expires_at) VALUES (?, ?, ?)',
      [users[0].id, otp, expires]
    );

    // const smsApiUrl = `https://sms.osdigital.in/V2/http-api.php`;
    const smsApiUrl = `https://bulksmsindia.app/V2/http-api.php`;
    const params = {
      apikey: process.env.SMS_API_KEY,
      senderid: process.env.SMS_SENDER,
      number: mobile,
      message: `Your OTP to register device with Dess Digital Meetings is ${otp} Do NOT share this OTP with anyone. Dess`,
      format: 'json'
    };

    const smsResponse = await axios.get(smsApiUrl, { params });

    console.log("SMS API Response:", smsResponse.data);

    if (smsResponse.data.status !== "OK") {
      return res.status(500).json({ message: 'Failed to send SMS', sms: smsResponse.data });
    }


    res.json({
      status_code: 200,
      message: 'OTP sent.',
      otp,
      expires_at: expires,
      sms: smsResponse.data
    });

  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  const { mobile, otp } = req.body;
  try {
    const [users] = await pool.query('SELECT id FROM directors WHERE mobile = ?', [mobile]);
    if (!users.length) return res.status(400).json({ message: 'User not found.' });
    console.log("user " + users[0]);
    const [rows] = await pool.query(
      'SELECT * FROM otps WHERE director_id = ? AND otp_code = ? AND used = 0',
      [users[0].id, otp]
    );
    // console.log(users[0].id);
    // console.log(otp);
    if (!rows.length || new Date(rows.expires_at) < new Date())
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    await pool.query('UPDATE otps SET used = 1 WHERE director_id = ?', [users[0].id]);

    res.json({ message: 'OTP verified.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { mobile, newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match.' });
  try {
    const [users] = await pool.query('SELECT id FROM directors WHERE mobile = ?', [mobile]);
    if (!users.length) return res.status(400).json({ message: 'User not found.' });
    const password_hash = await hashPassword(newPassword);
    await pool.query('UPDATE directors SET password_hash = ? WHERE id = ?', [password_hash, users[0].id]);
    res.json({ message: 'Password reset. Please login.', status_code: 200, status: 'success' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.checkMobile = async (req, res) => {
  const { mobile } = req.body;
  try {
    const exists = await mobileExists(mobile);
    if (exists) {
      res.status(200).json({ exists: true, message: "Mobile number exists in the database." });
    } else {
      res.status(200).json({ exists: false, message: "Mobile number not found." });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
async function mobileExists(mobile) {
  const [rows] = await pool.query('SELECT id FROM directors WHERE mobile = ?', [mobile]);
  return rows.length > 0;
}
//og
// exports.sendOTPRegistration = async (req, res) => {
//   const { din } = req.body;
//   try {
//     const otp = generateOTP();
//     const expires = new Date(Date.now() + 10 * 60000); // 10 min expiry
//     await pool.query(
//       'INSERT INTO otps (din, otp_code, expires_at) VALUES (?, ?, ?)',
//       [din, otp, expires]
//     );
//     res.json({ status_code: 200, message: 'OTP sent.', otp, expires_at: expires });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

//v1
exports.sendOTPRegistration = async (req, res) => {
  const { din, mobile } = req.body;
  try {
    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60000); // 10 min expiry

    // Save OTP to DB
    await pool.query(
      'INSERT INTO otps (din, otp_code, expires_at) VALUES (?, ?, ?)',
      [din, otp, expires]
    );

    // 🔹 Prepare SMS API call
    const smsApiUrl = `https://bulksmsindia.app/V2/http-api.php`;
    const params = {
      apikey: process.env.SMS_API_KEY,   // keep it safe in .env
      senderid: process.env.SMS_SENDER,  // keep in .env
      number: mobile, // assuming DIN is actually a mobile number here
      message: `Your OTP to register device with Dess Digital Meetings is ${otp} Do NOT share this OTP with anyone. Dess`,
      format: 'json'
    };

    // 🔹 Call SMS API
    const smsResponse = await axios.get(smsApiUrl, { params });
    console.log("SMS API Response:", smsResponse.data);

    // 🔹 Validate response
    if (smsResponse.data.status !== "OK") {
      return res.status(500).json({ message: 'Failed to send SMS', sms: smsResponse.data });
    }

    // 🔹 Success response
    res.json({
      status_code: 200,
      message: 'OTP sent.',
      otp, // ⚠️ remove in production
      expires_at: expires,
      sms: smsResponse.data
    });

  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.verifyOTPForRegistration = async (req, res) => {
  const { din, otp } = req.body;
  try {
    // Find director by DIN
    // const [users] = await pool.query('SELECT * FROM directors WHERE din = ?', [din]);
    // if (!users.length) return res.status(400).json({ message: 'User not found.' });
    // console.log(users);
    // Find matching unused OTP for this director
    const [rows] = await pool.query(
      'SELECT * FROM otps WHERE din = ? AND otp_code = ? AND used = 0',
      [din, otp]
    );
    // console.log(users[0].din, otp);
    if (!rows.length || new Date(rows.expires_at) < new Date())
      return res.status(200).json({ message: 'Invalid or expired OTP.' });

    // Mark OTP as used
    await pool.query('UPDATE otps SET used = 1 WHERE id = ?', [rows[0].id]);

    res.json({ message: 'OTP verified.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
