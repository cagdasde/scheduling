const db = require("../db");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

// 📌 Excel export klasörü
const exportsDir = path.join(__dirname, "../exports");
if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

// Yardımcı: validasyon
function validateInstructor({ name, email, max_weekly_hours }) {
  const errors = [];
  if (!name || !name.trim()) errors.push("Name is required");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Valid email is required");
  if (Number(max_weekly_hours) < 0) errors.push("max_weekly_hours cannot be negative");
  return errors;
}

// 1️⃣ Tüm öğretmenler
exports.getAllInstructors = async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM instructors");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// 2️⃣ Yeni öğretmen ekle
exports.addInstructor = async (req, res) => {
  const { name, email, max_weekly_hours } = req.body;
  const errors = validateInstructor(req.body);
  if (errors.length) return res.status(400).json({ errors });

  try {
    const [result] = await db
      .promise()
      .query("INSERT INTO instructors (name, email, max_weekly_hours) VALUES (?, ?, ?)", [
        name.trim(),
        email.trim(),
        Number(max_weekly_hours) || 0,
      ]);
    res.status(201).json({ id: result.insertId, name, email, max_weekly_hours: max_weekly_hours || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// 3️⃣ Güncelle
exports.updateInstructor = async (req, res) => {
  const { id } = req.params;
  const { name, email, max_weekly_hours } = req.body;
  const errors = validateInstructor(req.body);
  if (errors.length) return res.status(400).json({ errors });

  try {
    await db
      .promise()
      .query("UPDATE instructors SET name = ?, email = ?, max_weekly_hours = ? WHERE id = ?", [
        name.trim(),
        email.trim(),
        Number(max_weekly_hours) || 0,
        id,
      ]);
    res.json({ message: "Instructor updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// 4️⃣ Sil
exports.deleteInstructor = async (req, res) => {
  const { id } = req.params;
  try {
    await db.promise().query("DELETE FROM instructors WHERE id = ?", [id]);
    res.json({ message: "Instructor deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// 5️⃣ Excel import
exports.importFromExcel = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Excel file required" });

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    for (let row of sheet) {
      const { name, email, max_weekly_hours } = row;
      const errors = validateInstructor({ name, email, max_weekly_hours });
      if (errors.length) continue; // geçersiz satırı atla

      await db
        .promise()
        .query("INSERT INTO instructors (name, email, max_weekly_hours) VALUES (?, ?, ?)", [
          name.trim(),
          email.trim(),
          Number(max_weekly_hours) || 0,
        ]);
    }

    fs.unlink(req.file.path, () => {});
    res.status(201).json({ message: "Excel import successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Excel import error" });
  }
};

// 6️⃣ Excel export
exports.exportToExcel = async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM instructors");

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Instructors");

    const filePath = path.join(exportsDir, "instructors.xlsx");
    XLSX.writeFile(workbook, filePath);

    res.download(filePath, "instructors.xlsx", (err) => {
      if (err) console.error(err);
      fs.unlink(filePath, () => {});
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Excel export error" });
  }
};
