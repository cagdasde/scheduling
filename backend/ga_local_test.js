// ga_local_test.js
const { runGAWithConflicts } = require("./controllers/geneticController"); 
const seed = require("./seed_200.json");

const C = seed.courses;
const R = seed.classrooms;
const S = seed.instructors;


const result = runGAWithConflicts(C, R, S, 60, 120);

console.log("\n✅ TEST FINISHED");
console.log("Fitness:", result.fitnessScore);
console.log("Reduction %:", result.reduction);
console.log("Initial:", result.initialConflicts);
console.log("Final:", result.finalConflicts);
console.log("Schedule length:", result.schedule.length);
