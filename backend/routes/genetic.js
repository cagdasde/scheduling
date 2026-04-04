const express = require('express');
const router = express.Router();
const db = require('../db');

// Eğer generateSchedule fonksiyonun başka bir dosyadaysa:
 const { generateSchedule } = require('../utils/geneticAlgorithm'); 

// GET /api/genetic/generateSchedule
router.get('/generateSchedule', async (req, res) => {
  try {
    // 1. Verileri çek
    const coursesResult = await db.query('SELECT * FROM courses');
    const classroomsResult = await db.query('SELECT * FROM classrooms');

    const courses = coursesResult.rows;
    const classrooms = classroomsResult.rows;

    // 2. Veri kontrolü (Boş tablo kontrolü)
    if (courses.length === 0 || classrooms.length === 0) {
      return res.status(400).json({ 
        error: "Eksik veri", 
        message: "Algoritmayı çalıştırmak için önce ders ve sınıf eklemelisiniz." 
      });
    }

    // 3. Algoritmayı çalıştır
    // Not: generateSchedule fonksiyonunun 'async' olduğundan emin ol
    const schedule = await generateSchedule(courses, classrooms);

    // 4. Yanıtı JSON olarak dön
    res.json(schedule);

  } catch (err) {
    console.error('Genetik algoritma hatası:', err.message);
    // Hata detayını frontend'e JSON olarak gönderelim ki 'Unexpected end of JSON' almayasın
    res.status(500).json({ 
      error: "Sunucu hatası", 
      details: err.message 
    });
  }
});

module.exports = router;