
// Afficher le journal des exercices
app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({
        error: "Invalid user id"
      });
    }

    const user = await User.findById(_id).lean();

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    // Nombre total d'exercices avant les filtres
    const count = (user.log || []).length;

    let exercises = [...(user.log || [])];

    if (from) {
      const fromDate = new Date(`${from}T00:00:00.000Z`);

      if (Number.isNaN(fromDate.getTime())) {
        return res.status(400).json({
          error: "Invalid from date"
        });
      }

      exercises = exercises.filter(
        (exercise) => new Date(exercise.date) >= fromDate
      );
    }

    if (to) {
      const toDate = new Date(`${to}T23:59:59.999Z`);

      if (Number.isNaN(toDate.getTime())) {
        return res.status(400).json({
          error: "Invalid to date"
        });
      }

      exercises = exercises.filter(
        (exercise) => new Date(exercise.date) <= toDate
      );
    }

    if (limit !== undefined) {
      const limitNumber = Number(limit);

      if (
        !Number.isInteger(limitNumber) ||
        limitNumber < 0
      ) {
        return res.status(400).json({
          error: "Invalid limit"
        });
      }

      exercises = exercises.slice(0, limitNumber);
    }

    return res.json({
      username: user.username,
      count,
      _id: user._id.toString(),
      log: exercises.map((exercise) => ({
        description: String(exercise.description),
        duration: Number(exercise.duration),
        date: new Date(exercise.date).toDateString()
      }))
    });
  } catch (err) {
    console.error("Get exercise log error:", err.message);

    return res.status(500).json({
      error: "Could not retrieve exercise log"
    });
  }
});
