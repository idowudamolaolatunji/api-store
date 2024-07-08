////////////////////////////////////////////////
////////////////////////////////////////////////
const User = require("../models/userModel");
const Transaction = require('../models/transactionModel');
////////////////////////////////////////////////
////////////////////////////////////////////////


//////////////////////////////////////////////
//// FIND ALL TRANSACTIONS  ////
//////////////////////////////////////////////
exports.getTransactions = async function(req, res) {
    try {
        const transactions = await Transaction.find({}).sort({ transactedAt: -1 });

        res.status(200).json({
            status: 'success',
            count: transactions.length,
            data: {
                transactions
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
//// FIND TRANSACTIONS BY USER ID  ////
//////////////////////////////////////////////
exports.findTransactionsbByUserId = async function(req, res) {
    try {
        const user = await User.findById(req.params.userId);
        if(!user || !user.isActive) {
            res.json({
                message: 'User not found!'
            })
        }
        const transactions = await Transaction.find({ user: user._id }).sort({ transactedAt: -1 });

        if(!transactions || !transactions.length < 1) {
            return res.json({
                message: 'No previous transactions found!'
            })
        }

        res.status(200).json({
            status: 'success',
            count: transactions.length,
            data: {
                transactions
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
//// FIND USER TRANSACTIONS  ////
//////////////////////////////////////////////
exports.findUserTransactions = async function(req, res) {
    try {
        const transactions = await Transaction.find({ user: req.user._id }).sort({ transactedAt: -1 });

        if(!transactions || !transactions.length < 1) {
            return res.json({
                message: 'No previous transactions found!'
            })
        }

        res.status(200).json({
            status: 'success',
            count: transactions.length,
            data: {
                transactions
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}