const express = require('express');
const router = express.Router();
const { predictCarPrice } = require('../controllers/predictController');

router.post('/predict', predictCarPrice);

module.exports = router;