const db = require("../db");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const exportsDir = path.join(__dirname, "../exports");
if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

// Yardımcı: JSON parse güvenli
function safelyParseJSON(value) {
  if (typeof value === 'object' && value !== null) return value;
  try {
    return JSON.parse(value || "[]");
  } catch (e) {
    return [];
  }
}

// Validasyon
function validateClassroom({ room_code, capacity }) {
  const errors = [];
  if (!room_code || !room_code.trim()) errors.push("Sınıf kodu/adı gerekli");
  if (capacity == null || capacity < 0) errors.push("Kapasite pozitif bir sayı olmalı");
  return errors;
}

// 1️⃣ Tüm sınıflar
exports.getAllClassrooms = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM classrooms ORDER BY id ASC");
    const classrooms = result.rows.map((row) => ({
      ...row,
      name: row.room_code, // Frontend uyumluluğu için
      equipment_available: safelyParseJSON(row.equipment_available),
    }));
    res.json(classrooms);
  } catch (err) {
    console.error("Sınıfları getirme hatası:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// 2️⃣ Yeni sınıf ekle
exports.addClassroom = async (req, res) => {
  const { room_code, capacity, equipment_available } = req.body;
  const errors = validateClassroom({ room_code, capacity });
  if (errors.length) return res.status(400).json({ errors });

  try {
    const query = "INSERT INTO classrooms (room_code, capacity, equipment_available) VALUES ($1, $2, $3) RETURNING *";
    const values = [
      room_code.trim(), 
      capacity, 
      JSON.stringify(equipment_available || [])
    ];

    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Sınıf ekleme hatası:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// 3️⃣ Sınıf güncelle
exports.updateClassroom = async (req, res) => {
  const { id } = req.params;
  const { room_code, capacity, equipment_available } = req.body;
  const errors = validateClassroom({ room_code, capacity });
  if (errors.length) return res.status(400).json({ errors });

  try {
    const query = "UPDATE classrooms SET room_code = $1, capacity = $2, equipment_available = $3 WHERE id = $4";
    await db.query(query, [
      room_code.trim(), 
      capacity, 
      JSON.stringify(equipment_available || []), 
      id
    ]);
    res.json({ message: "Classroom updated" });
  } catch (err) {
    console.error("Güncelleme hatası:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// 4️⃣ Sınıf sil
exports.deleteClassroom = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM classrooms WHERE id = $1", [id]);
    res.json({ message: "Classroom deleted" });
  } catch (err) {
    console.error("Silme hatası:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// 5️⃣ Excel Import (Eksik olan ve Nodemon hatasına yol açabilecek kısım)
exports.importFromExcel = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Excel dosyası gerekli" });

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    for (const row of data) {
      const room_code = row.room_code || row.name || row.SınıfAdı;
      const capacity = row.capacity || row.Kapasite || 0;
      
      if (!room_code) continue;

      await db.query(
        "INSERT INTO classrooms (room_code, capacity, equipment_available) VALUES ($1, $2, $3)",
        [room_code.toString().trim(), capacity, JSON.stringify([])]
      );
    }

    fs.unlinkSync(req.file.path);
    res.json({ message: "Excel verileri başarıyla içe aktarıldı." });
  } catch (err) {
    console.error("Excel Import Hatası:", err.message);
    res.status(500).json({ error: "Excel işlenemedi" });
  }
};

// 6️⃣ Excel export
exports.exportToExcel = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM classrooms");
    const formatted = result.rows.map((row) => ({
      ...row,
      equipment_available: JSON.stringify(safelyParseJSON(row.equipment_available)),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Classrooms");

    const filePath = path.join(exportsDir, "classrooms.xlsx");
    XLSX.writeFile(workbook, filePath);

    res.download(filePath, "classrooms.xlsx", (err) => {
      if (err) console.error(err);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
  } catch (err) {
    console.error("Export hatası:", err.message);
    res.status(500).json({ error: "Excel export error" });
  }
};