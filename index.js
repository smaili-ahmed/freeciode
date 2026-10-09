
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Route sans date : le paramètre est réellement absent
app.get("/api", (req, res) => {
  const now = new Date();

  return res.json({
    unix: now.getTime(),
    utc: now.toUTCString()
  });
});

// Route avec date optionnelle
app.get("/api/:date", (req, res) => {
  const input = req.params.date;

  const date = /^-?\d+$/.test(input)
    ? new Date(Number(input))
    : new Date(input);

  if (Number.isNaN(date.getTime())) {
    return res.json({ error: "Invalid Date" });
  }

  return res.json({
    unix: date.getTime(),
    utc: date.toUTCString()
  });
});

module.exports = app;
