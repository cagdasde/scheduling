const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require('dotenv').config(); // .env dosyasını okumak için şart

const app = express();

// Rota Dosyaları
const courseRoutes = require("./routes/coursesRoutes");
const classroomsRouter = require("./routes/classroomsRoutes");
const instructorsRouter = require("./routes/instructorsRoutes");
const geneticRoutes = require("./routes/geneticRoutes");
const importRouter = require("./routes/importRoute");
const excelRoutes = require("./routes/excelRoutes");

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Gelen istekleri loglayalım (Hata bulmak için çok işe yarar)
app.use((req, res, next) => {
  console.log(`${req.method} isteği geldi: ${req.url}`);
  next();
});

// API Rotaları
app.use("/api/courses", courseRoutes);
app.use("/api/classrooms", classroomsRouter);
app.use("/api/instructors", instructorsRouter);
app.use("/api/import", importRouter);
app.use("/api/excel", excelRoutes);

// Genetik rotasını daha spesifik yapalım
// Artık URL: https://...onrender.com/api/genetic/generateSchedule olacak
app.use('/api/genetic', geneticRoutes); 

// Ana dizin testi (Sunucu ayakta mı kontrolü için)
app.get("/", (req, res) => {
  res.send("Scheduling API is running...");
});

// Render için PORT ayarı
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor...`);
});