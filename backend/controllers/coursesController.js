const db = require("../db");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const exportsDir = path.join(__dirname, "../exports");
if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

// Yardımcı: Güvenli JSON Parse
const J = v => { try { return JSON.parse(v || "[]") } catch (e) { return [] } };

// 1️⃣ Tüm Dersleri Getir
exports.getAllCourses = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, i.name as instructor_name 
      FROM courses c
      LEFT JOIN instructors i ON c.instructor_id = i.id
      ORDER BY c.id ASC
    `);
    
    // JSON alanları parse et
    const courses = result.rows.map(row => ({
      ...row,
      preferred_days: J(row.preferred_days),
      preferred_time_slots: J(row.preferred_time_slots)
    }));
    
    res.json(courses);
  } catch (err) {
    console.error("Ders listesi hatası:", err.message);
    res.status(500).json({ error: "Dersler getirilemedi" });
  }
};

// 2️⃣ Yeni Ders Ekle
exports.addCourse = async (req, res) => {
  const { 
    course_name, instructor_id, hours_per_week, 
    required_capacity, preferred_days, preferred_time_slots 
  } = req.body;

  try {
    const query = `
      INSERT INTO courses 
      (course_name, instructor_id, hours_per_week, required_capacity, preferred_days, preferred_time_slots)
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`;

    const values = [
      course_name.trim(),
      instructor_id,
      hours_per_week || 2,
      required_capacity || 0,
      JSON.stringify(preferred_days || []),
      JSON.stringify(preferred_time_slots || [])
    ];

    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Ders ekleme hatası:", err.message);
    res.status(500).json({ error: "Ders eklenemedi" });
  }
};

// 3️⃣ Ders Güncelle
exports.updateCourse = async (req, res) => {
  const { id } = req.params;
  const { 
    course_name, instructor_id, hours_per_week, 
    required_capacity, preferred_days, preferred_time_slots 
  } = req.body;

  try {
    const query = `
      UPDATE courses 
      SET course_name=$1, instructor_id=$2, hours_per_week=$3, 
          required_capacity=$4, preferred_days=$5, preferred_time_slots=$6
      WHERE id=$7`;

    const values = [
      course_name.trim(),
      instructor_id,
      hours_per_week,
      required_capacity,
      JSON.stringify(preferred_days || []),
      JSON.stringify(preferred_time_slots || []),
      id
    ];

    await db.query(query, values);
    res.json({ message: "Ders başarıyla güncellendi" });
  } catch (err) {
    console.error("Güncelleme hatası:", err.message);
    res.status(500).json({ error: "Güncelleme başarısız" });
  }
};

// 4️⃣ Ders Sil
exports.deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM courses WHERE id = $1", [id]);
    res.json({ message: "Ders silindi" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Silme işlemi başarısız" });
  }
};

// 5️⃣ Excel'den İçe Aktar (Import)
exports.importFromExcel = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Excel dosyası bulunamadı" });

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    for (const row of data) {
      // Excel başlıkları: course_name, instructor_id, hours_per_week
      await db.query(
        `INSERT INTO courses (course_name, instructor_id, hours_per_week, required_capacity) 
         VALUES ($1, $2, $3, $4)`,
        [
          row.course_name || row.DersAdı,
          row.instructor_id || null,
          row.hours_per_week || 2,
          row.required_capacity || 0
        ]
      );
    }

    fs.unlinkSync(req.file.path); // İşlem bitince dosyayı sil
    res.json({ message: `${data.length} adet ders başarıyla eklendi.` });
  } catch (err) {
    console.error("Excel Import Hatası:", err.message);
    res.status(500).json({ error: "Excel verileri işlenemedi" });
  }
};

// 6️⃣ Excel'e Aktar (Export)
exports.exportToExcel = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM courses");
    const worksheet = XLSX.utils.json_to_sheet(result.rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ders Listesi");

    const filePath = path.join(exportsDir, "dersler_listesi.xlsx");
    XLSX.writeFile(workbook, filePath);

    res.download(filePath, "dersler.xlsx", () => fs.unlinkSync(filePath));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Excel oluşturulamadı" });
  }
};