const express = require("express");
const cors = require("cors");
const app = express();

const courseRoutes = require("./routes/courses");
const classroomsRouter = require("./routes/classrooms");
const geneticRouter = require('./routes/genetic');

app.use(cors());
app.use(express.json()); // body-parser yerine modern kullanım

// API endpointleri
app.use("/api/courses", courseRoutes);
app.use("/api/classrooms", classroomsRouter);
app.use("/api/genetic", geneticRouter);

// TEST endpoint (çok faydalı)
app.get("/", (req, res) => {
  res.send("API çalışıyor 🚀");
});

// PORT ayarı (Render için zorunlu)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});