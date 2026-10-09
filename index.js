
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

function sendTimestamp(req, res) {
  const input = req.params.date;

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
}

app.get("/api", (req, res) => {
  req.params.date = undefined;
  sendTimestamp(req, res);
});

app.get("/api/", (req, res) => {
  req.params.date = undefined;
  sendTimestamp(req, res);
});

app.get("/api/:date", sendTimestamp);

module.exports = app;
