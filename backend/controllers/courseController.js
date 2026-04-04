// backend/controllers/courseController.js
const db = require('../db');

// Tüm dersleri listele
exports.getAllCourses = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM courses');
    res.json(result.rows);
  } catch (err) {
    console.error('Dersler getirilirken hataaa:', err);
    res.status(500).send('Sunucu hatasıııı');
  }
};

// Yeni ders ekle
exports.addCourse = async (req, res) => {
  const { name, hours_per_week } = req.body;

  const query = `
    INSERT INTO courses (name, hours_per_week)
    VALUES ($1, $2)
    RETURNING *;
  `;

  try {
    const result = await db.query(query, [name, hours_per_week]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Ders eklenirken hata:', err);
    res.status(500).send('Sunucu hatası');
  }
};