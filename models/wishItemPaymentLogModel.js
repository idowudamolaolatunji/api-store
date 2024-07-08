const mongoose = require('mongoose');


//////////////////////////////////////////////
//// SCHEMA CONFIGURATION  ////
//////////////////////////////////////////////
const wishItemPaymentLogSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WishItem',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    anonymous: {
        type: Boolean,
        require: true,
    },
    payerName: String,
    payerWhatsappNo: String,
    payerEmail: {
        type: String,
        require: true
    },
    amount: {
        type: Number,
        require: true
    },
    logMessage: String,
    responseInfo: {
        responseMessage: String,
        responseDate: Date,
    }
}, {
    timestamps: true,
});


//////////////////////////////////////////////
//// SCHEMA MIDDLEWARES ////
//////////////////////////////////////////////
wishItemPaymentLogSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'item',
        select: '_id product title description'
    });
    this.populate({
        path: 'user',
        select: '_id firstName lastName email image'
    });

    next();
});


//////////////////////////////////////////////
//// MODEL AND COLLECTION ////
//////////////////////////////////////////////
const WishItemPaymentLog = mongoose.model('WishItemPaymentLog', wishItemPaymentLogSchema);
module.exports = WishItemPaymentLog;