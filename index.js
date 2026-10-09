
const express = require("express");
const cors = require("cors");
<<<<<<< HEAD
const mongoose = require("mongoose");
=======
const dns = require("node:dns");
>>>>>>> 92e306c08d823698c4739b50732cd778a8a82085
const path = require("node:path");

const app = express();

app.use(cors());
<<<<<<< HEAD
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
=======
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

const urls = new Map();
let nextId = 1;
>>>>>>> 92e306c08d823698c4739b50732cd778a8a82085

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

<<<<<<< HEAD
// الاتصال بقاعدة البيانات
const mongoUri = process.env.MONGO_URI;

if (mongoUri) {
  mongoose.connect(mongoUri).catch((err) => {
    console.error("MongoDB connection error:", err.message);
=======
function validateUrl(value) {
  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    return Promise.resolve(false);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    dns.lookup(parsed.hostname, (error) => {
      resolve(!error);
    });
  });
}

app.post("/api/shorturl", async (req, res) => {
  const originalUrl = req.body.url;

  if (typeof originalUrl !== "string" || !originalUrl.trim()) {
    return res.json({ error: "invalid url" });
  }

  const cleanedUrl = originalUrl.trim();

  if (!(await validateUrl(cleanedUrl))) {
    return res.json({ error: "invalid url" });
  }

  const shortUrl = nextId++;

  urls.set(shortUrl, cleanedUrl);

  return res.json({
    original_url: cleanedUrl,
    short_url: shortUrl
>>>>>>> 92e306c08d823698c4739b50732cd778a8a82085
  });
}

// نموذج المستخدم والتمارين
const exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true }
});

<<<<<<< HEAD
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [exerciseSchema]
});

const User = mongoose.model("User", userSchema);

// التحقق من الاتصال قبل تنفيذ طلبات قاعدة البيانات
app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: "Database unavailable. Check MONGO_URI."
    });
  }
  next();
});

// 1. إنشاء مستخدم
app.post("/api/users", async (req, res) => {
  try {
    const username =
      typeof req.body.username === "string"
        ? req.body.username.trim()
        : "";

    if (!username) {
      return res.status(400).json({ error: "username is required" });
    }

    const user = await User.create({ username, log: [] });

    return res.json({
      username: user.username,
      _id: user._id.toString()
    });
  } catch (err) {
    return res.status(500).json({ error: "Could not create user" });
  }
});

// 2. عرض جميع المستخدمين
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
    return res.status(500).json({ error: "Could not retrieve users" });
  }
});

// 3. إضافة تمرين لمستخدم
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
      return res.status(400).json({ error: "Invalid duration" });
    }

    const exerciseDate =
      date === undefined || date === ""
        ? new Date()
        : new Date(date);

    if (Number.isNaN(exerciseDate.getTime())) {
      return res.status(400).json({ error: "Invalid date" });
    }

    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
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
      date: exercise.exerciseDate
        ? exercise.exerciseDate.toDateString()
        : exerciseDate.toDateString(),
      _id: user._id.toString()
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid user id" });
    }

    return res.status(500).json({ error: "Could not add exercise" });
  }
});

// 4. عرض سجل التمارين
app.get("/api/users/:_id/log", async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    const user = await User.findById(_id).lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let exercises = user.log || [];

    if (from) {
      const fromDate = new Date(from);

      if (Number.isNaN(fromDate.getTime())) {
        return res.status(400).json({ error: "Invalid from date" });
      }

      exercises = exercises.filter(
        (exercise) => new Date(exercise.date) >= fromDate
      );
    }

    if (to) {
      const toDate = new Date(to);

      if (Number.isNaN(toDate.getTime())) {
        return res.status(400).json({ error: "Invalid to date" });
      }

      exercises = exercises.filter(
        (exercise) => new Date(exercise.date) <= toDate
      );
    }

    if (limit !== undefined) {
      const limitNumber = Number(limit);

      if (!Number.isInteger(limitNumber) || limitNumber < 0) {
        return res.status(400).json({ error: "Invalid limit" });
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
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid user id" });
    }

    return res.status(500).json({ error: "Could not retrieve exercise log" });
  }
});

=======
app.get("/api/shorturl/:short_url", (req, res) => {
  const shortUrl = Number(req.params.short_url);

  if (!Number.isSafeInteger(shortUrl) || !urls.has(shortUrl)) {
    return res.status(404).json({ error: "Short URL not found" });
  }

  return res.redirect(302, urls.get(shortUrl));
});

>>>>>>> 92e306c08d823698c4739b50732cd778a8a82085
const port = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(port, () => {
<<<<<<< HEAD
    console.log(`Exercise Tracker running on port ${port}`);
=======
    console.log(`Server running on port ${port}`);
>>>>>>> 92e306c08d823698c4739b50732cd778a8a82085
  });
}

module.exports = app;
