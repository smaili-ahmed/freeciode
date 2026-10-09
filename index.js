
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static("public"));

// Page d'accueil
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// API Timestamp : avec ou sans date
app.get(/^\/api(?:\/(.*))?\/?$/, (req, res) => {
  const input = req.params[0];

  let date;

  if (input === undefined || input === "") {
    date = new Date();
  } else if (/^-?\d+$/.test(input)) {
    date = new Date(Number(input));
  } else {
    date = new Date(input);
  }

  if (Number.isNaN(date.getTime())) {
    return res.json({ error: "Invalid Date" });
  }

  return res.json({
    unix: date.getTime(),
    utc: date.toUTCString()
  });
});

// Export pour Vercel
module.exports = app;
