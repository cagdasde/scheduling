const express = require("express");
const router = express.Router();
const excelController = require("../controllers/excelController");

router.post("/run-ga", excelController.generateScheduleFromExcel);

module.exports = router;
