const FavouriteItem = require("../models/favoriteItemModel");


//////////////////////////////////////////////
//// UPDATE USER FAVOURITE ITEMS ////
//////////////////////////////////////////////
exports.updateUserFavoriteList = async function(req, res) {
    try {

        const { items } = req.body;
        for (const item of items) {

            const favItem = await FavouriteItem.findOne({ product: item.productId, user: req.user._id });
            if(favItem) {
                return;
            } else {
                await FavouriteItem.create({
                    product: item.productId,
                    user: req.user._id
                });
            }
        }

        const userFavItems = await FavouriteItem.find({ user: req.user._id });
        res.status(200).json({
            status: 'success',
            data: {
                userFavItems
            }
        })

    } catch(err) {
        res.status(200).json({
            status: 'fail',
            message: err.message
        })
    }
}


//////////////////////////////////////////////
//// UPDATE FAVORITE ITEM BY ID ////
//////////////////////////////////////////////
exports.updateFavoriteListByProductId = async function(req, res) {
    try {

        const { productId } = req.params;
        const newItem = await FavouriteItem.create({ user: req.user._id, product: productId });

        res.status(200).json({
            status: 'success',
            message: 'Deleted item from favorite list',
            data: {
                item: newItem,
            }
        });

    } catch(err) {
        res.status(200).json({
            status: 'fail',
            message: err.message
        })
    }
}


//////////////////////////////////////////////
//// DELETE FAVORITE ITEM BY ID ////
//////////////////////////////////////////////
exports.deleteFavoriteItemById = async function(req, res) {
    try {

        const { favItemId } = req.params;
        await FavouriteItem.findOneAndDelete({ _id: favItemId, user: req.user._id });

        res.status(200).json({
            status: 'success',
            message: 'Deleted item from favorite list',
            data: null
        });

    } catch(err) {
        res.status(200).json({
            status: 'fail',
            message: err.message
        })
    }
}


//////////////////////////////////////////////
//// DELETE USER FAVORITE ITEMS ////
//////////////////////////////////////////////
exports.deleteAllFavoriteItems = async function(req, res) {
    try {

        await FavouriteItem.deleteMany({ user: req.user._id });

        res.status(200).json({
            status: 'success',
            message: 'Deleted all favorite items',
            data: null
        });

    } catch(err) {
        res.status(200).json({
            status: 'fail',
            message: err.message
        })
    }
}