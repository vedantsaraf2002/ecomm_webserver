const express = require('express');
const router = express.Router();

const { addProduct, getAllProduct } = require("../controllers/productController");
const { isLoggedIn, customRole} = require('../middlewares/user');

router.route("/admin/product/add").get(isLoggedIn, customRole('admin'), addProduct);
router.route("/products").get(getAllProduct)

 module.exports = router;

