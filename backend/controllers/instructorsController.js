const db = require("../db");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const exportsDir = path.join(__dirname, "../exports");
if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

// Validasyon
function validateInstructor({ name, max_weekly_hours }) {
  const errors = [];
  if (!name || !name.trim()) errors.push("İsim gereklidir");
  if (max_weekly_hours != null && Number(max_weekly_hours) < 0) {
    errors.push("Maksimum haftalık saat negatif olamaz");
  }
  return errors;
}

// 1️⃣ Tüm öğretmenler
exports.getAllInstructors = async (req, res) => {
  try {
    // PostgreSQL: .promise() kaldırıldı, veri .rows içinde gelir
    const result = await db.query("SELECT * FROM instructors ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Öğretmen getirme hatası:", err.message);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

// 2️⃣ Yeni öğretmen ekle
exports.addInstructor = async (req, res) => {
  const { name, max_weekly_hours } = req.body;
  const errors = validateInstructor({ name, max_weekly_hours });
  if (errors.length) return res.status(400).json({ errors });

  try {
    // PostgreSQL: ? yerine $1, $2
    const query = "INSERT INTO instructors (name, max_weekly_hours) VALUES ($1, $2) RETURNING *";
    const values = [name.trim(), Number(max_weekly_hours) || 40];

    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Öğretmen ekleme hatası:", err.message);
    res.status(500).json({ error: "Veritabanı hatası" });
  }
};

// 3️⃣ Güncelle
exports.updateInstructor = async (req, res) => {
  const { id } = req.params;
  const { name, max_weekly_hours } = req.body;
  const errors = validateInstructor({ name, max_weekly_hours });
  if (errors.length) return res.status(400).json({ errors });

  try {
    const query = "UPDATE instructors SET name = $1, max_weekly_hours = $2 WHERE id = $3";
    const values = [name.trim(), Number(max_weekly_hours) || 40, id];
    
    await db.query(query, values);
    res.json({ message: "Eğitmen güncellendi" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Güncelleme hatası" });
  }
};

// 4️⃣ Sil
exports.deleteInstructor = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM instructors WHERE id = $1", [id]);
    res.json({ message: "Eğitmen silindi" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Silme hatası" });
  }
};

// 5️⃣ Excel export
exports.exportToExcel = async (req, res) => {
  try {
    const result = await db.query("SELECT id, name, max_weekly_hours FROM instructors");
    
    const worksheet = XLSX.utils.json_to_sheet(result.rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Instructors");

    const filePath = path.join(exportsDir, "instructors.xlsx");
    XLSX.writeFile(workbook, filePath);

    res.download(filePath, "instructors.xlsx", (err) => {
      if (err) console.error(err);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Excel export hatası" });
  }
};