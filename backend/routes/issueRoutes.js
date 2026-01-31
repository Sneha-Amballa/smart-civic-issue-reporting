const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/report', authMiddleware, issueController.reportIssue);
router.get('/my-issues', authMiddleware, issueController.getMyIssues);
router.get('/:id', authMiddleware, issueController.getIssueDetails);

module.exports = router;
