
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

// Page d'accueil
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
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

// Connexion MongoDB réutilisable sur Vercel
let connectionPromise;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI is missing from environment variables"
    );
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

// Connexion requise pour toutes les routes API
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

// Ajouter un exercice à un utilisateur
app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;

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

    if (err.name === "CastError") {
      return res.status(400).json({
        error: "Invalid user id"
      });
    }

    return res.status(500).json({
      error: "Could not add exercise"
    });
  }
});

// Afficher le journal des exercices
app.get("/api/users/:_id/log", async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    const user = await User.findById(_id).lean();

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    let exercises = user.log || [];

    // Filtrer à partir d'une date
    if (from) {
      const fromDate = new Date(from);

      if (Number.isNaN(fromDate.getTime())) {
        return res.status(400).json({
          error: "Invalid from date"
        });
      }

      exercises = exercises.filter(
        (exercise) => new Date(exercise.date) >= fromDate
      );
    }

    // Filtrer jusqu'à une date
    if (to) {
      const toDate = new Date(to);

      if (Number.isNaN(toDate.getTime())) {
        return res.status(400).json({
          error: "Invalid to date"
        });
      }

      exercises = exercises.filter(
        (exercise) => new Date(exercise.date) <= toDate
      );
    }

    // Limiter le nombre d'exercices
    if (limit !== undefined) {
      const limitNumber = Number(limit);

      if (!Number.isInteger(limitNumber) || limitNumber < 0) {
        return res.status(400).json({
          error: "Invalid limit"
        });
      }

      exercises = exercises.slice(0, limitNumber);
    }

    return res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id.toString(),
      log: exercises.map((exercise) => ({
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      }))
    });
  } catch (err) {
    console.error("Get exercise log error:", err.message);

    if (err.name === "CastError") {
      return res.status(400).json({
        error: "Invalid user id"
      });
    }

    return res.status(500).json({
      error: "Could not retrieve exercise log"
    });
  }
});

// Démarrage local
const port = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Exercise Tracker running on port ${port}`);
  });
}

// Export pour Vercel
module.exports = app;
