const db = require("../db");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const exportsDir = path.join(__dirname, "../exports");
if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

// Yardımcı: JSON parse güvenli
function safelyParseJSON(value) {
  try {
    return JSON.parse(value || "[]");
  } catch (e) {
    return [];
  }
}

// Validasyon
function validateClassroom({ name, capacity }) {
  const errors = [];
  if (!name || !name.trim()) errors.push("Name required");
  if (capacity == null || capacity < 0) errors.push("Capacity required and cannot be negative");
  return errors;
}

// 1️⃣ Tüm sınıflar
exports.getAllClassrooms = async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM classrooms");
    const classrooms = rows.map((row) => ({
      ...row,
      equipment_available: safelyParseJSON(row.equipment_available),
    }));
    res.json(classrooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// 2️⃣ Yeni sınıf ekle
exports.addClassroom = async (req, res) => {
  const { name, capacity, equipment_available } = req.body;
  const errors = validateClassroom({ name, capacity });
  if (errors.length) return res.status(400).json({ errors });

  try {
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO classrooms (name, capacity, equipment_available) VALUES (?, ?, ?)",
        [name.trim(), capacity, JSON.stringify(equipment_available || [])]
      );
    res.status(201).json({
      id: result.insertId,
      name,
      capacity,
      equipment_available: equipment_available || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// 3️⃣ Sınıf güncelle
exports.updateClassroom = async (req, res) => {
  const { id } = req.params;
  const { name, capacity, equipment_available } = req.body;
  const errors = validateClassroom({ name, capacity });
  if (errors.length) return res.status(400).json({ errors });

  try {
    await db
      .promise()
      .query(
        "UPDATE classrooms SET name = ?, capacity = ?, equipment_available = ? WHERE id = ?",
        [name.trim(), capacity, JSON.stringify(equipment_available || []), id]
      );
    res.json({ message: "Classroom updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// 4️⃣ Sınıf sil
exports.deleteClassroom = async (req, res) => {
  const { id } = req.params;
  try {
    await db.promise().query("DELETE FROM classrooms WHERE id = ?", [id]);
    res.json({ message: "Classroom deleted" });
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
      const { name, capacity, equipment_available } = row;
      const errors = validateClassroom({ name, capacity });
      if (errors.length) continue;

      await db
        .promise()
        .query(
          "INSERT INTO classrooms (name, capacity, equipment_available) VALUES (?, ?, ?)",
          [name.trim(), capacity, JSON.stringify(equipment_available || [])]
        );
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
    const [rows] = await db.promise().query("SELECT * FROM classrooms");
    const formatted = rows.map((row) => ({
      ...row,
      equipment_available: safelyParseJSON(row.equipment_available),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Classrooms");

    const filePath = path.join(exportsDir, "classrooms.xlsx");
    XLSX.writeFile(workbook, filePath);

    res.download(filePath, "classrooms.xlsx", (err) => {
      if (err) console.error(err);
      fs.unlink(filePath, () => {});
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Excel export error" });
  }
};
