const mongoose = require('mongoose');

//////////////////////////////////////////////
//// SCHEMA CONFIGURATION  ////
//////////////////////////////////////////////
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: String,
    orderItems: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            default: 1
        },
        color: {
            type: String,
            required: true
        },
        colorCode: String,
        size: {
            type: String,
            required: true
        }
    }],
    deliveryInstructions: String,
    country: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    postal: String,
    isPayFor: {
        type: Boolean,
        default: false
    },
    usedRewardType: {
        type: String,
        required: true,
    },
    usedCoupon: Boolean,
    deliveryStatus: {
        type: String,
        enum: ['processing', 'delivered', 'cancelled'],
        default: 'processing'
    }
}, {
    timestamps: true
});


//////////////////////////////////////////////
//// SCHEMA MIDDLEWARES ////
//////////////////////////////////////////////
orderSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: '_id firstName lastName image',
    });

    this.populate({
        path: 'product',
        select: '_id name price images amountInStock slug discountPercent'
    });

    next();
});


//////////////////////////////////////////////
//// MODEL AND COLLECTION ////
//////////////////////////////////////////////
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;