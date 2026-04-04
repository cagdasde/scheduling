const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const coursesController = require('../controllers/coursesController');

// 1. Temel CRUD İşlemleri
router.get('/', coursesController.getAllCourses);

// BURAYA DİKKAT: Eğer controller'da "addCourse" yoksa burası patlatır.
// İsimlerin controller dosyandakiyle %100 aynı olduğundan emin ol.
if (coursesController.addCourse) {
    router.post('/', coursesController.addCourse);
}
if (coursesController.updateCourse) {
    router.put('/:id', coursesController.updateCourse);
}
if (coursesController.deleteCourse) {
    router.delete('/:id', coursesController.deleteCourse);
}

// 2. Excel İşlemleri
router.post('/import', upload.single('file'), coursesController.importFromExcel);
router.get('/export', coursesController.exportToExcel);

module.exports = router;