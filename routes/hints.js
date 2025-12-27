const express = require('express');
const router = express.Router();
const { generateHint } = require('../controllers/hintController');

router.post('/', generateHint);

module.exports = router;

