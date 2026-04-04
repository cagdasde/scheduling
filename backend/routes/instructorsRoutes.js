const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const instructorsController = require('../controllers/instructorsController');

// 1. Temel Listeleme ve Ekleme
router.get('/', instructorsController.getAllInstructors);
router.post('/', instructorsController.addInstructor);

// 2. Güncelleme ve Silme
router.put('/:id', instructorsController.updateInstructor);
router.delete('/:id', instructorsController.deleteInstructor);

// 3. Excel İşlemleri (Hatanın muhtemel kaynağı burasıydı)
// Controller'da importFromExcel fonksiyonunun varlığını kontrol ederek güvenli hale getiriyoruz
if (instructorsController.importFromExcel) {
    router.post('/import', upload.single('file'), instructorsController.importFromExcel);
}

if (instructorsController.exportToExcel) {
    router.get('/export', instructorsController.exportToExcel);
}

module.exports = router;