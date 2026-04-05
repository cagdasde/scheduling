const express = require('express');
const router = express.Router();
const geneticController = require('../controllers/geneticController');

// DİKKAT: index.js'de zaten '/api/genetic' dedik. 
// Bu yüzden burada sadece geri kalan kısmı yazıyoruz.
router.get('/generateSchedule', geneticController.generateSchedule);

module.exports = router;