const db = require("../config/db");
const fs = require("fs");
const path = require("path");

const handleSqlError = (error, res, req, actionType = "Action") => {
  console.error(`❌ ERROR ${actionType}:`, error);

  if (req && req.file) {
    const filePath = path.join(__dirname, "../uploads/", req.file.filename);
    fs.unlink(filePath, (err) => {
      if (err) console.error("⚠️ Gagal hapus file sampah:", err);
    });
  }

  if (error.code === "ER_CHECK_CONSTRAINT_VIOLATED") {
    const msg = error.sqlMessage || "";

    if (msg.includes("check_product_name_valid")) {
      return res.status(400).json({
        success: false,
        message: "Nama produk min 5 huruf & diawali huruf/angka!",
        error_field: "product_name",
      });
    }

    if (msg.includes("check_variant_digits")) {
      return res.status(400).json({
        success: false,
        message: "Varian harus 1 - 999 ml!",
        error_field: "variant",
      });
    }

    if (
      msg.includes("check_topnotes") ||
      msg.includes("check_middlenotes") ||
      msg.includes("check_basenotes")
    ) {
      let field = "top_notes";
      if (msg.includes("middle")) field = "middle_notes";
      if (msg.includes("base")) field = "base_notes";

      return res.status(400).json({
        success: false,
        message: "Notes min 3 huruf & diawali huruf (tanpa simbol aneh)!",
        error_field: field,
      });
    }

    if (msg.includes("check_desc_format")) {
      return res.status(400).json({
        success: false,
        message: "Deskripsi terlalu pendek (min 10 karakter)!",
        error_field: "description",
      });
    }

    if (msg.includes("check_price_limit")) {
      return res.status(400).json({
        success: false,
        message: "Harga minimal Rp 30.000!",
        error_field: "price",
      });
    }

    if (msg.includes("check_stock")) {
      return res.status(400).json({
        success: false,
        message: "Stok tidak cukup atau stok minus!",
        error_field: "qty",
      });
    }

    if (
      msg.includes("check_qty_in_limit") ||
      msg.includes("check_qty_out_limit")
    ) {
      return res.status(400).json({
        success: false,
        message: "Jumlah (Qty) per transaksi maksimal 99 pcs!",
        error_field: "qty",
      });
    }
  }

  if (error.code === "ER_DUP_ENTRY") {
    return res.status(400).json({
      success: false,
      message: "Data produk/varian tersebut sudah ada!",
      error_field: "product_name",
    });
  }

  return res.status(500).json({
    success: false,
    message: `Gagal ${actionType}`,
    error: error.message,
  });
};

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
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      message: "Semua kolom wajib diisi!",
    });
  }

  if (
    current_stock === undefined ||
    current_stock === "" ||
    current_stock === null
  ) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      message: "Stok awal wajib diisi (minimal 0)!",
      error_field: "current_stock",
    });
  }

  if (isNaN(price)) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      message: "Harga harus angka!",
      error_field: "price",
    });
  }
  if (isNaN(variant)) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      message: "Varian harus angka!",
      error_field: "variant",
    });
  }
  if (isNaN(current_stock)) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      message: "Stok harus angka!",
      error_field: "current_stock",
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
    return handleSqlError(error, res, req, "Menambah Produk");
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

  if (
    !product_name ||
    !variant ||
    !price ||
    !top_notes ||
    !middle_notes ||
    !base_notes ||
    !description
  ) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res
      .status(400)
      .json({ success: false, message: "Data tidak boleh ada yang kosong!" });
  }

  if (isNaN(price) || isNaN(variant) || isNaN(current_stock)) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      message: "Harga, Varian, dan Stok harus angka!",
    });
  }

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
      if (req.file) fs.unlinkSync(req.file.path); // Hapus foto baru kalo ID gak ketemu
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan" });
    }

    res.status(200).json({ success: true, message: "Update Berhasil!" });
  } catch (error) {
    return handleSqlError(error, res, req, "Update Produk");
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

  if (!user_id || !product_id) {
    return res
      .status(400)
      .json({ success: false, message: "User ID & Product ID wajib ada!" });
  }

  if (!qty || isNaN(qty)) {
    return res.status(400).json({
      success: false,
      message: "Jumlah (Qty) wajib diisi angka!",
      error_field: "qty",
    });
  }

  try {
    await db.query("CALL sp_restock(?, ?, ?)", [product_id, user_id, qty]);
    res.status(200).json({ success: true, message: "Restock Berhasil" });
  } catch (error) {
    return handleSqlError(error, res, req, "Restock");
  }
};

const stockOutProduct = async (req, res) => {
  const { product_id, user_id, qty, reason } = req.body;

  if (!user_id || !product_id) {
    return res
      .status(400)
      .json({ success: false, message: "User ID & Product ID wajib ada!" });
  }

  if (!qty || isNaN(qty)) {
    return res.status(400).json({
      success: false,
      message: "Jumlah (Qty) wajib diisi angka!",
      error_field: "qty",
    });
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
    return handleSqlError(error, res, req, "Stock Out");
  }
};

const getHistoryLog = async (req, res) => {
  try {
    const query = `
        SELECT 'Masuk' AS type, p.product_name, u.username, s.qty, s.date
        FROM Stock_In_Log s JOIN Products p ON s.product_id = p.product_id LEFT JOIN Users u ON s.user_id = u.user_id
        UNION ALL
        SELECT 'Keluar' AS type, p.product_name, u.username, s.qty, s.date
        FROM Stock_Out_Log s JOIN Products p ON s.product_id = p.product_id LEFT JOIN Users u ON s.user_id = u.user_id
        ORDER BY date DESC
    `;

    const [rows] = await db.query(query);

    res
      .status(200)
      .json({ success: true, message: "Data History Log", data: rows });
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
