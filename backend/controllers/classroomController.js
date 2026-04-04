exports.addClassroom = async (req, res) => {
  const { name, capacity, equipment } = req.body;

  const equipmentStr = equipment ? JSON.stringify(equipment) : null;

  const query = `
    INSERT INTO classrooms (name, capacity, equipment)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  try {
    const result = await db.query(query, [name, capacity, equipmentStr]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Sınıf eklenirken hata:", err);
    res.status(500).send("Sunucu hatasıııı");
  }
};