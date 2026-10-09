
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("node:path");

const app = express();

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Page d'accueil : ne provoque pas de crash si le fichier manque
app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "views", "index.html"),
    (err) => {
      if (err && !res.headersSent) {
        console.error("Homepage error:", err.message);
        res.status(200).send("Exercise Tracker API is running.");
      }
    }
  );
});

// Schéma des exercices
const exerciseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
});

// Schéma des utilisateurs
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  log: [exerciseSchema]
});

const User = mongoose.model("User", userSchema);

// Connexion MongoDB réutilisable
let connectionPromise;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from environment variables");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000
      })
      .catch((err) => {
        connectionPromise = null;
        throw err;
      });
  }

  await connectionPromise;
}

// Vérification de la connexion pour toutes les routes API
app.use("/api", async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error("MongoDB connection error:", err.message);

    return res.status(503).json({
      error: "Database unavailable. Check Vercel runtime logs."
    });
  }
});

// Créer un utilisateur
app.post("/api/users", async (req, res) => {
  try {
    const username =
      typeof req.body.username === "string"
        ? req.body.username.trim()
        : "";

    if (!username) {
      return res.status(400).json({
        error: "username is required"
      });
    }

    const user = await User.create({
      username,
      log: []
    });

    return res.json({
      username: user.username,
      _id: user._id.toString()
    });
  } catch (err) {
    console.error("Create user error:", err.message);

    return res.status(500).json({
      error: "Could not create user"
    });
  }
});

// Afficher tous les utilisateurs
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "username").lean();

    return res.json(
      users.map((user) => ({
        username: user.username,
        _id: user._id.toString()
      }))
    );
  } catch (err) {
    console.error("Get users error:", err.message);

    return res.status(500).json({
      error: "Could not retrieve users"
    });
  }
});

// Ajouter un exercice
app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({
        error: "Invalid user id"
      });
    }

    if (
      typeof description !== "string" ||
      !description.trim() ||
      duration === undefined ||
      duration === ""
    ) {
      return res.status(400).json({
        error: "description and duration are required"
      });
    }

    const durationNumber = Number(duration);

    if (!Number.isFinite(durationNumber) || durationNumber <= 0) {
      return res.status(400).json({
        error: "Invalid duration"
      });
    }

    const exerciseDate =
      date === undefined || date === ""
        ? new Date()
        : new Date(date);

    if (Number.isNaN(exerciseDate.getTime())) {
      return res.status(400).json({
        error: "Invalid date"
      });
    }

    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    const exercise = {
      description: description.trim(),
      duration: durationNumber,
      date: exerciseDate
    };

    user.log.push(exercise);
    await user.save();

    return res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exerciseDate.toDateString(),
      _id: user._id.toString()
    });
  } catch (err) {
    console.error("Add exercise error:", err.message);

    return res.status(500).json({
      error: "Could not add exercise"
    });
  }
});

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

    // Nombre total d'exercices, avant les filtres
    const count = (user.log || []).length;

    let exercises = [...(user.log || [])];

    if (from) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) {
        return res.status(400).json({
          error: "Invalid from date"
        });
      }

      const fromDate = new Date(`${from}T00:00:00.000Z`);

      if (
        Number.isNaN(fromDate.getTime()) ||
        fromDate.toISOString().slice(0, 10) !== from
      ) {
        return res.status(400).json({
          error: "Invalid from date"
        });
      }

      exercises = exercises.filter(
        (exercise) => new Date(exercise.date) >= fromDate
      );
    }

    if (to) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        return res.status(400).json({
          error: "Invalid to date"
        });
      }

      const toDate = new Date(`${to}T23:59:59.999Z`);

      if (
        Number.isNaN(toDate.getTime()) ||
        toDate.toISOString().slice(0, 10) !== to
      ) {
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

      if (!/^\d+$/.test(limit) || !Number.isSafeInteger(limitNumber)) {
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
        description: exercise.description,
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

// Démarrage local uniquement
const port = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Exercise Tracker running on port ${port}`);
  });
}

// Export pour Vercel
module.exports = app;
