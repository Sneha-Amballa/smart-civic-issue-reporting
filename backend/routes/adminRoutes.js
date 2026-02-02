const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

// All admin routes are protected by auth AND admin middleware
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/all-officers', adminController.getAllOfficers);
router.post('/approve/:id', adminController.approveOfficer);
router.post('/reject/:id', adminController.rejectOfficer);
router.get('/all-issues', adminController.getAllIssues);

module.exports = router;
