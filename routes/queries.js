const express = require('express');
const router = express.Router();
const { executeQuery } = require('../controllers/queryController');
const validateSQL = require('../middleware/sqlValidation');

router.post('/execute', validateSQL, executeQuery);

module.exports = router;

