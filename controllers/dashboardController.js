const pool = require('../db');

exports.getDisclosures = async (req, res) => {
  const { din, status } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM disclosures WHERE din = ? AND status = ?', [din, status]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// exports.getDisclosureTypes = async (req, res) => {
//   try {
//     const [rows] = await pool.query('SELECT * FROM disclosure_types');
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
exports.getDisclosureTypes = async (req, res) => {
  try {
    // 1) Fetch all disclosure_types
    const [types] = await pool.query('SELECT * FROM disclosure_types');

    if (!types.length) {
      return res.status(200).json([]);
    }

    // 2) Collect all unique field IDs from all disclosure types
    const allFieldIds = new Set();

    types.forEach(type => {
      if (type.fields) { // assuming fields column contains comma-separated IDs
        type.fields.split(',').forEach(fid => {
          const trimmed = fid.trim();
          if (trimmed) allFieldIds.add(trimmed);
        });
      }
    });

    // 3) Fetch all fields details for all unique IDs
    let fieldsMap = new Map();
    if (allFieldIds.size > 0) {
      const placeholders = Array(allFieldIds.size).fill('?').join(',');
      const [fieldsRows] = await pool.query(
        `SELECT id, display_name, priority, type FROM fields WHERE id IN (${placeholders}) ORDER BY priority ASC`,
        Array.from(allFieldIds)
      );

      // Create a Map keyed by field ID for quick lookup
      fieldsRows.forEach(field => {
        fieldsMap.set(field.id.toString(), {
          id: field.id,
          display_name: field.display_name,
          priority: field.priority,
          type: field.type
        });
      });
    }

    // 4) Attach the detailed fields array to each disclosure type
    const result = types.map(type => {
      const fieldIds = (type.fields || '').split(',').map(fid => fid.trim()).filter(fid => fid);
      const detailedFields = fieldIds.map(id => fieldsMap.get(id)).filter(f => f); // skip missing

      return {
        ...type,
        fields: detailedFields
      };
    });

    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

//OG
// exports.getAllDisclosures = async (req, res) => {
//   const { din } = req.params;
//   try {
//     const [rows] = await pool.query(
//       'SELECT * FROM disclosures WHERE din = ?',
//       [din]
//     );
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

exports.getAllDisclosures = async (req, res) => {
  const { din } = req.params;
  try {
    // 1) Fetch disclosures for DIN
    const [rows] = await pool.query(
      'SELECT * FROM disclosures WHERE din = ?',
      [din]
    );

    if (!rows.length) {
      return res.status(200).json([]);
    }

    // 2) Gather disclosure IDs
    const ids = rows.map(r => r.id);

    // 3) Fetch files for these disclosures
    const placeholders = ids.map(() => '?').join(',');
    const [files] = await pool.query(
      `SELECT id, disclosure_id, filename, mimetype, size_bytes, data
       FROM disclosure_files
       WHERE disclosure_id IN (${placeholders})`,
      ids
    );

    // 4) Index files by disclosure_id (assume one file per disclosure; adjust if multiple)
    const fileByDisclosureId = new Map();
    for (const f of files) {
      fileByDisclosureId.set(f.disclosure_id, f);
    }

    // 5) Build response with base64-encoded data
    const response = rows.map(r => {
      const f = fileByDisclosureId.get(r.id);
      if (!f) {
        return {
          ...r,
          file: null
        };
      }
      // Convert BLOB Buffer -> base64
      const base64 = Buffer.isBuffer(f.data) ? f.data.toString('base64') : null;
      return {
        ...r,
        file: {
          id: f.id,
          filename: f.filename,
          mimetype: f.mimetype,
          size_bytes: f.size_bytes,
          base64 // consider very large; for big files, prefer a download route
        }
      };
    });

    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
