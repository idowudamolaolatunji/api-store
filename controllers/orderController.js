
//////////////////////////////////////////////////
//////////////////////////////////////////////////
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Reward = require("../models/rewardModel");
const SystemWallet = require("../models/systemWalletModel");
const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");
const { paymentResponse, generateOrderId } = require("../utils/helpers");
//////////////////////////////////////////////////
//////////////////////////////////////////////////


//////////////////////////////////////////////
//// CHECKOUT CART AND PLACE ORDER  ////
//////////////////////////////////////////////
exports.checkoutOrder = async function(req, res) {
    try {
        const { reference, charges } = req.params;
        const { orderItems, deliveryFee, rewardType, deliveryInstructions, country, state, address, phoneNumber, city, postal } = req.body

		// VERIFY PAYMENT AND GET RESPONSE AND AMOUNT DATA
        let amount = await paymentResponse(req, res, reference, charges);
        const totalAmount = Number(amount - (deliveryFee || 0))

        // FIND USER AND CHECK IF ORDER IS HIS FIRST ORDER
        const orderUser = await User.findById(req.user._id);
        const prevOrders = await Order.find({ user: orderUser._id });
        // REWARD INVITER WITH 10% DISCOUNT REWARD
        if(prevOrders?.length < 1 && orderUser.myInviter) {
            await Reward.create({
                user: orderUser.myInviter,
                rewardType: '10-percent-discount'
            });
        }

        // CREATE CHECKOUT ORDER
        const newOrder = await Order.create({
            user: orderUser._id,
            orderId: generateOrderId(),
            orderItems,
            deliveryInstructions, country,
            state, address, phoneNumber,
            city, postal, isPayFor: true,
            usedRewardType: rewardType || 'none',
            deliveryStatus: 'processing'
        });

        if(rewardType && rewardType !== "none") {
            await Reward.findByIdAndDelete({ user: orderUser, rewardType });
        }

        // ADD MONEY TO ADMIN'S PURSE
        const systemWallet = await SystemWallet.findOne({ systemId: process.env.SYSTEM_ADMIN_ID });
        systemWallet.allTimeProfit += amount;
        systemWallet.productProfit += totalAmount;
        systemWallet.deliveryProfit += deliveryFee;
        await systemWallet.save();

        // CREATE A TRANSACTION RECIEPT
        await Transaction.create({
            user: orderUser._id,
            item: newOrder._id,
            transactionBills: {
                amount: totalAmount,
                deliveryFee: deliveryFee || 0,
                transactFee: charges,
            },
            usedRewardType: rewardType || 'none',
            purpose: 'order-fee',
            status: 'success',
            reference,
        });

        // REWARD ORDER USER WITH DISCOUNTS AND REWARDS BASED ON CONDITIONS
        if(prevOrders === 5) {
            await Reward.create({
                user: orderUser._id,
                rewardType: '30-percent-discount'
            });
        }
        if(prevOrders === 10) {
            await Reward.create({
                user: orderUser._id,
                rewardType: "free-product"
            });
        }

        // INCREASE THE ODER HISTORY OF EACH PRODUCTS
        for(const orderItem of orderItems) {
            const product = await Product.findById(orderItem.product);
            /////////////////////////////////////////////////////////
            product.orderHistory += 1;
            await product.save();
        }

        // CREATE NOTIFICATION FOR THE USER

        res.status(200).json({
            status: 'success',
            message: 'Your order was just made',
            data: {
                order: newOrder
            }
        })

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


//////////////////////////////////////////////
//// FIND ALL MY CHECKOUT ORDERS  ////
//////////////////////////////////////////////
exports.findUserCheckoutOrders = async function(req, res) {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        if(!orders || orders.length < 1) {
            return res.json({
                message: 'No checkout order available at the moment'
            })
        }

        res.status(200).json({
            status: 'success',
            count: orders.length,
            data: {
                orders
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
//// FIND ALL CHECKOUT ORDER  ////
//////////////////////////////////////////////
exports.getAllCheckoutOrder = async function(req, res) {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        if(!orders || orders.length < 1) {
            return res.json({
                message: 'No checkout order available at the moment'
            })
        }

        res.status(200).json({
            status: 'success',
            count: orders.length,
            data: {
                orders
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
//// FIND CHECKOUT ORDER BY ID ////
//////////////////////////////////////////////
exports.getCheckoutOrderById = async function(req, res) {
    try {
        const order = await Order.findById(req.params.orderId);
        if(!order) {
            return res.json({ message: 'Checkout order not found'})
        }

        res.status(200).json({
            status: 'success',
            data: {
                order
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
//// FIND CHECKOUT ORDER BY ORDERID ////
//////////////////////////////////////////////
exports.getCheckoutOrderByOrderId = async function(req, res) {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ orderId });
        if(!order) {
            return res.json({ message: 'Checkout order not found'})
        }

        res.status(200).json({
            status: 'success',
            data: {
                order
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
//// FIND CHECKOUT ORDERs BY PRODUCT ID ////
//////////////////////////////////////////////
exports.getCheckoutOrderByProductId = async function(req, res) {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);
        if(!product) {
            return res.json({ message: 'Product not found' });
        }
        
        const orders = await Order.find({ product: productId }).sort({ createdAt: 1 });
        if(!orders || orders.length < 1) {
            return res.json({ message: 'No checkout order found with product ID' });
        }

        res.status(200).json({
            status: 'success',
            data: {
                orders
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
//// FIND CHECKOUT ORDER AND UPDATE ////
//////////////////////////////////////////////
exports.updateOrderDeliveryInfo = async function(req, res) {
    try {
        const { country,state, address, phoneNumber, city, postal } = req.body
        const order = await Order.findByIdAndUpdate(req.params.orderId, {
            country,
            state,
            address,
            phoneNumber,
            city,
            postal
        }, {
            runValidators: true, new: true
        });
        if(!order) {
            return res.json({ message: 'Checkout order not found'})
        }

        res.status(200).json({
            status: 'success',
            data: {
                order
            }
        });
        
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}