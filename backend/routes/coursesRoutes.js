const express = require('express');
const router = express.Router();
const upload = require('multer')({ dest:'uploads/' });
const coursesController = require('../controllers/coursesController');

router.get('/', coursesController.getAllCourses);
router.post('/import', upload.single('file'), coursesController.importFromExcel);
router.get('/export', coursesController.exportToExcel);

module.exports = router;
