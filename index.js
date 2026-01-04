const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); 

app.use((req, res, next) => {
  console.log(`[REQUEST MASUK] ${req.method} ke alamat: ${req.url}`);
  next();
});

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Server Scentra Jalan Bos! 🚀");
});



app.listen(PORT, () => {
  console.log(`Server nyala di http://localhost:${PORT}`);
});
