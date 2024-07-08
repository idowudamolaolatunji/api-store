const mongoose = require('mongoose');

//////////////////////////////////////////////
//// SCHEMA CONFIGURATION  ////
//////////////////////////////////////////////
const favouriteItemSchema = new mongoose.Schema({
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
    dateAdded: {
        type: Date,
        default: Date.now
    }
});


//////////////////////////////////////////////
//// SCHEMA MIDDLEWARES ////
//////////////////////////////////////////////
favouriteItemSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: '_id firstName lastName email image',
    });

    this.populate({
        path: 'product',
    });

    next();
});


//////////////////////////////////////////////
//// MODEL AND COLLECTION ////
//////////////////////////////////////////////
const FavouriteItem = mongoose.model('FavouriteItem', favouriteItemSchema);
module.exports = FavouriteItem;