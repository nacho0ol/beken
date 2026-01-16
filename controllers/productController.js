const db = require("../config/db");

const getAllProducts = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Products");
    res.status(200).json({
      success: true,
      message: "List Data Produk",
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

const createProduct = async (req, res) => {
  console.log("📦 [DEBUG] Data Create:", req.body);

  const {
    product_name,
    variant,
    top_notes,
    middle_notes,
    base_notes,
    description,
    price,
    current_stock,
  } = req.body;

  if (
    !product_name ||
    !variant ||
    !price ||
    !top_notes ||
    !middle_notes ||
    !base_notes ||
    !description
  ) {
    return res.status(400).json({
      success: false,
      message: "Semua kolom (termasuk Notes & Deskripsi) wajib diisi!",
    });
  }

  if (
    current_stock === undefined ||
    current_stock === "" ||
    current_stock === null
  ) {
    return res.status(400).json({
      success: false,
      message: "Stok awal wajib diisi (minimal 0)!",
    });
  }

  if (isNaN(price) || isNaN(variant) || isNaN(current_stock)) {
    return res.status(400).json({
      success: false,
      message: "Harga, Varian, dan Stok harus berupa angka!",
    });
  }

  const img_path = req.file ? req.file.filename : "default.jpg";

  try {
    const query = `CALL sp_AddNewProduct(?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      product_name,
      variant,
      top_notes,
      middle_notes,
      base_notes,
      description,
      price,
      img_path,
      current_stock,
    ];

    await db.query(query, values);

    res.status(201).json({
      success: true,
      message: "Produk Berhasil Ditambahkan",
    });
  } catch (error) {
    console.error("❌ ERROR SP CREATE:", error);
    res.status(500).json({
      success: false,
      message: "Gagal Menambah Produk",
      error: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    product_name,
    variant,
    top_notes,
    middle_notes,
    base_notes,
    description,
    price,
    current_stock,
    img_path: old_img_path,
  } = req.body;

  const final_img_path = req.file
    ? req.file.filename
    : old_img_path || "default.jpg";

  try {
    const query = `
            UPDATE Products 
            SET product_name=?, variant=?, top_notes=?, middle_notes=?, base_notes=?, description=?, price=?, img_path=?, current_stock=?
            WHERE product_id=? 
        `;
    const values = [
      product_name,
      variant,
      top_notes,
      middle_notes,
      base_notes,
      description,
      price,
      final_img_path,
      current_stock,
      id,
    ];

    const [result] = await db.execute(query, values);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan" });
    }

    res.status(200).json({ success: true, message: "Update Berhasil!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const query = "DELETE FROM Products WHERE product_id = ?";
    const [result] = await db.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan" });
    }

    res.status(200).json({ success: true, message: "Produk Berhasil Dihapus" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal Hapus Produk",
      error: error.message,
    });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const query = "SELECT * FROM Products WHERE product_id = ?";
    const [result] = await db.execute(query, [id]);

    if (result.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan" });
    }

    res.status(200).json({ success: true, data: result[0] });
  } catch (error) {
    console.error("❌ ERROR GET BY ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const restockProduct = async (req, res) => {
  const { product_id, user_id, qty } = req.body;

  if (!user_id) {
    return res
      .status(400)
      .json({ success: false, message: "User ID wajib ada!" });
  }

  try {
    await db.query("CALL sp_restock(?, ?, ?)", [product_id, user_id, qty]);
    res.status(200).json({ success: true, message: "Restock Berhasil" });
  } catch (error) {
    console.error("❌ ERROR RESTOCK:", error);
    res
      .status(500)
      .json({ success: false, message: "Gagal Restock", error: error.message });
  }
};

const stockOutProduct = async (req, res) => {
  const { product_id, user_id, qty, reason } = req.body;

  if (!user_id) {
    return res
      .status(400)
      .json({ success: false, message: "User ID wajib ada!" });
  }

  try {
    await db.query("CALL sp_stock_out(?, ?, ?, ?)", [
      product_id,
      user_id,
      qty,
      reason || "Sales",
    ]);
    res.status(200).json({ success: true, message: "Stok Keluar Berhasil" });
  } catch (error) {
    console.error("❌ ERROR STOCK OUT:", error);
    res.status(500).json({
      success: false,
      message: "Gagal Stock Out",
      error: error.message,
    });
  }
};

const getHistoryLog = async (req, res) => {
  try {
    const query = `
        SELECT 
            'Masuk' AS type,
            p.product_name,
            u.username,
            s.qty,
            s.date
        FROM Stock_In_Log s
        JOIN Products p ON s.product_id = p.product_id
        LEFT JOIN Users u ON s.user_id = u.user_id

        UNION ALL

        SELECT 
            'Keluar' AS type,
            p.product_name,
            u.username,
            s.qty,
            s.date
        FROM Stock_Out_Log s
        JOIN Products p ON s.product_id = p.product_id
        LEFT JOIN Users u ON s.user_id = u.user_id

        ORDER BY date DESC
    `;

    const [rows] = await db.query(query);

    res.status(200).json({
      success: true,
      message: "Data History Log",
      data: rows,
    });
  } catch (error) {
    console.error("❌ ERROR HISTORY:", error);
    res.status(500).json({
      success: false,
      message: "Gagal Ambil History",
      error: error.message,
    });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  restockProduct,
  stockOutProduct,
  getHistoryLog,
};
