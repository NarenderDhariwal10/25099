const express = require("express");
const dotenv = require("dotenv").config;
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const PORT = process.env.PORT || 3001;

const app = express();

app.use(express.json());


app.use(authMiddleware);

// authRoutes  /api/
app.use("/api", authRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on  htt://localhost:${PORT}`);
});
