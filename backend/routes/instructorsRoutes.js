const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const instructorsController = require("../controllers/instructorsController");

// CRUD
router.post("/", instructorsController.addInstructor);
router.put("/:id", instructorsController.updateInstructor);
router.delete("/:id", instructorsController.deleteInstructor);
router.get("/", instructorsController.getAllInstructors);
// Excel
router.post("/import", upload.single("file"), instructorsController.importFromExcel);
router.get("/export", instructorsController.exportToExcel);

module.exports = router;




