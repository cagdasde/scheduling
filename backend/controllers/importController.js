const XLSX = require("xlsx");
const fs = require("fs");
const db = require("../db");

exports.importFromExcel = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const workbook = XLSX.readFile(req.file.path);

    // Instructors
    if (workbook.SheetNames.includes("Instructors")) {
      const instructors = XLSX.utils.sheet_to_json(workbook.Sheets["Instructors"]);
      for (let ins of instructors) {
        const { name, email, max_weekly_hours } = ins;
        await db.promise().query(
          "INSERT INTO instructors (name, email, max_weekly_hours) VALUES (?, ?, ?)",
          [name, email, max_weekly_hours || 0]
        );
      }
    }

    // Courses
    if (workbook.SheetNames.includes("Courses")) {
      const courses = XLSX.utils.sheet_to_json(workbook.Sheets["Courses"]);
      for (let course of courses) {
        const { name, code, instructor, hours_per_week, required_capacity, preferred_days, preferred_time_slots, equipment_needed } = course;
        await db.promise().query(
          "INSERT INTO courses (name, code, instructor, hours_per_week, required_capacity, preferred_days, preferred_time_slots, equipment_needed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            name,
            code,
            instructor,
            hours_per_week || 0,
            required_capacity || 0,
            JSON.stringify(preferred_days || []),
            JSON.stringify(preferred_time_slots || []),
            JSON.stringify(equipment_needed || [])
          ]
        );
      }
    }

    // Classrooms
    if (workbook.SheetNames.includes("Classrooms")) {
      const classrooms = XLSX.utils.sheet_to_json(workbook.Sheets["Classrooms"]);
      for (let room of classrooms) {
        const { name, capacity, equipment_available } = room;
        await db.promise().query(
          "INSERT INTO classrooms (name, capacity, equipment_available) VALUES (?, ?, ?)",
          [name, capacity || 0, JSON.stringify(equipment_available || [])]
        );
      }
    }

    fs.unlinkSync(req.file.path);
    res.json({ message: "Excel data imported successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to import Excel" });
  }
};
