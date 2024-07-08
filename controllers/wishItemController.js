
//////////////////////////////////////////////////
//////////////////////////////////////////////////
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");
const SystemWallet = require("../models/systemWalletModel");
const WishItem = require("../models/wishItemModel");
const WishItemPaymentLog = require("../models/wishItemPaymentLogModel");
const { paymentResponse, numberConverter, generateOrderId } = require("../utils/helpers");
//////////////////////////////////////////////////
//////////////////////////////////////////////////






//////////////////////////////////////////////
//// CREATE WISH ITEM ////
//////////////////////////////////////////////
exports.createWishItem = async function(req, res) {
    try {
        const { productId, title, description } = req.body;

        const user = await User.findById(req.user.id);
        const product = await Product.findById(productId);
        if(!product) return res.json({
            message: 'Product not found!',
        });
        const randomString = Math.random().toString(36).substring(2, 10);
        const productStr = product?.name.split(' ').slice(0, 3).join('-').toLowerCase();
        const sharableUrl = `${user?.firstName}-${productStr}-${randomString}`;

        const newWish = await WishItem.create({
            product: product._id,
            user: user._id,
            title, description,
            sharableUrl,
        });

        res.status(200).json({
            status: 'success',
            message: `Item added to wishlist`,
            data: {
                wish: newWish
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}


//////////////////////////////////////////////
//// PAY / GRANT WISH ITEM ////
//////////////////////////////////////////////
exports.grantUserWishItem = async function(req, res) {
    try {
        const { reference, charges } = req.params;
        const { userId, wishId, payerName, anonymous, payerWhatsappNo, payerEmail } = req.body;

        // VERIFY PAYMENT AND GET RESPONSE AND AMOUNT DATA
        const amount = await paymentResponse(req, res, reference, charges);

        // FIND THE CURRENT USER
		const user = await User.findById(userId);
		if (!user || !user.isActive) {
			return res.json({
				message: "User Not Found!",
			});
		}

        // FIND THE WISH AND ITEM AND UPDATE THE PAID WISH ITEM
        const wishItem = await WishItem.findOne({ _id: wishId, user: userId });
        const previouslyPaid = wishItem.amountContributed;
        const product = await Product.findById(wishItem.product._id);
        if(!wishItem) {
            return res.json({
                message: 'Wish item not found!'
            });
        }

        // UPDATE THE WISHITEM VALUES
        wishItem.contributors += 1;
        wishItem.amountContributed += amount;
        wishItem.isCompletelyPaidFor = wishItem.amountContributed >= product.price;
        await wishItem.save({});

        // ADD MONEY TO ADMIN'S PURSE
        const systemWallet = await SystemWallet.findOne({ systemId: process.env.SYSTEM_ADMIN_ID });
        systemWallet.allTimeProfit += amount;
        systemWallet.productProfit += amount;
        await systemWallet.save();

        // CREATE A TRANSACTION RECIEPT
        await Transaction.create({
            user: user._id,
            item: wishId,
            transactionBills: {
                amount,
                deliveryFee: null,
                transactFee: charges,
            },
            purpose: 'wish-item-fee',
            status: 'success',
            reference,
        });

        // CREATE PAYMENTlOG FOR LUXEWARES
        await WishItemPaymentLog.create({
            user: user._id,
            item: wishId,
            anonymous, payerEmail, payerName, payerWhatsappNo,
            amount,
            logMessage: `${anonymous ? 'Anonymous' : payerName} paid ${numberConverter('₦', amount)} for your wish item!`,
        })

        // CREATE NOTIFICATION FOR THE USER

        res.status(200).json({
            status: 'success',
            message: `You made a payment of ${numberConverter('₦', amount)} to meet ${((previouslyPaid === 0) && wishItem.amountContributed >= product.price) ? '100% of' : 'a portion of'} ${user.firstName}'s wish item!`,
            data: {
                wish: wishItem
            }
        });
        
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}


//////////////////////////////////////////////
//// ORDER COMPLETED WISH ITEM ////
//////////////////////////////////////////////
exports.createOrderFromCompletedWishItem = async function(req, res) {
    try {
        const { reference, charges } = req.params;
        const { wishId, color, size, deliveryInstructions, country, state, address, phoneNumber, city, postal } = req.body;

        // VERIFY PAYMENT AND GET RESPONSE AND AMOUNT DATA, WE STILL NEED TO PAY FOR DELIVERY
        const amount = await paymentResponse(req, res, reference, charges);

        // FIND USER AND FIND THE WISH ITEM
        const user = await User.findById(req.user._id);
        const wishItem = await WishItem.findOne({ _id: wishId, user: user._id });
        const product = await Product.findById(wishItem.product);

        // CHECK IF WISH WAS COMPLETELY PAID FOR
        if(!wishItem.isCompletelyPaidFor) {
            return res.json({
                message: 'You cannot make Order. Wish item isn\'t completely paid for'
            })
        }

        // CHECK IF WISH HAS ALREADY BEEN ORDERED
        if(wishItem.isOrderedFor) {
            return res.json({
                message: 'You cannot make Order. Wish item has already been ordered!'
            })
        }

        // CREATE CHECKOUT ORDER
        const newOrder = await Order.create({
            user: user._id,
            product: product._id,
            orderId: generateOrderId(),
            quantity: 1, color, size,
            deliveryInstructions, country,
            state, address, phoneNumber,
            city, postal, isPayFor: true,
            usedRewardType: 'none',
            deliveryStatus: 'processing'
        });

        // MODIFY THE WISH ITEM SO THAT THIS WISH ITEM ISNT RE-ORDERED
        wishItem.isOrderedFor = true;
        await wishItem.save({});

        // ADD MONEY TO ADMIN'S PURSE
        const systemWallet = await SystemWallet.findOne({ systemId: process.env.SYSTEM_ADMIN_ID });
        systemWallet.allTimeProfit += amount;
        systemWallet.deliveryProfit += amount;
        await systemWallet.save();


        // CREATE A TRANSACTION RECIEPT
        await Transaction.create({
            user: user._id,
            item: product._id,
            transactionBills: {
                amount: null,
                deliveryFee: amount,
                transactFee: charges,
            },
            usedRewardType: 'none',
            purpose: 'delivery-fee',
            status: 'success',
            reference: reference + 123,
        });

        product.orderHistory += 1;
        await product.save();

        // CREATE NOTIFICATION FOR THE USER
        // 

        // SEND BACK THE RESPONSE
        res.status(200).json({
            status: 'success',
            message: ``,
            data: {
                order: newOrder
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}


//////////////////////////////////////////////
//// COMPLETE WISH ITEM AND CREATE ORDER ////
//////////////////////////////////////////////
exports.completeWishItemAndCreateOrder = async function(req, res) {
    try {
        const { reference, charges } = req.params;
        const { wishId, color, size, deliveryFee, deliveryInstructions, country, state, address, phoneNumber, city, postal } = req.body;

        // VERIFY PAYMENT AND GET RESPONSE AND AMOUNT DATA
        const amount = await paymentResponse(req, res, reference, charges);

        // FIND USER AND FIND THE WISH ITEM
        const user = await User.findById(req.user._id);
        const wishItem = await WishItem.findOne({ _id: wishId, user: user._id });
        const product = await Product.findById(wishItem.product);
        if(!wishItem) {
            return res.json({
                message: 'Wish item not found!'
            });
        }

        // UPDATE THE WISHITEM VALUES
        wishItem.amountContributed += amount;
        wishItem.isCompletelyPaidFor = wishItem.amountContributed >= wishItem.product.price;
        await wishItem.save({});

        // CHECK IF ITEM IS NOW COMPLETELY PAID FOR
        if(!wishItem.isCompletelyPaidFor) {
            return res.json({
                message: 'You cannot make Order. Wish item isn\'t completely paid for'
            })
        }

        // CHECK IF WISH HAS ALREADY BEEN ORDERED
        if(wishItem.isOrderedFor) {
            return res.json({
                message: 'You cannot make Order. Wish item has already been ordered!'
            })
        }

        // CREATE CHECKOUT ORDER
        const newOrder = await Order.create({
            user: user._id,
            product: product._id,
            orderId: generateOrderId(),
            quantity: 1, color, size,
            deliveryInstructions, country,
            state, address, phoneNumber,
            city, postal, isPayFor: true,
            usedRewardType: 'none',
            deliveryStatus: 'processing'
        });

        // MODIFY THE WISH ITEM SO THAT THIS WISH ITEM ISNT RE-ORDERED
        wishItem.isOrderedFor = true;
        await wishItem.save({});

        // ADD MONEY TO ADMIN'S PURSE
        const systemWallet = await SystemWallet.findOne({ systemId: process.env.SYSTEM_ADMIN_ID });
        systemWallet.allTimeProfit += amount;
        systemWallet.productProfit += amount;
        systemWallet.deliveryProfit += deliveryFee;
        await systemWallet.save();

        // CREATE A TRANSACTION RECIEPT
        await Transaction.create({
            user: user._id,
            item: product._id,
            transactionBills: {
                amount,
                deliveryFee,
                transactFee: charges,
            },
            usedRewardType: 'none',
            purpose: 'order-remaining-fee',
            status: 'success',
            reference: reference + 234,
        });

        product.orderHistory += 1;
        await product.save();

        // CREATE NOTIFICATION FOR THE USER
        // 

        res.status(200).json({
            status: 'success',
            message: ``,
            data: {
                order: newOrder
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}


//////////////////////////////////////////////
//// FIND EVERY USER WISH ITEMS ////
//////////////////////////////////////////////
exports.findWishItems = async function(req, res) {
    try {
        const wishes = await WishItem.find().sort({ createdAt: -1 });
        if(!wishes || wishes.length < 1) {
            return res.json({ message: 'No wishlist found' });
        }

        res.status(200).json({
            status: 'success',
            count: wishes.length,
            data: {
                wishes
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}


//////////////////////////////////////////////
//// FIND WISH ITEMS BY USER ID ////
//////////////////////////////////////////////
exports.findWishItemsByUserId = async function(req, res) {
    try {
        const user = await User.findById(req.params.userId);
        if(!user || !user.isActive) return res.json({
            message: 'User not found!'
        })

        const wishes = await WishItem.find({ user: user._id });
        if(!wishes || wishes.length < 1) {
            return res.json({ message: 'No wish Item found' });
        }

        res.status(200).json({
            status: 'success',
            count: wishes.length,
            data: {
                wishes
            }
        })

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}


//////////////////////////////////////////////
//// FIND USER WISH ITEMS ////
//////////////////////////////////////////////
exports.findUserWishItems = async function(req, res) {
    try {
        const wishes = await WishItem.find({ user: req.user._id });
        if(!wishes || wishes.length < 1) {
            return res.json({ message: 'No wishlist found' });
        }

        res.status(200).json({
            status: 'success',
            count: wishes.length,
            data: {
                wishes
            }
        })

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}

//////////////////////////////////////////////
//// UPDATE USER WISH ITEM BY ID ////
//////////////////////////////////////////////
exports.updateWishItemById = async function(req, res) {
    try {
        const { wishId } = req.params;
        const wishItem = await WishItem.findOneAndUpdate({ _id: wishId, user: req.user._id }, {
            title: req.body.title,
            description: req.body.description,
        });

        if(!wishItem) {
            return res.json({
                message: 'No wish item with this ID'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Wish item updated!',
            data: {
                wish: wishItem
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}


//////////////////////////////////////////////
//// DELETE USER WISH ITEM BY ID ////
//////////////////////////////////////////////
exports.deleteWishItemById = async function(req, res) {
    try {
        const { wishId } = req.params;
        await WishItem.findOneAndDelete({ _id: wishId, user: req.user._id });

        res.status(200).json({
            status: 'success',
            message: 'Wish item deleted!',
            data: null
        })

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}


//////////////////////////////////////////////
//////////////////////////////////////////////
//////////////////////////////////////////////
///////////////  PAYMENT LOG  ////////////////
//////////////////////////////////////////////
//////////////////////////////////////////////
//////////////////////////////////////////////


//////////////////////////////////////////////
//// FIND ALL PAYMENT LOG ////
//////////////////////////////////////////////
exports.findWishPaymentLogs = async function(req, res) {
    try {
        const logs = await WishItemPaymentLog.find().sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            count: logs.length,
            data: {
                logs
            }
        })

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}


//////////////////////////////////////////////
//// FIND ALL PAYMENT LOG BY USER ID ////
//////////////////////////////////////////////
exports.findWishPaymentLogsByUserId = async function(req, res) {
    try {
        const user = await User.findById(req.params.userId);
        if(!user || !user.isActive) {
            return res.json({
                message: 'User not found!'
            });
        }

        const logs = await WishItemPaymentLog.find({ user: user._id }).sort({ createdAt: -1 });
        res.status(200).json({
            status: 'success',
            count: logs.length,
            data: {
                logs
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}



//////////////////////////////////////////////
//// FIND ALL PAYMENT LOG BY ITEM ID ////
//////////////////////////////////////////////
exports.findWishPaymentLogsByItemId = async function(req, res) {
    try {
        const wishItem = await WishItem.findById(req.params.wishId);
        if(!wishItem) {
            return res.json({
                message: 'Wish item not found!'
            });
        }

        const logs = await WishItemPaymentLog.find({ item: wishItem._id }).sort({ createdAt: -1 });
        res.status(200).json({
            status: 'success',
            count: logs.length,
            data: {
                logs
            }
        })

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}