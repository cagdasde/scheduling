const express = require("express");
const router = express.Router();
const db = require("../db");

// 1. Tüm sınıfları listele
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM classrooms");

    const classrooms = result.rows.map(row => ({
      ...row,
      equipment_available: safelyParseJSON(row.equipment_available),
    }));

    res.json(classrooms);
  } catch (err) {
    console.error("Sınıflar getirirken hata:", err);
    res.status(500).send("Sunucu hatası");
  }
});

// 2. Yeni sınıf ekle
router.post("/", async (req, res) => {
  const { name, capacity, equipment_available } = req.body;

  if (!name || capacity == null) {
    return res.status(400).json({ error: "name ve capacity zorunlu" });
  }

  try {
    const equipmentStr = JSON.stringify(equipment_available || []);

    const result = await db.query(
      `INSERT INTO classrooms (name, capacity, equipment_available)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, capacity, equipmentStr]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Sınıf eklenirken hata:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// 3. Sınıf güncelle
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, capacity, equipment_available } = req.body;

  if (!name || capacity == null) {
    return res.status(400).json({ error: "name ve capacity zorunlu" });
  }

  try {
    const equipmentStr = JSON.stringify(equipment_available || []);

    await db.query(
      `UPDATE classrooms
       SET name = $1, capacity = $2, equipment_available = $3
       WHERE id = $4`,
      [name, capacity, equipmentStr, id]
    );

    res.json({ message: "Sınıf güncellendi" });
  } catch (err) {
    console.error("Sınıf güncellenirken hata:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// 4. Sınıf sil
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM classrooms WHERE id = $1", [id]);
    res.json({ message: "Sınıf silindi" });
  } catch (err) {
    console.error("Sınıf silinirken hata:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// JSON parse helper
function safelyParseJSON(value) {
  try {
    return JSON.parse(value || "[]");
  } catch (e) {
    console.warn("Geçersiz JSON verisi:", value);
    return [];
  }
}

module.exports = router;