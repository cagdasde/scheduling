// backend/services/geneticAlgorithmService.js

const timeSlots = [
  "09:00-09:40", "10:00-10:40", "11:00-11:40", "11:40-12:20",
  "12:40-13:20", "13:40-14:20", "14:40-15:20", "15:40-16:20", "16:40-17:20"
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/**
 * Gelişmiş Genetik Algoritma Servisi
 */
function runGA(courses, classrooms, instructors) {
  try {
    // Veri kontrolü
    if (!courses.length || !classrooms.length) {
      console.error("HATA: Ders veya Sınıf verisi eksik!");
      return [];
    }

    let schedule = [];

    // Şimdilik başlangıç popülasyonu oluşturma mantığı (Initial Population)
    courses.forEach(course => {
      // hours_per_week kadar slot ayır
      const hours = course.hours_per_week || 1;
      
      for (let i = 0; i < hours; i++) {
        // Rastgele seçimler
        const classroom = classrooms[Math.floor(Math.random() * classrooms.length)];
        const day = days[Math.floor(Math.random() * days.length)];
        const time = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        
        // Veritabanı kolon isimlerine dikkat (course_name, room_code vb.)
        schedule.push({
          course: course.course_name || "Bilinmeyen Ders",
          instructor: instructors.find(inst => inst.id === course.instructor_id)?.name || "Atanmamış",
          classroom: classroom.room_code || "Sınıf Yok",
          day: day,
          time: time
        });
      }
    });

    // TODO: Burada fitness skoruna göre en iyi kombinasyonu seçen döngü eklenecek
    // Şimdilik üretilen ilk geçerli schedule'ı dönüyoruz.
    
    return schedule;
  } catch (err) {
    console.error("Genetik Algoritma Hatası:", err.message);
    return [];
  }
}

module.exports = { runGA };