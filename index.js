const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/db");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
  console.log(`[REQUEST MASUK] ${req.method} ke alamat: ${req.url}`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes); 

app.get("/", (req, res) => {
  res.send("Server Scentra Jalan! 🚀");
});

app.listen(PORT, () => {
  console.log(`Server nyala di http://localhost:${PORT}`);
});
