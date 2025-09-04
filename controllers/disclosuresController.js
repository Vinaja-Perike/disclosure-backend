const pool = require('../db');

// exports.submitDisclosure = async (req, res) => {
//   const { director_id, type_id, recipient_id, details, din } = req.body;
//   try {
//     const [types] = await pool.query(
//       'SELECT type_name FROM disclosure_types WHERE id = ?',
//       [type_id]
//     );
//     if (!types.length) {
//       return res.status(400).json({
//         status: 'error',
//         status_code: 400,
//         message: 'Invalid disclosure type.'
//       });
//     }
//     const  type_name  = types[0].type_name;
//     console.log(types);
//     console.log(type_name);
//     await pool.query(
//       'INSERT INTO disclosures (director_id, type_id, type_name, recipient_id, details, status, din) VALUES (?, ?, ?, ?, ?, ?, ?)',
//       [director_id, type_id, type_name, recipient_id, details, 'submitted', din || null]
//     );



//     return res.status(200).json({
//       message: 'Disclosure submitted.',
//       status: 'success',
//       status_code: 200,
//       resolved_type_name: type_name
//     });
//   } catch (err) {
//     return res.status(500).json({
//       message: err.message,
//       status: 'error',
//       status_code: 500
//     });
//   }
// };


//og
// exports.submitDisclosure = async (req, res) => {
//   const { director_id, type_id, recipient_id, details, din, emails } = req.body; // emails: ["a@b.com", "b@c.com"]
//   const connection = await pool.getConnection(); // Use transaction for integrity
//   try {
//     await connection.beginTransaction();

//     // Fetch type_name
//     const [types] = await connection.query(
//       'SELECT type_name FROM disclosure_types WHERE id = ?',
//       [type_id]
//     );
//     console.log(types);

//     if (!types.length) {
//       await connection.rollback();
//       return res.status(400).json({
//         status: 'error',
//         status_code: 400,
//         message: 'Invalid disclosure type.'
//       });
//     }
//     const type_name = types[0].type_name;
//     console.log(type_name);
//     // Insert disclosure
//     const [result] = await connection.query(
//       'INSERT INTO disclosures (director_id, type_id, type_name, recipient_id, details, status, din) VALUES (?, ?, ?, ?, ?, ?, ?)',
//       [director_id, type_id, type_name, 1, details, 'submitted', din || null]
//     );
//     const disclosure_id = result.insertId;
//     console.log(disclosure_id);
//     // Handle emails if present
//     const emailIds = [];
//     if (Array.isArray(emails)) {
//       for (const email of emails) {
//         // Insert IGNORE done earlier
//         // Fetch email id
//         await connection.query(
//           'INSERT IGNORE INTO emails (email) VALUES (?)',
//           [email]
//         );
//         const [eidResult] = await connection.query(
//           'SELECT id FROM emails WHERE email = ?',
//           [email]
//         );
//         const email_id = eidResult[0].id;
//         emailIds.push(email_id);
//         console.log(emailIds);
//         // Insert IGNORE into disclosure_emails done earlier
//         await connection.query(
//           'INSERT IGNORE INTO disclosure_emails (disclosure_id, email_id) VALUES (?, ?)',
//           [disclosure_id, email_id]
//         );
//       }
//     }

//     // Update disclosures.email_ids with comma separated IDs
//     if (emailIds.length > 0) {
//       await connection.query(
//         'UPDATE disclosures SET email_ids = ? WHERE id = ?',
//         [emailIds.join(','), disclosure_id]
//       );
//     }

//     await connection.commit();

//     return res.status(200).json({
//       message: 'Disclosure submitted.',
//       status: 'success',
//       status_code: 200,
//       resolved_type_name: type_name,
//       disclosure_id,
//       emails: emails || []
//     });
//   } catch (err) {
//     await connection.rollback();
//     return res.status(500).json({
//       message: err.message,
//       status: 'error',
//       status_code: 500
//     });
//   } finally {
//     connection.release();
//   }
// };

exports.submitDisclosure = async (req, res) => {
  const {
    director_id,
    type_id,
    recipient_id,
    details,
    din,
    director_name,
    company_name,
    director_position
  } = req.body;
  const file = req.file;
  let { emails } = req.body;

  if (typeof emails === 'string') {
    const trimmed = emails.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        emails = Array.isArray(parsed) ? parsed : [];
      } catch {
        emails = trimmed ? [trimmed] : [];
      }
    } else {
      emails = trimmed ? [trimmed] : [];
    }
  } else if (!Array.isArray(emails)) {
    emails = [];
  }
  emails = Array.from(new Set(
    emails
      .map(e => String(e).trim().toLowerCase())
      .filter(Boolean)
  ));
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Fetch type_name as before
    const [types] = await connection.query(
      'SELECT type_name FROM disclosure_types WHERE id = ?',
      [type_id]
    );

    if (!types.length) {
      await connection.rollback();
      return res.status(400).json({
        status: 'error',
        status_code: 400,
        message: 'Invalid disclosure type.'
      });
    }
    const type_name = types[0].type_name;

    // Insert disclosure with new fields from request body directly
    const [result] = await connection.query(
      `INSERT INTO disclosures 
       (director_id, type_id, type_name, recipient_id, details, status, din, director_name, company_name, director_position) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        director_id,
        type_id,
        type_name,
        recipient_id,
        details,
        'submitted',
        din || null,
        director_name || null,
        company_name || null,
        director_position || null
      ]
    );

    const disclosure_id = result.insertId;

    // console.log(disclosure_id);
    // Handle emails if present
    const emailIds = [];
    if (Array.isArray(emails)) {
      for (const email of emails) {
        // Insert IGNORE done earlier
        // Fetch email id
        await connection.query(
          'INSERT IGNORE INTO emails (email) VALUES (?)',
          [email]
        );
        const [eidResult] = await connection.query(
          'SELECT id FROM emails WHERE email = ?',
          [email]
        );
        const email_id = eidResult[0].id;
        emailIds.push(email_id);
        // console.log(emailIds);
        // Insert IGNORE into disclosure_emails done earlier
        await connection.query(
          'INSERT IGNORE INTO disclosure_emails (disclosure_id, email_id) VALUES (?, ?)',
          [disclosure_id, email_id]
        );
      }
    }
    console.log(emailIds);
    // Update disclosures.email_ids with comma separated IDs
    if (emailIds.length > 0) {
      await connection.query(
        'UPDATE disclosures SET email_ids = ? WHERE id = ?',
        [emailIds.join(','), disclosure_id]
      );
    }
    if (file) {
      if (file.mimetype !== 'application/pdf') {
        await connection.rollback();
        return res.status(400).json({ status: 'error', status_code: 400, message: 'Only PDF allowed' });
      }
      await connection.query(
        `INSERT INTO disclosure_files (disclosure_id, filename, mimetype, size_bytes, data)
     VALUES (?, ?, ?, ?, ?)`,
        [disclosure_id, file.originalname, file.mimetype, file.size, file.buffer]
      );
    }
    // (rest of your existing email handling and commit logic)
    await connection.commit();

    return res.status(200).json({
      message: 'Disclosure submitted.',
      status: 'success',
      status_code: 200,
      resolved_type_name: type_name,
      disclosure_id,
      emails: emails || [],
      file: file ? { filename: file.originalname, size: file.size } : null
    });
  } catch (err) {
    await connection.rollback();
    return res.status(500).json({
      message: err.message,
      status: 'error',
      status_code: 500
    });
  } finally {
    connection.release();
  }
};




exports.submitPeningDisclosure = async (req, res) => {
  const { director_id, type_id, recipient_id, details, din } = req.body;
  try {
    const [types] = await pool.query(
      'SELECT type_name FROM disclosure_types WHERE id = ?',
      [type_id]
    );
    if (!types.length) {
      return res.status(400).json({
        status: 'error',
        status_code: 400,
        message: 'Invalid disclosure type.'
      });
    }
    const type_name = types[0].type_name;
    // console.log(types);
    // console.log(type_name);
    await pool.query(
      'INSERT INTO disclosures (director_id, type_id, type_name, recipient_id, details, status, din) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [director_id, type_id, type_name, recipient_id, details, 'pending', din || null]
    );



    return res.status(200).json({
      message: 'Disclosure submitted.',
      status: 'success',
      status_code: 200,
      resolved_type_name: type_name
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
      status: 'error',
      status_code: 500
    });
  }
};


exports.getEmailsByDisclosureId = async (req, res) => {
  const { disclosure_id } = req.body;
  try {
    // 1) Get comma-separated email_ids from disclosures table
    const [disclosureRows] = await pool.query(
      'SELECT email_ids FROM disclosures WHERE id = ?',
      [disclosure_id]
    );
    // console.log(disclosureRows);
    if (!disclosureRows.length || !disclosureRows[0].email_ids) {
      // Return empty list if none found
      return res.status(200).json({
        status: 'success',
        status_code: 200,
        disclosure_id,
        emails: []
      });
    }

    // 2) Split and clean the email IDs
    const emailIds = disclosureRows[0].email_ids.split(',').map(id => id.trim()).filter(id => id);

    if (emailIds.length === 0) {
      return res.status(200).json({
        status: 'success',
        status_code: 200,
        disclosure_id,
        emails: []
      });
    }

    // 3) Fetch emails for these IDs from emails table
    // Use placeholders for array length safely
    const placeholders = emailIds.map(() => '?').join(',');
    const [emailRows] = await pool.query(
      `SELECT email FROM emails WHERE id IN (${placeholders})`,
      emailIds
    );

    // 4) Extract array of emails
    const emails = emailRows.map(row => row.email);

    res.status(200).json({
      status: 'success',
      status_code: 200,
      disclosure_id,
      emails
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      status_code: 500,
      message: err.message
    });
  }
};

exports.getFieldsByDisclosureTypeId = async (req, res) => {
  try {
    const { disclosure_type_id } = req.body;

    if (!disclosure_type_id) {
      return res.status(400).json({
        status: 'error',
        status_code: 400,
        message: 'Disclosure type ID is required.'
      });
    }

    // 1) Fetch disclosure type row to get fields string
    const [typeRows] = await pool.query(
      'SELECT fields FROM disclosure_types WHERE id = ?',
      [disclosure_type_id]
    );

    if (!typeRows.length || !typeRows[0].fields) {
      return res.status(404).json({
        status: 'error',
        status_code: 404,
        message: 'Disclosure type not found or has no fields.'
      });
    }

    const fieldsString = typeRows[0].fields;
    const idsArray = fieldsString.split(',').map(id => id.trim()).filter(id => id);

    if (idsArray.length === 0) {
      return res.status(200).json([]);
    }

    const placeholders = idsArray.map(() => '?').join(',');

    // 2) Fetch fields data
    const [fieldsRows] = await pool.query(
      `SELECT id, display_name, priority, type FROM fields WHERE id IN (${placeholders}) ORDER BY priority ASC`,
      idsArray
    );

    // Map typle -> type in response
    const response = fieldsRows.map(row => ({
      id: row.id,
      display_name: row.display_name,
      priority: row.priority,
      type: row.type
    }));

    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      status_code: 500,
      message: err.message
    });
  }
};
