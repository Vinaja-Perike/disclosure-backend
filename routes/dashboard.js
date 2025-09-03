const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/disclosures/:din/:status', dashboardController.getDisclosures);
router.get('/disclosure-types', dashboardController.getDisclosureTypes);
router.get('/all-disclosures/:din', dashboardController.getAllDisclosures);
module.exports = router;
