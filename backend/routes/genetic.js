const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/genetic/generateSchedule
router.get('/generateSchedule', async (req, res) => {
  try {
    const coursesResult = await db.query('SELECT * FROM courses');
    const classroomsResult = await db.query('SELECT * FROM classrooms');

    const courses = coursesResult.rows;
    const classrooms = classroomsResult.rows;

    const schedule = await generateSchedule(courses, classrooms);

    res.json(schedule);
  } catch (err) {
    console.error('Genetik algoritma verilerini çekerken hata:', err);
    res.status(500).send('Sunucu hatası');
  }
});
module.exports = router;