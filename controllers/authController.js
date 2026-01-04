const db = require("../config/database");
const { encryptPassword, decryptPassword } = require("../helpers/encryption");

const register = async (req, res) => {
  const { firstname, lastname, username, password, role } = req.body;

  try {
    const passwordAman = encryptPassword(password);

    const query = `
            INSERT INTO Users (Firstname, Lastname, Username, password, role) 
            VALUES (?, ?, ?, ?, ?)
        `;

    await db.execute(query, [
      firstname,
      lastname,
      username,
      passwordAman,
      role,
    ]);

    res.status(201).json({ success: true, message: "User berhasil dibuat!" });
  } catch (error) {
    console.error("Error Register:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal daftar user",
        error: error.message,
      });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.execute("SELECT * FROM Users WHERE Username = ?", [
      username,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Username tidak ditemukan!" });
    }

    const user = rows[0];

    const passwordDiDB = user.password;

    let passwordAsli = "";
    try {
      passwordAsli = decryptPassword(passwordDiDB);
      if (!passwordAsli) passwordAsli = passwordDiDB;
    } catch (e) {
      passwordAsli = passwordDiDB;
    }

    if (password !== passwordAsli) {
      return res
        .status(401)
        .json({ success: false, message: "Password salah!" });
    }

    res.status(200).json({
      success: true,
      message: "Login Berhasil!",
      data: {
        user_id: user.user_id,
        firstname: user.Firstname,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error Login:", error);
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan di server" });
  }
};

module.exports = { register, login };
