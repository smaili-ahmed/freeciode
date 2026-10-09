
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/:date?", (req, res) => {
  const input = req.params.date;

  const date =
    input === undefined
      ? new Date()
      : new Date(/^-?\d+$/.test(input) ? Number(input) : input);

  if (isNaN(date.getTime())) {
    return res.json({ error: "Invalid Date" });
  }

  res.json({
    unix: date.getTime(),
    utc: date.toUTCString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
