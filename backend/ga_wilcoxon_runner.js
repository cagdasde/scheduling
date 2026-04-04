// ga_wilcoxon_runner.js
// Paired experiment: GA vs TRUE Random baseline
// Exports numeric total conflicts for Wilcoxon Signed-Rank Test.
//
// Run:
//   node ga_wilcoxon_runner.js
//
// Outputs:
//   wilcoxon_data.csv
//   wilcoxon_data.json

const fs = require("fs");
const path = require("path");

// IMPORTANT: we use YOUR conflict calculator to keep metrics identical
const { runGAWithConflicts, calculateConflicts } = require("./controllers/geneticController");
const seed = require("./seed_200.json");

// ------------------------- CONFIG ------------------------- //
const N_RUNS = 15;       // >= 10 recommended
const GA_POP = 60;
const GA_GENS = 120;

// Must match your controller's days/timeSlots (same strings)
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const timeSlots = [
  "09:00-09:40", "10:00-10:40", "11:00-11:40", "11:40-12:20",
  "12:40-13:20", "13:40-14:20", "14:40-15:20", "15:40-16:20", "16:40-17:20"
];

// Reproducible RNG
const RNG_SEED_BASE = 12345;

// ---------------------- DATA LOADING ---------------------- //
const C = seed.courses || [];
const R = seed.classrooms || seed.rooms || [];
const S = seed.instructors || seed.staff || [];

// ---------------------- RNG (LCG) ------------------------- //
function makeLCG(seedNum) {
  let s = seedNum >>> 0;
  return function rand() {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function pickOne(arr, rand) {
  return arr[Math.floor(rand() * arr.length)];
}

// ---------------------- CONFLICT TOTAL -------------------- //
// Converts your {instructor, room, capacity, student} object to a single number.
function totalConflicts(confObj) {
  if (!confObj || typeof confObj !== "object") return Number(confObj) || 0;
  const a = Number(confObj.instructor || 0);
  const b = Number(confObj.room || 0);
  const c = Number(confObj.capacity || 0);
  const d = Number(confObj.student || 0);
  return a + b + c + d;
}

// ---------------------- TRUE RANDOM BASELINE -------------- //
// Pure random assignment (NO conflict avoidance), then conflict is computed with calculateConflicts().
function runTrueRandomBaseline(C, R, rand) {
  const schedule = [];

  for (const course of C) {
    const hours = Math.max(1, Number(course.hours_per_week || 1));

    for (let h = 0; h < hours; h++) {
      const day = pickOne(days, rand);
      const time = pickOne(timeSlots, rand);
      const room = pickOne(R, rand);

      schedule.push({
        course_id: course.id,
        room_id: room.id,
        instructor_id: course.instructor_id, // matches your GA encoding
        day,
        time // IMPORTANT: your calculateConflicts uses e.time (not time_slot)
      });
    }
  }

  const conflictsObj = calculateConflicts(schedule, C, R, []); // S not used in your calculateConflicts
  return { schedule, conflictsObj };
}

// ---------------------- CSV WRITER ------------------------- //
function toCSV(rows) {
  const header = [
    "run",
    "ga_total_conflicts",
    "random_total_conflicts",
    "ga_fitness",
    "ga_initial_total_conflicts",
    "ga_reduction_percent"
  ];
  const lines = [header.join(",")];

  for (const r of rows) {
    lines.push(
      [
        r.run,
        r.ga_total_conflicts,
        r.random_total_conflicts,
        r.ga_fitness,
        r.ga_initial_total_conflicts,
        r.ga_reduction_percent
      ].join(",")
    );
  }
  return lines.join("\n");
}

// ---------------------- MAIN ------------------------------ //
(async function main() {
  console.log("=== Wilcoxon experiment (paired): GA vs TRUE Random ===");
  console.log(`Runs: ${N_RUNS} | GA_POP=${GA_POP} | GA_GENS=${GA_GENS}`);

  const results = [];

  for (let i = 1; i <= N_RUNS; i++) {
    const rand = makeLCG(RNG_SEED_BASE + i);

    // 1) GA run (your existing code)
    const ga = await runGAWithConflicts(C, R, S, GA_POP, GA_GENS);

    // GA conflicts are objects -> total them
    const gaFinalTotal = totalConflicts(ga.finalConflicts);
    const gaInitTotal = totalConflicts(ga.initialConflicts);

    // 2) True random baseline (paired, same dataset)
    const rnd = runTrueRandomBaseline(C, R, rand);
    const rndTotal = totalConflicts(rnd.conflictsObj);

    results.push({
      run: i,
      ga_total_conflicts: gaFinalTotal,
      random_total_conflicts: rndTotal,
      ga_fitness: Number(ga.fitnessScore || 0),
      ga_initial_total_conflicts: gaInitTotal,
      ga_reduction_percent: Number(ga.reduction || 0)
    });

    console.log(`Run ${i}: GA total=${gaFinalTotal} | Random total=${rndTotal}`);
  }

  const outJson = path.join(__dirname, "wilcoxon_data.json");
  const outCsv = path.join(__dirname, "wilcoxon_data.csv");

  fs.writeFileSync(outJson, JSON.stringify(results, null, 2), "utf-8");
  fs.writeFileSync(outCsv, toCSV(results), "utf-8");

  console.log("\n✅ DONE");
  console.log("Created:", outJson);
  console.log("Created:", outCsv);
})();
