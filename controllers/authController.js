const db = require("../config/db");
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
    res.status(500).json({
      success: false,
      message: "Gagal daftar user",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username dan Password wajib diisi!",
      });
    }

    const query = `
        SELECT user_id, Firstname, Lastname, Username, password, role 
        FROM Users 
        WHERE Username = ?
    `;

    const [rows] = await db.execute(query, [username]);

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
        username: user.Username || user.username,
        role: user.role,

        firstname: user.firstname || user.Firstname,
        lastname: user.lastname || user.Lastname,
      },
    });
  } catch (error) {
    console.error("Error Login:", error);
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan di server" });
  }
};

// AMBIL SEMUA USER (Khusus Admin)
const getAllUsers = async (req, res) => {
  try {
    // Kita ambil id, nama, username, dan role
    const query =
      "SELECT user_id, firstname, lastname, username, role FROM Users";
    const [rows] = await db.query(query);

    res.status(200).json({
      success: true,
      message: "List Data User",
      data: rows,
    });
  } catch (error) {
    console.error("❌ ERROR GET USERS:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data user",
      error: error.message,
    });
  }
};

// 1. GET DETAIL USER
const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
        SELECT 
            user_id AS user_id, 
            Firstname AS firstname, 
            Lastname AS lastname, 
            Username AS username, 
            role, 
            password 
        FROM Users 
        WHERE user_id = ?
    `;

    const [rows] = await db.execute(query, [id]);

    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });

    const user = rows[0];

    let passwordDecrypted = user.password; // Default: password mentah (kalo gagal dekrip)

    try {
      const hasilDekrip = decryptPassword(user.password);

      if (hasilDekrip && hasilDekrip.length > 0) {
        passwordDecrypted = hasilDekrip;
      }
    } catch (e) {
      console.log(
        "⚠️ Gagal dekripsi password (mungkin data lama/manual insert). Kirim raw."
      );
    }

    res.status(200).json({
      success: true,
      message: "Detail User",
      data: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        firstname: user.firstname,
        lastname: user.lastname,

        password: passwordDecrypted,
      },
    });
  } catch (error) {
    console.error("Error Detail User:", error);
    res
      .status(500)
      .json({ success: false, message: "Error Server", error: error.message });
  }
};

// 2. UPDATE USER
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstname, lastname, role } = req.body; // Username & Password kita skip dulu biar simpel

  try {
    await db.execute(
      "UPDATE Users SET Firstname=?, Lastname=?, role=? WHERE user_id=?",
      [firstname, lastname, role, id]
    );
    res.status(200).json({ success: true, message: "User berhasil diupdate" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Gagal update", error: error.message });
  }
};

// 3. DELETE USER
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM Users WHERE user_id = ?", [id]);
    res.status(200).json({ success: true, message: "User berhasil dihapus" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Gagal hapus", error: error.message });
  }
};

module.exports = {
  register,
  login,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
