const express = require("express");

const { nanoid } = require("nanoid");
const jwt = require("jsonwebtoken");
const moment = require("moment");

const URL = require("../models/urlSchema");
const Click = require("../models/clickSchema");
const JWT_SECRET = process.env.JWT_SECRET;
const router = express.Router();


// authorization
function authorize(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "Authorization token is required" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.userId = decoded.userId;
    next();
  });
}


router.post("/generate-token", (req, res) => {
  const userId = "preauthorized-user";
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});
router.post("/shorten", authorize, async (req, res) => {
  const { url, validity_period, custom_shortcode } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const expiryTime = validity_period
    ? moment().add(validity_period, "minutes").toDate()
    : moment().add(30, "minutes").toDate();

  try {
    // Check if URL already exists and not expired
    const existing = await URL.findOne({ url });
    if (existing) {
      if (moment().isAfter(existing.validity)) {
        return res.status(410).json({ error: "Shortened URL expired. Please shorten again." });
      }
      return res.json({ shortened_url: `${req.protocol}://${req.get('host')}/${existing.shortcode}`, validity: existing.validity });
    }

    // Generate unique shortcode
    let shortcode = custom_shortcode || nanoid(6);
    while (await URL.findOne({ shortcode })) {
      shortcode = nanoid(6);
    }

    const newURL = new URL({ url, shortcode, validity: expiryTime });
    await newURL.save();

    res.status(201).json({
      shortened_url: `${req.protocol}://${req.get('host')}/${shortcode}`,
      validity: expiryTime
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.get("/:shortcode", async (req, res) => {
  const { shortcode } = req.params;

  try {
    const urlDoc = await URL.findOne({ shortcode });
    if (!urlDoc) return res.status(404).json({ error: "Shortcode not found" });

    if (moment().isAfter(urlDoc.validity)) {
      return res.status(410).json({ error: "This link has expired" });
    }

    // Log click
    const click = new Click({
      shortcode,
      referrer: req.get("referer") || null,
      userAgent: req.get("user-agent") || null,
      ipAddress: req.ip
    });
    await click.save();

    return res.redirect(urlDoc.url);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get shortcode stats
router.get("/shorten/:shortcode/stats", authorize, async (req, res) => {
  const { shortcode } = req.params;
  try {
    const urlDoc = await URL.findOne({ shortcode });
    if (!urlDoc) return res.status(404).json({ error: "Shortcode not found" });

    const clicks = await Click.find({ shortcode }).sort({ clickedAt: -1 });

    res.json({
      url: urlDoc.url,
      validity: urlDoc.validity,
      total_clicks: clicks.length,
      clicks
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports  = router;