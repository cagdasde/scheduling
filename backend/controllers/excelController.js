const { runGA } = require("./geneticController"); // GA fonksiyonunu import et

const timeSlots = [
  '09:00-09:40','10:00-10:40','11:00-11:40','11:40-12:20',
  '12:40-13:20','13:40-14:20','14:40-15:20','15:40-16:20','16:40-17:20'
];
const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

exports.generateScheduleFromExcel = async (req,res)=>{
  try{
    const excelData = req.body; // [{course,classroom,instructor,...}]
    
    const courses = excelData.map(c=>({
      name: c.course,
      instructor: c.instructor,
      hours_per_week: c.weekly_hours || 2,
      required_capacity: c.required_capacity || 20,
      preferred_days: c.preferred_days || days,
      preferred_time_slots: c.preferred_time_slots || timeSlots,
      equipment_needed: c.equipment_needed || []
    }));

    const classrooms = [...new Set(excelData.map(c=>c.classroom))].map(name=>({
      name,
      capacity: 30,
      equipment_available: []
    }));

    const instructors = [...new Set(excelData.map(c=>c.instructor))].map(name=>({
      name,
      max_weekly_hours: 20
    }));

    const schedule = runGA(courses,classrooms,instructors);
    res.json(schedule);

  } catch(err){
    console.error("GA from Excel error:", err);
    res.status(500).json({error:"GA from Excel failed"});
  }
};
