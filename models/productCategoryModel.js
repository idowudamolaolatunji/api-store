const mongoose = require('mongoose');
const slugify = require('slugify');

//////////////////////////////////////////////
//// SCHEMA CONFIGURATION  ////
//////////////////////////////////////////////
const productCategorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true
    },
    categoryDescription: {
        type: String,
        required: true
    },
    categoryImage: String,
    itemCounts: {
        type: Number,
        default: 0,
    },
    slug: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});


//////////////////////////////////////////////
//// SCHEMA MIDDLEWARES ////
//////////////////////////////////////////////
productCategorySchema.pre('save', function(next) {
    this.slug = slugify(this.categoryName, { lower: true , replacement: '-'});
    next();
})


//////////////////////////////////////////////
//// MODEL AND COLLECTION ////
//////////////////////////////////////////////
const ProductCategory = mongoose.model('Product Category', productCategorySchema);
module.exports = ProductCategory;