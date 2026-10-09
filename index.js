
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("node:path");

const app = express();
const upload = multer({
  storage: multer.memoryStorage()
});

app.use(cors());
app.use("/public", express.static(path.join(__dirname, "public")));

// Page d'accueil
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Upload et analyse des métadonnées
app.post("/api/fileanalyse", upload.single("upfile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "No file uploaded"
    });
  }

  return res.json({
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size
  });
});

// Gestion des erreurs d'upload
app.use((err, req, res, next) => {
  console.error("Upload error:", err.message);

  return res.status(400).json({
    error: "File upload failed"
  });
});

const port = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(port, () => {
    console.log(`File Metadata Microservice running on port ${port}`);
  });
}

module.exports = app;
