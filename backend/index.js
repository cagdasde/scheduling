const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

const courseRoutes = require("./routes/coursesRoutes");
const classroomsRouter = require("./routes/classroomsRoutes");
const instructorsRouter = require("./routes/instructorsRoutes");
const geneticRoutes = require("./routes/geneticRoutes");
const importRouter = require("./routes/importRoute");
const excelRoutes = require("./routes/excelRoutes");
app.use(cors());
app.use(bodyParser.json());

app.use("/api/courses", courseRoutes);
app.use("/api/classrooms", classroomsRouter);
app.use("/api/instructors", instructorsRouter);
app.use("/api/import", importRouter);
app.use("/api/excel", excelRoutes);
app.use('/api', geneticRoutes);
app.listen(3000, () => console.log("Server running on port 3000"));
