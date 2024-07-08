const mongoose = require('mongoose');


//////////////////////////////////////////////
//// SCHEMA CONFIGURATION  ////
//////////////////////////////////////////////
const wishItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    contributors: {
        type: Number,
        default: 0,
    },
    amountContributed: {
        type: Number,
        default: 0
    },
    isCompletelyPaidFor: {
        type: Boolean,
        default: false
    },
    isOrderedFor: {
        type: Boolean,
        default: false
    },
    sharableUrl: String,
}, {
    timestamps: true
});


//////////////////////////////////////////////
//// SCHEMA MIDDLEWARES ////
//////////////////////////////////////////////
wishItemSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: '_id firstName lastName email image',
    });

    this.populate({
        path: 'product',
        select: '_id name price images amountInStock slug discountPercent'
    });

    next();
});
// 'idowu-iphone-xe-6yd6';


//////////////////////////////////////////////
//// MODEL AND COLLECTION ////
//////////////////////////////////////////////
const WishItem = mongoose.model('WishItem', wishItemSchema);
module.exports = WishItem;