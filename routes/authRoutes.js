// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Jalur Login: POST /api/auth/login
router.post("/login", authController.login);

// Jalur Register: POST /api/auth/register
router.post("/register", authController.register);

module.exports = router;
