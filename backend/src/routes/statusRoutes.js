const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');

router.get('/:requestId', statusController.getStatus);

module.exports = router; 