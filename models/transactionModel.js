const mongoose = require('mongoose');

//////////////////////////////////////////////
//// SCHEMA CONFIGURATION  ////
//////////////////////////////////////////////
const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    item: mongoose.Schema.Types.ObjectId,
    transactionBills: {
        amount: Number,
        deliveryFee: Number,
        transactFee: Number
    },
    purpose: {
        type: String,
        enum: ['order-fee', 'order-remaining-fee', 'delivery-fee', 'wish-item-fee', 'pre-design-fee'],
        default: 'order-fee'
    },
    status: {
        type: String,
        enum: ['pending', 'success'],
        default: 'pending'
    },
    reference: {
        type: String,
        // required: true,
        // unique: true
        // uncomment this later, as it it only temporarily commented to testing purposes
    },
    usedRewardType: String,
    transactedAt: {
        type: Date,
        default: Date.now
    }
});



//////////////////////////////////////////////
//// SCHEMA MIDDLEWARES ////
//////////////////////////////////////////////
transactionSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: '_id firstName lastName image',
    });

    next();
});


//////////////////////////////////////////////
//// MODEL AND COLLECTION ////
//////////////////////////////////////////////
const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;