// ======================= GENETİK KONTROLLER (PSQL UYUMLU) ========================= //

const db = require("../db");

// GÜNLER & ZAMAN SLOTLARI
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const timeSlots = [
  "09:00-09:40", "10:00-10:40", "11:00-11:40", "11:40-12:20",
  "12:40-13:20", "13:40-14:20", "14:40-15:20", "15:40-16:20", "16:40-17:20"
];

const J = v => { 
  if (typeof v === 'object' && v !== null) return v;
  try { return JSON.parse(v || "[]") } catch (e) { return [] } 
};

function timeIndex(t) {
  return timeSlots.indexOf(t);
}

// ====================== ÇATIŞMA HESAPLAYICI ======================== //

function calculateConflicts(schedule, C, R) {
  const conflicts = { instructor: 0, room: 0, capacity: 0 };
  
  if (!Array.isArray(schedule)) return conflicts;
  
  const instructorSlots = {};
  const roomSlots = {};
  
  schedule.forEach(e => {
    const iKey = `${e.instructor_id}-${e.day}-${e.time}`;
    const rKey = `${e.room_id}-${e.day}-${e.time}`;
    
    instructorSlots[iKey] = (instructorSlots[iKey] || 0) + 1;
    roomSlots[rKey] = (roomSlots[rKey] || 0) + 1;
    
    const course = C.find(c => c.id === e.course_id);
    const room = R.find(r => r.id === e.room_id);
    
    if (course && room && parseInt(course.required_capacity) > parseInt(room.capacity)) {
      conflicts.capacity += 1;
    }
  });
  
  Object.values(instructorSlots).forEach(v => { if (v > 1) conflicts.instructor += v - 1; });
  Object.values(roomSlots).forEach(v => { if (v > 1) conflicts.room += v - 1; });
  
  return conflicts;
}

// ============================ FITNESS =============================== //

function fitness(schedule, C, R) {
  if (!Array.isArray(schedule)) return -10000;
  
  let score = 2000; // Başlangıç skoru
  const conf = calculateConflicts(schedule, C, R);

  // Sert Kısıt Cezaları (Ağırlıklı)
  score -= (conf.instructor * 400);
  score -= (conf.room * 400);
  score -= (conf.capacity * 200);

  // Yumuşak Kısıtlar ve Verimlilik
  schedule.forEach(e => {
    const c = C.find(x => x.id === e.course_id);
    if (!c) return;

    // Tercih edilen zaman uyumu
    if (c.preferred_days?.includes(e.day)) score += 20;
    if (c.preferred_time_slots?.includes(e.time)) score += 20;

    // Öğle arası cezası (12:00 ve 13:00 slotları)
    if (e.time.startsWith("12:") || e.time.startsWith("13:")) score -= 10;
  });

  return score;
}

// ====================== BAŞLANGIÇ POPÜLASYONU ======================= //

function createPopulation(C, R, popSize = 60) {
  let P = [];
  for (let p = 0; p < popSize; p++) {
    let schedule = [];
    C.forEach(c => {
      const hours = parseInt(c.hours_per_week) || 2;
      for (let h = 0; h < hours; h++) {
        schedule.push({ 
          course_id: c.id, 
          room_id: R[Math.floor(Math.random() * R.length)].id, 
          instructor_id: c.instructor_id, 
          day: days[Math.floor(Math.random() * days.length)], 
          time: timeSlots[Math.floor(Math.random() * timeSlots.length)] 
        });
      }
    });
    P.push(schedule);
  }
  return P;
}

// =============== ÇATIŞMA ANALİZLİ GENETİK ALGORİTMA ================ //

function runGAWithConflicts(C, R, popSize = 60, generations = 120) {
  let P = createPopulation(C, R, popSize);
  const initialConflicts = calculateConflicts(P[0], C, R);
  
  let bestSchedule = null;
  let maxFitness = -Infinity;

  for (let g = 0; g < generations; g++) {
    P.sort((a, b) => fitness(b, C, R) - fitness(a, C, R));
    
    if (fitness(P[0], C, R) > maxFitness) {
      maxFitness = fitness(P[0], C, R);
      bestSchedule = JSON.parse(JSON.stringify(P[0]));
    }

    let nextGen = P.slice(0, Math.floor(popSize * 0.2)); // Elitizm %20

    while (nextGen.length < popSize) {
      let p1 = P[Math.floor(Math.random() * (popSize / 2))];
      let p2 = P[Math.floor(Math.random() * (popSize / 2))];
      let cut = Math.floor(Math.random() * p1.length);
      let child = [...p1.slice(0, cut), ...p2.slice(cut)];

      // Mutasyon %15
      if (Math.random() < 0.15) {
        const i = Math.floor(Math.random() * child.length);
        child[i].day = days[Math.floor(Math.random() * days.length)];
        child[i].time = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        child[i].room_id = R[Math.floor(Math.random() * R.length)].id;
      }
      nextGen.push(child);
    }
    P = nextGen;
  }

  const finalSchedule = bestSchedule || P[0];
  const finalConflicts = calculateConflicts(finalSchedule, C, R);
  
  const reduction = (( (initialConflicts.instructor + initialConflicts.room + initialConflicts.capacity) - 
                       (finalConflicts.instructor + finalConflicts.room + finalConflicts.capacity) ) / 
                       (initialConflicts.instructor + initialConflicts.room + initialConflicts.capacity + 0.1) * 100).toFixed(1);

  return {
    schedule: finalSchedule,
    initialConflicts,
    finalConflicts,
    reduction: parseFloat(reduction),
    fitnessScore: maxFitness
  };
}

// ======================== VERİTABANI → GA ÇIKTI ===================== //

async function generateSchedule(req, res) {
  try {
    console.log("📦 PSQL Verileri Çekiliyor...");
    
    // PostgreSQL'de .promise() kullanılmaz, sonuçlar .rows içindedir
    const coursesRes = await db.query("SELECT * FROM courses");
    const roomsRes = await db.query("SELECT id, room_code AS name, capacity FROM classrooms");
    const instructorsRes = await db.query("SELECT * FROM instructors");

    const courses = coursesRes.rows;
    const rooms = roomsRes.rows;
    const instructors = instructorsRes.rows;

    courses.forEach(c => {
      c.preferred_days = J(c.preferred_days);
      c.preferred_time_slots = J(c.preferred_time_slots);
    });

    console.log("🧬 GA Başlatılıyor...");
    const result = runGAWithConflicts(courses, rooms, 60, 150);
    
    const timetable = result.schedule.map(e => ({
      course: courses.find(x => x.id === e.course_id)?.course_name || "Bilinmeyen",
      instructor: instructors.find(x => x.id === e.instructor_id)?.name || "Bilinmeyen",
      classroom: rooms.find(x => x.id === e.room_id)?.name || "Bilinmeyen",
      day: e.day,
      time: e.time
    }));

    res.json({
      success: true,
      timetable,
      conflicts: result,
      fitnessScore: result.fitnessScore,
      reduction: result.reduction
    });

  } catch (err) {
    console.error("❌ HATA:", err.message);
    res.status(500).json({ success: false, message: err.message, timetable: [] });
  }
}

module.exports = { 
  generateSchedule,
  runGAWithConflicts,
  calculateConflicts,
  fitness,
  createPopulation
};