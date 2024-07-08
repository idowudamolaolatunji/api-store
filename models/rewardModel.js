const mongoose = require('mongoose');


//////////////////////////////////////////////
//// SCHEMA CONFIGURATION  ////
//////////////////////////////////////////////
const rewardSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rewardType: {
        type: String,
        enum: ['free-delivery', 'free-product', '10-percent-discount', '30-percent-discount'],
        required: true
    },
    isUsedReward: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});


//////////////////////////////////////////////
//// SCHEMA MIDDLEWARES ////
//////////////////////////////////////////////
rewardSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: '_id firstName lastName',
    });

    next();
});


//////////////////////////////////////////////
//// MODEL AND COLLECTION ////
//////////////////////////////////////////////
const Reward = mongoose.model('Reward', rewardSchema);
module.exports = Reward;