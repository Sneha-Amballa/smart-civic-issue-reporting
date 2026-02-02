const express = require('express');
const router = express.Router();
const officerController = require('../controllers/officerController');
const authMiddleware = require('../middleware/authMiddleware');

// All officer routes require authentication
router.use(authMiddleware);

router.get('/my-department-issues', officerController.getDepartmentIssues);
router.patch('/issue/:id/status', officerController.updateIssueStatus);

module.exports = router;
