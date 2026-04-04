// ======================= GENETİK KONTROLLER ========================= //

const db = require("../db");

// GÜNLER & ZAMAN SLOTLARI
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const timeSlots = [
  "09:00-09:40", "10:00-10:40", "11:00-11:40", "11:40-12:20",
  "12:40-13:20", "13:40-14:20", "14:40-15:20", "15:40-16:20", "16:40-17:20"
];

const J = v => { try { return JSON.parse(v || "[]") } catch (e) { return [] } };

// ====================== ÇATIŞMA HESAPLAYICI ======================== //

function calculateConflicts(schedule, C, R, S) {
  const conflicts = {
    instructor: 0,
    room: 0,
    capacity: 0,
    student: 0
  };
  
  // Diziyi kontrol et
  if (!Array.isArray(schedule)) {
    console.error("HATA: schedule bir dizi değil:", schedule);
    return conflicts;
  }
  
  // Öğretim üyesi çakışmaları
  const instructorSlots = {};
  schedule.forEach(e => {
    const key = `${e.instructor_id}-${e.day}-${e.time}`;
    instructorSlots[key] = (instructorSlots[key] || 0) + 1;
  });
  
  Object.values(instructorSlots).forEach(count => {
    if (count > 1) conflicts.instructor += count - 1;
  });
  
  // Derslik çift rezervasyonu
  const roomSlots = {};
  schedule.forEach(e => {
    const key = `${e.room_id}-${e.day}-${e.time}`;
    roomSlots[key] = (roomSlots[key] || 0) + 1;
  });
  
  Object.values(roomSlots).forEach(count => {
    if (count > 1) conflicts.room += count - 1;
  });
  
  // Kapasite ihlalleri
  schedule.forEach(e => {
    const course = C.find(c => c.id === e.course_id);
    const room = R.find(r => r.id === e.room_id);
    
    if (course && room && course.required_capacity > room.capacity) {
      conflicts.capacity += 1;
    }
  });
  
  return conflicts;
}

// ============================ FITNESS =============================== //

function fitness(schedule, C, R, S) {
  if (!Array.isArray(schedule)) {
    console.error("HATA: fitness fonksiyonunda schedule dizi değil");
    return -10000;
  }
  
  let score = 1000;

  for (let e of schedule) {
    const c = C.find(x => x.id === e.course_id);
    const r = R.find(x => x.id === e.room_id);
    const i = S.find(x => x.id === e.instructor_id);

    if (!c || !r || !i) { score -= 200; continue; }

    // === SERT KISITLAR ===
    if (c.required_capacity > r.capacity) score -= 80;
    
    // Oda çakışmaları
    const roomConflictCount = schedule.filter(x => 
      x.day === e.day && x.time === e.time && x.room_id === e.room_id
    ).length;
    if (roomConflictCount > 1) score -= 140;
    
    // Öğretim üyesi çakışmaları
    const instructorConflictCount = schedule.filter(x => 
      x.day === e.day && x.time === e.time && x.instructor_id === e.instructor_id
    ).length;
    if (instructorConflictCount > 1) score -= 150;

    // === YUMUŞAK KISITLAR ===
    if (c.preferred_days && c.preferred_days.includes(e.day)) score += 8;
    if (c.preferred_time_slots && c.preferred_time_slots.includes(e.time)) score += 8;

    // Aynı ders ardışık saat
    const sameCourse = schedule.filter(x => x.course_id === c.id && x.day === e.day);
    sameCourse.forEach((p) => {
      if (Math.abs(timeIndex(e.time) - timeIndex(p.time)) === 1) score += 10;
    });

    // Aynı sınıfta devamlılık
    if (sameCourse.filter(x => x.room_id === e.room_id).length > 1) score += 6;

    // Hoca aralık cezası
    const inst = schedule.filter(x => x.instructor_id === i.id && x.day === e.day)
      .map(x => timeIndex(x.time)).sort((a, b) => a - b);
    for (let a = 1; a < inst.length; a++) {
      if (inst[a] - inst[a - 1] > 1) score -= 10;
    }

    // Öğle saat cezası
    if (e.time.includes("12:") || e.time.includes("13:")) score -= 5;

    // Hoca günlük max saat
    if (inst.length > 3) score -= 12;
  }
  return score;
}

function timeIndex(t) {
  return timeSlots.indexOf(t);
}

// ====================== BAŞLANGIÇ POPÜLASYONU ======================= //

function createPopulation(C, R, S, pop = 60) {
  let P = [];

  for (let p = 0; p < pop; p++) {
    let schedule = [];

    for (let c of C) {
      for (let h = 0; h < c.hours_per_week; h++) {
        // ÇAKIŞMALARA İZİN VER - Daha gerçekçi başlangıç popülasyonu
        const day = c.preferred_days && c.preferred_days.length ? 
          c.preferred_days[Math.floor(Math.random() * c.preferred_days.length)] :
          days[Math.floor(Math.random() * days.length)];

        const time = c.preferred_time_slots && c.preferred_time_slots.length ? 
          c.preferred_time_slots[Math.floor(Math.random() * c.preferred_time_slots.length)] :
          timeSlots[Math.floor(Math.random() * timeSlots.length)];

        const room = R[Math.floor(Math.random() * R.length)];
        
        // DİREKT EKLE - çakışmalara izin ver
        schedule.push({ 
          course_id: c.id, 
          room_id: room.id, 
          instructor_id: c.instructor_id, 
          day, 
          time 
        });
      }
    }
    P.push(schedule);
  }
  return P;
}

// =============== ÇATIŞMA ANALİZLİ GENETİK ALGORİTMA ================ //

function runGAWithConflicts(C, R, S, pop = 60, generations = 120) {
  // 1. BAŞLANGIÇ ÇATIŞMALARI
  console.log("🔄 BAŞLANGIÇ POPÜLASYONU OLUŞTURULUYOR...");
  let initialPopulation = createPopulation(C, R, S, pop);
  
  // Başlangıç popülasyonundan ortalama çatışmaları hesapla
  let totalInitialConflicts = { instructor: 0, room: 0, capacity: 0 };
  let sampleCount = Math.min(10, pop); // İlk 10 bireyi örnekle
  
  for (let i = 0; i < sampleCount; i++) {
    const conflicts = calculateConflicts(initialPopulation[i], C, R, S);
    totalInitialConflicts.instructor += conflicts.instructor;
    totalInitialConflicts.room += conflicts.room;
    totalInitialConflicts.capacity += conflicts.capacity;
  }
  
  // Ortalamayı hesapla
  const initialConflicts = {
    instructor: Math.round(totalInitialConflicts.instructor / sampleCount * 10) / 10,
    room: Math.round(totalInitialConflicts.room / sampleCount * 10) / 10,
    capacity: Math.round(totalInitialConflicts.capacity / sampleCount * 10) / 10
  };
  
  console.log("\n📊 BAŞLANGIÇ ÇATIŞMALARI (Ortalama):");
  console.log("- Öğretim Üyesi Çakışması:", initialConflicts.instructor);
  console.log("- Derslik Çift Rezervasyonu:", initialConflicts.room);
  console.log("- Kapasite İhlali:", initialConflicts.capacity);
  const totalInitial = initialConflicts.instructor + initialConflicts.room + initialConflicts.capacity;
  console.log("- Toplam Çatışma:", totalInitial.toFixed(1));
  
  // 2. GENETİK ALGORİTMA ÇALIŞTIR
  console.log("\n🔄 GENETİK ALGORİTMA ÇALIŞTIRILIYOR (" + generations + " nesil)...");
  let P = initialPopulation;
  
  let bestFitness = -Infinity;
  let bestSchedule = null;
  
  for (let g = 0; g < generations; g++) {
    if (g % 20 === 0) {
      console.log(`   Nesil ${g + 1}/${generations} işleniyor...`);
    }
    
    // Fitness'e göre sırala
    P.sort((a, b) => fitness(b, C, R, S) - fitness(a, C, R, S));
    
    // En iyi bireyi kaydet
    if (fitness(P[0], C, R, S) > bestFitness) {
      bestFitness = fitness(P[0], C, R, S);
      bestSchedule = P[0];
    }
    
    let elite = P.slice(0, Math.floor(pop * 0.25));
    let next = [...elite];
    
    // Yeni nesil oluştur
    while (next.length < pop) {
      let p1 = elite[Math.floor(Math.random() * elite.length)];
      let p2 = elite[Math.floor(Math.random() * elite.length)];
      let cut = Math.floor(Math.random() * Math.min(p1.length, p2.length));
      let child = [...p1.slice(0, cut), ...p2.slice(cut)];
      
      // Mutasyon
      if (Math.random() < 0.3) {
        const i = Math.floor(Math.random() * child.length);
        child[i] = { ...child[i] };
        child[i].day = days[Math.floor(Math.random() * days.length)];
        child[i].time = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        child[i].room_id = R[Math.floor(Math.random() * R.length)].id;
      }
      next.push(child);
    }
    P = next;
  }
  
  // En iyi sonucu bul
  P.sort((a, b) => fitness(b, C, R, S) - fitness(a, C, R, S));
  let finalSchedule = bestSchedule || P[0];
  
  // 3. BİTİŞ ÇATIŞMALARI
  let finalConflicts = calculateConflicts(finalSchedule, C, R, S);
  
  console.log("\n📊 BİTİŞ ÇATIŞMALARI:");
  console.log("- Öğretim Üyesi Çakışması:", finalConflicts.instructor);
  console.log("- Derslik Çift Rezervasyonu:", finalConflicts.room);
  console.log("- Kapasite İhlali:", finalConflicts.capacity);
  const totalFinal = finalConflicts.instructor + finalConflicts.room + finalConflicts.capacity;
  console.log("- Toplam Çatışma:", totalFinal);
  
  // 4. YÜZDE HESAPLA
  const reduction = totalInitial > 0 ? 
    ((totalInitial - totalFinal) / totalInitial * 100).toFixed(1) : "0.0";
  
  console.log("\n📈 PERFORMANS SONUÇLARI:");
  console.log("- Başlangıç Toplam Çatışma:", totalInitial.toFixed(1));
  console.log("- Bitiş Toplam Çatışma:", totalFinal);
  console.log("- Toplam Azalma Oranı:", reduction + "%");
  
  // 5. TEZ TABLOSU
  console.log("\n" + "=".repeat(60));
  console.log("📋 TEZ İÇİN TABLO VERİLERİ");
  console.log("=".repeat(60));
  
  const instructorReduction = initialConflicts.instructor > 0 ? 
    ((initialConflicts.instructor - finalConflicts.instructor) / initialConflicts.instructor * 100).toFixed(1) : "0.0";
  const roomReduction = initialConflicts.room > 0 ? 
    ((initialConflicts.room - finalConflicts.room) / initialConflicts.room * 100).toFixed(1) : "0.0";
  const capacityReduction = initialConflicts.capacity > 0 ? 
    ((initialConflicts.capacity - finalConflicts.capacity) / initialConflicts.capacity * 100).toFixed(1) : "0.0";
  
  console.log("| Conflict Type                | Initial  | Final   | Reduction  |");
  console.log("|------------------------------|----------|---------|------------|");
  console.log(`| Instructor Overlap          | ${initialConflicts.instructor.toFixed(1).padEnd(8)} | ${finalConflicts.instructor.toString().padEnd(7)} | ${instructorReduction}%`.padEnd(44) + "|");
  console.log(`| Room Double-Booking         | ${initialConflicts.room.toFixed(1).padEnd(8)} | ${finalConflicts.room.toString().padEnd(7)} | ${roomReduction}%`.padEnd(44) + "|");
  console.log(`| Capacity Violation          | ${initialConflicts.capacity.toFixed(1).padEnd(8)} | ${finalConflicts.capacity.toString().padEnd(7)} | ${capacityReduction}%`.padEnd(44) + "|");
  console.log("|------------------------------|----------|---------|------------|");
  console.log(`| TOTAL                       | ${totalInitial.toFixed(1).padEnd(8)} | ${totalFinal.toString().padEnd(7)} | ${reduction}%`.padEnd(44) + "|");
  console.log("=".repeat(60) + "\n");
  
  return {
    schedule: finalSchedule,
    initialConflicts,
    finalConflicts,
    reduction: parseFloat(reduction),
    fitnessScore: fitness(finalSchedule, C, R, S)
  };
}

// ======================== VERİTABANI → GA ÇIKTI ===================== //

async function generateSchedule(req, res) {
  console.log("🚀 DERS PROGRAMI OLUŞTURMA BAŞLATILDI");
  console.log("=".repeat(60));
  
  try {
    // Veritabanından verileri çek
    console.log("📦 VERİTABANINDAN VERİLER ÇEKİLİYOR...");
    
    const [courses] = await db.promise().query(`
      SELECT id, course_name, hours_per_week, instructor_id,
             preferred_days, preferred_time_slots, required_capacity
      FROM courses
    `);

    const [rooms] = await db.promise().query(`
      SELECT id, room_code AS name, capacity FROM classrooms
    `);

    const [instructors] = await db.promise().query(`
      SELECT id, name, max_weekly_hours FROM instructors
    `);

    console.log(`✅ Veriler alındı: ${courses.length} ders, ${rooms.length} sınıf, ${instructors.length} öğretim üyesi`);

    // JSON Parse
    courses.forEach(c => {
      c.preferred_days = J(c.preferred_days);
      c.preferred_time_slots = J(c.preferred_time_slots);
    });

    // Genetik algoritma çalıştır
    console.log("\n🧬 GENETİK ALGORİTMA BAŞLATILIYOR...");
    const result = runGAWithConflicts(courses, rooms, instructors);
    
    // Çıktıyı hazırla - DİZİ olduğundan emin ol
    const pretty = Array.isArray(result.schedule) ? result.schedule.map(e => ({
      course: courses.find(x => x.id === e.course_id)?.course_name || "Bilinmeyen",
      instructor: instructors.find(x => x.id === e.instructor_id)?.name || "Bilinmeyen",
      classroom: rooms.find(x => x.id === e.room_id)?.name || "Bilinmeyen",
      day: e.day || "Monday",
      time: e.time || "09:00-09:40"
    })) : [];

    console.log("✅ DERS PROGRAMI OLUŞTURULDU");
    console.log(`📊 Fitness Skoru: ${result.fitnessScore}`);
    console.log(`🎯 Toplam Çatışma Azalımı: ${result.reduction}%`);
    
    // Diziyi temizle ve döndür
    const cleanResponse = {
      success: true,
      timetable: pretty,
      conflicts: {
        initial: result.initialConflicts,
        final: result.finalConflicts,
        reduction: result.reduction
      },
      fitnessScore: result.fitnessScore,
      stats: {
        totalCourses: courses.length,
        totalRooms: rooms.length,
        totalInstructors: instructors.length,
        totalTimeSlots: pretty.length
      }
    };

    // Diziyi kontrol et
    if (!Array.isArray(cleanResponse.timetable)) {
      console.warn("⚠️  Uyarı: timetable dizi değil, diziye çevriliyor...");
      cleanResponse.timetable = [];
    }

    res.json(cleanResponse);

  } catch (err) {
    console.log("\n❌ HATA OLUŞTU:", err.message);
    console.error(err);
    res.status(500).json({
      success: false,
      error: "GA ERROR",
      message: err.message,
      timetable: [] // Boş dizi döndür
    });
  }
}

// ======================== EK FONKSİYONLAR ========================== //

function runGA(C, R, S, pop = 60, generations = 120) {
  let P = createPopulation(C, R, S, pop);

  for (let g = 0; g < generations; g++) {
    P.sort((a, b) => fitness(b, C, R, S) - fitness(a, C, R, S));
    let elite = P.slice(0, Math.floor(pop * 0.25));
    let next = [...elite];

    while (next.length < pop) {
      let p1 = elite[Math.floor(Math.random() * elite.length)];
      let p2 = elite[Math.floor(Math.random() * elite.length)];
      let cut = Math.floor(Math.random() * Math.min(p1.length, p2.length));
      let child = [...p1.slice(0, cut), ...p2.slice(cut)];
      
      if (Math.random() < 0.3) {
        const i = Math.floor(Math.random() * child.length);
        child[i] = { ...child[i] };
        child[i].day = days[Math.floor(Math.random() * days.length)];
        child[i].time = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        child[i].room_id = R[Math.floor(Math.random() * R.length)].id;
      }
      next.push(child);
    }
    P = next;
  }

  P.sort((a, b) => fitness(b, C, R, S) - fitness(a, C, R, S));
  return P[0];
}

// ========================== MODÜL ÇIKTISI ========================== //

module.exports = { 
  generateSchedule,
  runGA,
  runGAWithConflicts,
  calculateConflicts,
  fitness,
  createPopulation
};