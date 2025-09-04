const express = require('express');
const router = express.Router();
const disclosuresController = require('../controllers/disclosuresController');
const multer = require('multer');
const upload = multer(); 

router.post('/submit', upload.single('file'),disclosuresController.submitDisclosure);
router.post('/submit-pending-disclosure', disclosuresController.submitPeningDisclosure);
router.post('/get-emails', disclosuresController.getEmailsByDisclosureId);
router.post('/get-fields', disclosuresController.getFieldsByDisclosureTypeId);




module.exports = router;
