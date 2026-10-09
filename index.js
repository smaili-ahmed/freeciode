const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static("public"));

// Page d'accueil
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// API Timestamp : gère /api, /api/ et /api/:date
app.get(/^\/api(?:\/(.*))?\/?$/, (req, res) => {
  const input = req.params[0];

  let date;

  // Si la date est absente ou vide, retourner la date actuelle
  if (input === undefined || input === "") {
    date = new Date();
  } else if (/^-?\d+$/.test(input)) {
    // Les nombres sont interprétés comme des timestamps Unix en millisecondes
    date = new Date(Number(input));
  } else {
    // Les autres valeurs sont analysées comme des chaînes de date
    date = new Date(input);
  }

  // Vérifier si la date est invalide
  if (Number.isNaN(date.getTime())) {
    return res.json({ error: "Invalid Date" });
  }

  // Retourner le timestamp Unix et la date UTC
  return res.json({
    unix: date.getTime(),
    utc: date.toUTCString()
  });
});

// Export pour Vercel
module.exports = app;
