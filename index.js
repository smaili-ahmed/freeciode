const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/whoami", (req, res) => {
  const ipaddress =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "";

  const language = req.headers["accept-language"] || "";

  const software = req.headers["user-agent"] || "";

  res.json({
    ipaddress,
    language,
    software
  });
});

module.exports = app;
