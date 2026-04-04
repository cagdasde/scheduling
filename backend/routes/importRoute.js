const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const importController = require("../controllers/importController");

router.post("/excel", upload.single("file"), importController.importFromExcel);

module.exports = router;
