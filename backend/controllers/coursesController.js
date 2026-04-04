const db = require("../db");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const exportsDir = path.join(__dirname, "../exports");
if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

// Validasyon
function validateCourse({ name, code, instructor, weekly_hours }) {
  const errors = [];
  if (!name || !name.trim()) errors.push("Name required");
  if (!code || !code.trim()) errors.push("Code required");
  if (!instructor || !instructor.trim()) errors.push("Instructor required");
  if (weekly_hours < 0) errors.push("Weekly hours cannot be negative");
  return errors;
}

// CRUD + Excel işlemleri
exports.getAllCourses = async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM courses");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.addCourse = async (req, res) => {
  const { name, code, instructor, weekly_hours, required_capacity, preferred_days, preferred_time_slots, equipment_needed } = req.body;
  const errors = validateCourse(req.body);
  if (errors.length) return res.status(400).json({ errors });

  try {
    const [result] = await db.promise().query(
      `INSERT INTO courses 
      (name, code, instructor, weekly_hours, required_capacity, preferred_days, preferred_time_slots, equipment_needed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        code.trim(),
        instructor.trim(),
        weekly_hours || 0,
        required_capacity || 0,
        JSON.stringify(preferred_days || []),
        JSON.stringify(preferred_time_slots || []),
        equipment_needed || ""
      ]
    );
    res.status(201).json({ id: result.insertId, name, code, instructor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateCourse = async (req, res) => {
  const { id } = req.params;
  const { name, code, instructor } = req.body;
  const errors = validateCourse(req.body);
  if (errors.length) return res.status(400).json({ errors });

  try {
    await db.promise().query(
      "UPDATE courses SET name=?, code=?, instructor=? WHERE id=?",
      [name.trim(), code.trim(), instructor.trim(), id]
    );
    res.json({ message: "Course updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    await db.promise().query("DELETE FROM courses WHERE id=?", [id]);
    res.json({ message: "Course deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.importFromExcel = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Excel file required" });
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    for (let row of sheet) {
      const { name, code, instructor, weekly_hours } = row;
      const errors = validateCourse({ name, code, instructor, weekly_hours });
      if (errors.length) continue;

      await db.promise().query(
        `INSERT INTO courses (name, code, instructor, weekly_hours) VALUES (?, ?, ?, ?)`,
        [name.trim(), code.trim(), instructor.trim(), weekly_hours || 0]
      );
    }
    fs.unlink(req.file.path, () => {});
    res.status(201).json({ message: "Excel import successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Excel import error" });
  }
};

exports.exportToExcel = async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM courses");
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Courses");

    const filePath = path.join(exportsDir, "courses.xlsx");
    XLSX.writeFile(workbook, filePath);

    res.download(filePath, "courses.xlsx", (err) => {
      if (err) console.error(err);
      fs.unlink(filePath, () => {});
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Excel export error" });
  }
};
