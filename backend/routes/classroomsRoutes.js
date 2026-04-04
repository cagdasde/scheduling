const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const classroomsController = require("../controllers/classroomsController");

// CRUD
router.get("/", classroomsController.getAllClassrooms);
router.post("/", classroomsController.addClassroom);
router.put("/:id", classroomsController.updateClassroom);
router.delete("/:id", classroomsController.deleteClassroom);

// Excel
router.post("/import", upload.single("file"), classroomsController.importFromExcel);
router.get("/export", classroomsController.exportToExcel);

module.exports = router;
