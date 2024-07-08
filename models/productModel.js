const mongoose = require('mongoose');
const slugify = require('slugify');


//////////////////////////////////////////////
//// SCHEMA CONFIGURATION  ////
//////////////////////////////////////////////
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        default: 0,
    },
    images: [String],
    category: String,
    slug: String,
    discountPercent: Number,
    details: [{
        size: String,
        color: String,
        quantity: Number,
    }],
    amountInStock: {
        type: Number,
        default: 1
    },
    orderHistory: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
});


//////////////////////////////////////////////
//// SCHEMA MIDDLEWARES ////
//////////////////////////////////////////////
productSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true , replacement: '-'});
    next();
});


//////////////////////////////////////////////
//// MODEL AND COLLECTION ////
//////////////////////////////////////////////
const Product = mongoose.model('Product', productSchema);
module.exports = Product;