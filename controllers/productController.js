
//////////////////////////////////////////////////
//////////////////////////////////////////////////
const sharp = require('sharp');
const ProductCategory = require('../models/productCategoryModel');
const Product = require('../models/productModel');
//////////////////////////////////////////////////
//////////////////////////////////////////////////


//////////////////////////////////////////////
//// CREATE PRODUCT CATEGORY  ////
//////////////////////////////////////////////
exports.createProductCategory = async function(req, res) {
    try {
        const { categoryName, categoryDescription } = req.body;
        const category = await ProductCategory.create({ categoryName, categoryDescription });

        res.status(200).json({
            status: 'success',
            message: `New product category created successfully!`,
            data: {
                category
            }
        })

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


//////////////////////////////////////////////
//// UPLOAD PRODUCT CATEGORY IMAGE  ////
//////////////////////////////////////////////
exports.uploadProductCategoryImage = async function(req, res) {
    try {
        let image;
		if (req.file) image = req.file.filename;
        const { categoryId } = req.params

        const category = await ProductCategory.findByIdAndUpdate(categoryId, 
            { categoryImage: image },
            { runValidators: true, new: true }
        );

        res.status(200).json({
            status: 'success',
            message: 'Category image uploaded successfully',
            data: {
                category
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


//////////////////////////////////////////////
//// GET ALL PRODUCT CATEGORY  ////
//////////////////////////////////////////////
exports.getCategoryBySlug = async function(req, res) {
    try {
        const { categorySlug } = req.params;
        const category = await ProductCategory.findOne({ slug: categorySlug });

        res.status(200).json({
            status: 'success',
            data: {
                category
            }
        })

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


//////////////////////////////////////////////
//// GET ALL PRODUCT CATEGORY  ////
//////////////////////////////////////////////
exports.getAllProductCategories = async function(req, res) {
    try {
        const allCategories = await ProductCategory.find().sort({ categoryName: 1 });

        res.status(200).json({
            status: 'success',
            count: allCategories.length,
            data: {
                categories: allCategories
            }
        })

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


//////////////////////////////////////////////
//// UPDATE PRODUCT CATEGORY BY ID  ////
//////////////////////////////////////////////
exports.updateProductCategoryById = async function(req, res) {
    try {
        const { categoryId } = req.params;
        const category = await ProductCategory.findByIdAndUpdate(categoryId, req.body, {
            runValidators: true, new: true
        }); 

        res.status(200).json({
            status: 'success',
            message: 'Category updated',
            data: {
                category
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


//////////////////////////////////////////////
//// DELETE PRODUCT CATEGORY BY ID  ////
//////////////////////////////////////////////
exports.deleteProductCategoryById = async function(req, res) {
    try {
        await ProductCategory.findByIdAndDelete(req.params.categoryId); 

        res.status(200).json({
            status: 'success',
            message: 'Category deleted!',
            data: null
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


//////////////////////////////////////////////
//// CREATE PRODUCT  ////
//////////////////////////////////////////////
exports.createProduct = async function(req, res) {
    try {
        const { name, description, price, category, type, discountPercent, amountInStock, details } = req.body;
        const newProduct = await Product.create({
            name,
            description,
            price,
            category,
            type,
            discountPercent,
            amountInStock,
            details
        });

        await ProductCategory.findOneAndUpdate({ categoryName: category }, { $inc: { itemCounts: 1 } }, { runValidators: true, new: true })

        res.status(200).json({
            status: 'success',
            message: `New product created successfully!`,
            data: {
                product: newProduct
            }
        })

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


//////////////////////////////////////////////
//// UPLOAD PRODUCT IMAGES  ////
//////////////////////////////////////////////
exports.uploadProductImages = async function(req, res) {
    try {
        const product = await Product.findById(req.params.productId);
		if(!product) return res.json({
			message: 'Cannot find product'
		});

		const images = [];
		if (req?.files && Array.isArray(req.files)) {
			for (const image of req.files) {
				const fileName = `product-${product?._id}-${Date.now()}-${images.length + 1}.jpeg`
				await sharp(image.buffer)
					.resize(950, 950)
					.toFormat('jpeg')
					.jpeg({ quality: 80 })
					.toFile(`public/assets/products/${fileName}`)
				;
				images.push(fileName);
			}
		}

		product.images = images;
		await product.save({});

        res.status(200).json({
            status: 'success',
			message: 'Image upload successful'
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


//////////////////////////////////////////////
//// GET ALL CREATED PRODUCT  ////
//////////////////////////////////////////////
exports.getProducts = async function(req, res) {
    try {
        const products = await Product.find().sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            count: products.length,
            data: {
                products
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}



//////////////////////////////////////////////
//// GET PRODUCT BY ID  ////
//////////////////////////////////////////////
exports.getProductById = async function(req, res) {
    try {
        const product = await Product.findById(req.params.productId);
        if(!product) return res.json({
            message: 'No product by that ID'
        });

        res.status(200).json({
            status: 'success',
            data: {
                product
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


//////////////////////////////////////////////
//// GET PRODUCT BY SLUG  ////
//////////////////////////////////////////////
exports.getProductBySlug = async function(req, res) {
    try {
        const product = await Product.findOne({ slug: req.params.productSlug });
        if(!product) return res.json({
            message: 'Product not found!'
        });

        res.status(200).json({
            status: 'success',
            data: {
                product
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


//////////////////////////////////////////////
//// GET PRODUCT BY CATEGORY (category name)  ////
//////////////////////////////////////////////
exports.getProductsInCategory = async function(req, res) {
    try {
        const { categorySlug } = req.params;
        const category = await ProductCategory.findOne({ slug: categorySlug });
        if(!category) {
            return res.json({
                message: 'Category not found!'
            });
        }
        
        const products = await Product.find({ category: category.categoryName }).sort({ createdAt: -1 });
        res.status(200).json({
            status: 'success',
            data: {
                products
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


//////////////////////////////////////////////
//// FIND PRODUCT AND UPDATE INSTOCK AMOUNT  ////
//////////////////////////////////////////////
exports.updateProductInStockAmount = async function(req, res) {
    try {
        const { amountInStock } = req.body;
        const updateProduct = await Product.findByIdAndUpdate(
            req.params.productId, { amountInStock },
            { runValidators: true, new: true }
        );

        if(!updateProduct) return res.json({
            message: 'Product not found!'
        });

        res.status(200).json({
            status: 'success',
            data: {
                product: updateProduct
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


//////////////////////////////////////////////
//// FIND PRODUCT AND UPDATE BY ID  ////
//////////////////////////////////////////////
exports.updateProductById = async function(req, res) {
    try {
        const updateProduct = await Product.findByIdAndUpdate(
            req.params.productId, req.body,
            { runValidators: true, new: true }
        );

        if(!updateProduct) return res.json({
            message: 'No product by that ID'
        });

        res.status(200).json({
            status: 'success',
            data: {
                product: updateProduct
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


//////////////////////////////////////////////
//// FIND PRODUCT AND DELETE BY ID  ////
//////////////////////////////////////////////
exports.deleteProductById = async function(req, res) {
    try {
        const deletingProduct = await Product.findByIdAndDelete(req.params.productId);
        res.status(200).json({
            status: 'success',
            data: null
        });

        await ProductCategory.findOneAndUpdate(
            { categoryName: deletingProduct.category },
            { $inc: { itemCounts: -1 } },
            { runValidators: true, new: true }
        );

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}