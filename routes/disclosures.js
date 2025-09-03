const express = require('express');
const router = express.Router();
const disclosuresController = require('../controllers/disclosuresController');

router.post('/submit', disclosuresController.submitDisclosure);
router.post('/submit-pending-disclosure', disclosuresController.submitPeningDisclosure);
router.post('/get-emails', disclosuresController.getEmailsByDisclosureId);
router.post('/get-fields', disclosuresController.getFieldsByDisclosureTypeId);




module.exports = router;
