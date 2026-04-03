const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/courses — Tüm dersleri getir
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM courses");
    res.json(result.rows);
  } catch (err) {
    console.error("Dersleri getirirken hata:", err);
    res.status(500).send("Sunucu hatası");
  }
});

// POST /api/courses — Yeni ders ekle
router.post("/", async (req, res) => {
  try {
    const {
      name,
      code,
      instructor,
      weekly_hours,
      required_capacity,
      preferred_days,
      preferred_time_slots,
      equipment_needed,
    } = req.body;

    if (!name || !code || !instructor) {
      return res
        .status(400)
        .json({ error: "name, code ve instructor zorunlu" });
    }

    const result = await db.query(
      `INSERT INTO courses
      (name, code, instructor, weekly_hours, required_capacity, preferred_days, preferred_time_slots, equipment_needed)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        name,
        code,
        instructor,
        weekly_hours,
        required_capacity,
        JSON.stringify(preferred_days || []),
        JSON.stringify(preferred_time_slots || []),
        equipment_needed,
      ]
    );

    res.json({ success: true, course: result.rows[0] });
  } catch (err) {
    console.error("Course eklenirken hata:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// DELETE /api/courses/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM courses WHERE id = $1", [id]);
    res.json({ message: "Ders silindi" });
  } catch (err) {
    console.error("Ders silinirken hata:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// PUT /api/courses/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, code, instructor } = req.body;

  try {
    await db.query(
      `UPDATE courses
       SET name = $1, code = $2, instructor = $3
       WHERE id = $4`,
      [name, code, instructor, id]
    );

    res.json({ message: "Ders güncellendi" });
  } catch (err) {
    console.error("Ders güncellenirken hata:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

module.exports = router;