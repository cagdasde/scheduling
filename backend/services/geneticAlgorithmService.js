// backend/services/geneticAlgorithmService.js

const timeSlots = [
    "09:00-09:40", "10:00-10:40", "11:00-11:40", "11:40-12:20",
    "12:40-13:20", "13:40-14:20", "14:40-15:20", "15:40-16:20", "16:40-17:20"
  ];
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  
  /**
   * Basit Genetic Algorithm (GA) benzeri ders programı üretici
   * (şimdilik random atama yapıyor, sonra geliştirilebilir)
   */
  function runGA(courses, classrooms, instructors) {
    let schedule = [];
  
    try {
      courses.forEach(course => {
        for (let i = 0; i < course.hours_per_week; i++) {
          const classroom = classrooms[Math.floor(Math.random() * classrooms.length)];
          const day = days[Math.floor(Math.random() * days.length)];
          const time = timeSlots[Math.floor(Math.random() * timeSlots.length)];
  
          schedule.push({
            course: course.name,
            instructor: course.instructor,
            classroom: classroom.name,
            day,
            time
          });
        }
      });
  
      return schedule;
    } catch (err) {
      console.error("GA error:", err);
      return [];
    }
  }
  
  module.exports = { runGA };
  