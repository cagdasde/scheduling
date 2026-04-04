// backend/controllers/excelGAController.js
const { runGA } = require("../services/geneticAlgorithmService"); // Servis yolunu kontrol et

const timeSlots = [
  "09:00-09:40", "10:00-10:40", "11:00-11:40", "11:40-12:20",
  "12:40-13:20", "13:40-14:20", "14:40-15:20", "15:40-16:20", "16:40-17:20"
];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

exports.generateScheduleFromExcel = async (req, res) => {
  try {
    const excelData = req.body; 

    if (!Array.isArray(excelData) || excelData.length === 0) {
      return res.status(400).json({ error: "Excel verisi boş veya geçersiz format." });
    }

    // 1. Dersleri Hazırla (Veritabanı kolon isimleriyle eşleştiriyoruz: course_name)
    const courses = excelData.map((c, index) => ({
      id: index + 1, // Geçici ID
      course_name: c.course || c.name || "Adsız Ders",
      instructor_id: index + 1, // Excel'de ID olmayacağı için isme göre eşleme yapılacak
      instructor_name: c.instructor || "Atanmamış", 
      hours_per_week: parseInt(c.weekly_hours) || 2,
      required_capacity: parseInt(c.required_capacity) || 20,
      preferred_days: c.preferred_days || days,
      preferred_time_slots: c.preferred_time_slots || timeSlots
    }));

    // 2. Sınıfları Hazırla (Benzersiz sınıfları çekiyoruz)
    const classrooms = [...new Set(excelData.map(c => c.classroom))].map((name, index) => ({
      id: index + 1,
      room_code: name || `Derslik-${index + 1}`,
      capacity: 40 // Excel'de yoksa varsayılan
    }));

    // 3. Eğitmenleri Hazırla (Benzersiz eğitmenleri çekiyoruz)
    const instructors = [...new Set(excelData.map(c => c.instructor))].map((name, index) => ({
      id: index + 1,
      name: name || "Bilinmeyen Eğitmen"
    }));

    // 4. Algoritmayı Çalıştır
    // NOT: runGA içindeki veri isimlerinin (course_name, room_code) yukarıdakilerle aynı olması şart!
    const schedule = runGA(courses, classrooms, instructors);

    res.json({
      success: true,
      timetable: schedule,
      stats: {
        totalCourses: courses.length,
        totalClassrooms: classrooms.length
      }
    });

  } catch (err) {
    console.error("Excel GA Hatası:", err.message);
    res.status(500).json({ error: "Excel verisinden program üretilemedi.", details: err.message });
  }
};