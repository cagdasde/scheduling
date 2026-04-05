const db = require("../db");

// GÜNLER & SLOTLAR
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const timeSlots = [
  "09:00-09:40", "10:00-10:40", "11:00-11:40", "11:40-12:20",
  "12:40-13:20", "13:40-14:20", "14:40-15:20", "15:40-16:20", "16:40-17:20"
];

// JSON Güvenli Parse
const J = v => { 
  if (typeof v === 'object' && v !== null) return v;
  try { return JSON.parse(v || "[]") } catch (e) { return [] } 
};

// --- YARDIMCI FONKSİYONLAR (Çatışma, Fitness vb.) ---
function calculateConflicts(schedule, C, R) {
  const conflicts = { instructor: 0, room: 0, capacity: 0 };
  const instSlots = {};
  const roomSlots = {};

  schedule.forEach(e => {
    const iKey = `${e.instructor_id}-${e.day}-${e.time}`;
    const rKey = `${e.room_id}-${e.day}-${e.time}`;
    instSlots[iKey] = (instSlots[iKey] || 0) + 1;
    roomSlots[rKey] = (roomSlots[rKey] || 0) + 1;

    const course = C.find(c => c.id === e.course_id);
    const room = R.find(r => r.id === e.room_id);
    if (course && room && parseInt(course.required_capacity) > parseInt(room.capacity)) {
      conflicts.capacity += 1;
    }
  });

  Object.values(instSlots).forEach(v => { if (v > 1) conflicts.instructor += v - 1; });
  Object.values(roomSlots).forEach(v => { if (v > 1) conflicts.room += v - 1; });
  return conflicts;
}

function fitness(schedule, C, R) {
  const conf = calculateConflicts(schedule, C, R);
  return 2000 - (conf.instructor * 400 + conf.room * 400 + conf.capacity * 200);
}

// --- GA ANA DÖNGÜ ---
function runGAWithConflicts(C, R) {
  // Başlangıç Popülasyonu
  let P = [];
  for (let p = 0; p < 60; p++) {
    let sch = [];
    C.forEach(c => {
      for (let h = 0; h < (parseInt(c.hours_per_week) || 2); h++) {
        sch.push({
          course_id: c.id, instructor_id: c.instructor_id,
          room_id: R[Math.floor(Math.random() * R.length)].id,
          day: days[Math.floor(Math.random() * days.length)],
          time: timeSlots[Math.floor(Math.random() * timeSlots.length)]
        });
      }
    });
    P.push(sch);
  }

  const initialConflicts = calculateConflicts(P[0], C, R);

  // 100 Nesil Evrim
  for (let g = 0; g < 100; g++) {
    P.sort((a, b) => fitness(b, C, R) - fitness(a, C, R));
    let nextGen = P.slice(0, 12); // Elitizm
    while (nextGen.length < 60) {
      let p1 = P[Math.floor(Math.random() * 20)];
      let p2 = P[Math.floor(Math.random() * 20)];
      let cut = Math.floor(Math.random() * p1.length);
      let child = [...p1.slice(0, cut), ...p2.slice(cut)];
      if (Math.random() < 0.2) {
        let m = Math.floor(Math.random() * child.length);
        child[m].day = days[Math.floor(Math.random() * days.length)];
        child[m].time = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        child[m].room_id = R[Math.floor(Math.random() * R.length)].id;
      }
      nextGen.push(child);
    }
    P = nextGen;
  }

  const best = P[0];
  const finalConflicts = calculateConflicts(best, C, R);
  const totalInit = initialConflicts.instructor + initialConflicts.room + initialConflicts.capacity;
  const totalFinal = finalConflicts.instructor + finalConflicts.room + finalConflicts.capacity;
  const reduction = totalInit > 0 ? ((totalInit - totalFinal) / totalInit * 100).toFixed(1) : "0.0";

  return { schedule: best, initialConflicts, finalConflicts, reduction, fitnessScore: fitness(best, C, R) };
}

// --- API EXPORTS ---
exports.generateSchedule = async (req, res) => {
  try {
    // KRİTİK: db.promise() KALDIRILDI. PostgreSQL 'pg' doğrudan await destekler.
    const coursesRes = await db.query("SELECT * FROM courses");
    const roomsRes = await db.query("SELECT id, room_code AS name, capacity FROM classrooms");
    const instructorsRes = await db.query("SELECT * FROM instructors");

    // Veriler .rows dizisindedir
    const courses = coursesRes.rows.map(c => ({
      ...c,
      preferred_days: J(c.preferred_days),
      preferred_time_slots: J(c.preferred_time_slots)
    }));
    const rooms = roomsRes.rows;
    const instructors = instructorsRes.rows;

    if (!courses.length || !rooms.length) {
      return res.status(400).json({ success: false, message: "Veritabanı boş (Ders/Sınıf)" });
    }

    const result = runGAWithConflicts(courses, rooms);
    
    const timetable = result.schedule.map(e => ({
      course: courses.find(x => x.id === e.course_id)?.course_name || "Ders",
      instructor: instructors.find(x => x.id === e.instructor_id)?.name || "Eğitmen",
      classroom: rooms.find(x => x.id === e.room_id)?.name || "Sınıf",
      day: e.day,
      time: e.time
    }));

    res.json({
      success: true,
      timetable,
      conflicts: {
        initial: result.initialConflicts,
        final: result.finalConflicts,
        reduction: result.reduction + "%"
      },
      fitnessScore: result.fitnessScore
    });

  } catch (err) {
    console.error("❌ Hata:", err.message);
    res.status(500).json({ success: false, error: "GA ERROR", message: err.message });
  }
};