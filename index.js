
const express = require("express");
const cors = require("cors");
const dns = require("node:dns");
const path = require("node:path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

const urls = new Map();
let nextId = 1;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

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
  });
});

app.get("/api/shorturl/:short_url", (req, res) => {
  const shortUrl = Number(req.params.short_url);

  if (!Number.isSafeInteger(shortUrl) || !urls.has(shortUrl)) {
    return res.status(404).json({ error: "Short URL not found" });
  }

  return res.redirect(302, urls.get(shortUrl));
});

const port = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;
