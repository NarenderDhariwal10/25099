const express = require("express");const mongoose = require("mongoose");

const urlRoutes = require("./route/urlRoutes");

const dbconnect = require("./config/dbconnect");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;


// Connect to MongoDB
dbconnect();

// Middleware
app.use(express.json());
//loging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`
    }));
  });
  next();
});



// Routes

app.use("/", urlRoutes);

// Start server
app.listen(port, () => console.log(`URL shortener running at http://localhost:${port}`));
