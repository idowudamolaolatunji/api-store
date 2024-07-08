const mongoose = require('mongoose');

//////////////////////////////////////////////
//// SCHEMA CONFIGURATION  ////
//////////////////////////////////////////////
const systemWalletSchema = new mongoose.Schema({
    systemId: mongoose.Schema.Types.ObjectId,
    allTimeProfit:  {
        type: Number,
        default: 0
    },
    productProfit: {
        type: Number,
        default: 0
    },
    deliveryProfit: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});


//////////////////////////////////////////////
//// MODEL AND COLLECTION ////
//////////////////////////////////////////////
const SystemWallet = mongoose.model('SystemWallet', systemWalletSchema);
module.exports = SystemWallet;