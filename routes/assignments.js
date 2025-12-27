const express = require('express');
const router = express.Router();
const { getAssignments, getAssignmentById } = require('../controllers/assignmentController');

router.get('/', getAssignments);
router.get('/:id', getAssignmentById);

module.exports = router;

