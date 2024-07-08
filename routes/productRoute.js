//////////////////////////////////////////////////
//////////////////////////////////////////////////
const express = require('express');
const { authProtectedUser, authProtectedAdmin, isRetrictedToMainAdmin } = require('../middlewares/protected');
const { uploadSinglePhoto, resizeSingleCategoryPhoto, uploadMultipleProductPhoto } = require('../middlewares/multer');
const productController = require('../controllers/productController');
const router = express.Router();
//////////////////////////////////////////////////
//////////////////////////////////////////////////


//////////////////////////////////////////////
//// CREATING AND CONFIGURING ROUTES ////
//////////////////////////////////////////////

// PRODUCT CATEGORIES (PROTECTED / RESTRICTED)
router.post('/category', authProtectedAdmin, isRetrictedToMainAdmin, productController.createProductCategory);
router.patch('/category/upload-img/:categoryId', authProtectedAdmin, isRetrictedToMainAdmin, uploadSinglePhoto, resizeSingleCategoryPhoto, productController.uploadProductCategoryImage);
router.patch('/category/:categoryId', authProtectedAdmin, isRetrictedToMainAdmin, productController.updateProductCategoryById);
router.delete('/category/:categoryId', authProtectedAdmin, isRetrictedToMainAdmin, productController.deleteProductCategoryById);

// PRODUCT CATEGORIES (UNPROTECTED)
router.get('/category', productController.getAllProductCategories);
router.get('/category/:categorySlug', productController.getCategoryBySlug);
router.get('/category/products/:categorySlug', productController.getProductsInCategory);

// PRODUCTS ADMIN ROUTES (PROTECTED / RESTRICTED)
router.post('/', authProtectedAdmin, isRetrictedToMainAdmin, productController.createProduct);
router.patch('/upload-imgs/:productId', authProtectedAdmin, isRetrictedToMainAdmin, uploadMultipleProductPhoto, productController.uploadProductImages);
router.patch('/:productId', authProtectedAdmin, isRetrictedToMainAdmin, productController.updateProductById);
router.patch('/stock-amount/:productId', authProtectedAdmin, isRetrictedToMainAdmin, productController.updateProductInStockAmount);
router.delete('/:productId', authProtectedAdmin, isRetrictedToMainAdmin, productController.deleteProductById);

// PRODUCTS (UNPROTECTED)
router.get('/', productController.getProducts);
router.get('/:productId', productController.getProductById);
router.get('/slug/:productSlug', productController.getProductBySlug);


//////////////////////////////////////////////
//// EXPORT ROUTER ////
//////////////////////////////////////////////
module.exports = router;