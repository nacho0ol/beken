const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/db"); // Pastikan DB di import biar kebaca pas start

// Import Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes"); // 👈 1. TAMBAHAN BARU

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[REQUEST MASUK] ${req.method} ke alamat: ${req.url}`);
  next();
});

// --- DAFTAR ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes); // 👈 2. TAMBAHAN BARU

app.get("/", (req, res) => {
  res.send("Server Scentra Jalan! 🚀");
});

app.listen(PORT, () => {
  console.log(`Server nyala di http://localhost:${PORT}`);
});
