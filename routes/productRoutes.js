const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.get("/", productController.getAllProducts);

router.post("/", productController.createProduct);

router.get("/history", productController.getHistoryLog);

router.get("/:id", productController.getProductById);

router.put("/:id", productController.updateProduct);

router.delete("/:id", productController.deleteProduct);

router.post("/restock", productController.restockProduct);
router.post("/stock-out", productController.stockOutProduct);

module.exports = router;
