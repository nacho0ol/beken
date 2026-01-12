// File: config/db.js
const mysql = require("mysql2/promise"); // Perhatikan kita pakai 'mysql2/promise'

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Aquarius13",
  database: "scentra_pam",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log("✅ Koneksi Database Berhasil (Pool Created)");

module.exports = db;
