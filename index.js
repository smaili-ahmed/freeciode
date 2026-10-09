const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static("public"));

// Page d'accueil
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Timestamp Microservice
// Accepte /api, /api/ et /api/:date
app.get("/api/:date?", (req, res) => {
  const input = req.params.date;
  let date;

  // Aucun paramètre de date : renvoyer la date actuelle
  if (input === undefined || input === "") {
    date = new Date();
  } 
  // Timestamp Unix en millisecondes
  else if (/^-?\d+$/.test(input)) {
    date = new Date(Number(input));
  } 
  // Chaîne de date
  else {
    date = new Date(input);
  }

  // Date invalide
  if (Number.isNaN(date.getTime())) {
    return res.json({ error: "Invalid Date" });
  }

  // Réponse JSON
  return res.json({
    unix: date.getTime(),
    utc: date.toUTCString()
  });
});

// Export requis pour Vercel
module.exports = app;
