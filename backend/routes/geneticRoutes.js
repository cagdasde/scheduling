const express = require("express");
const router = express.Router();
const geneticController = require("../controllers/geneticController");

router.get("/generateSchedule", geneticController.generateSchedule);           // DB → GA
//router.post("/run-ga", geneticController.generateScheduleFromExcel);           // Excel → GA

module.exports = router;
