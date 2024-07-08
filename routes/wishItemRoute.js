//////////////////////////////////////////////////
//////////////////////////////////////////////////
const express = require('express');
const { authProtectedUser, authProtectedAdmin, isRetrictedToMainAdmin } = require('../middlewares/protected');
const wishItemController = require('../controllers/wishItemController');
const router = express.Router();
//////////////////////////////////////////////////
//////////////////////////////////////////////////


//////////////////////////////////////////////
//// CREATING AND CONFIGURING ROUTES ////
//////////////////////////////////////////////

// PUBLIC ROUTES (PAYMENT)
router.post('/grant-wish/:reference/:charges', wishItemController.grantUserWishItem);

// ADMIN ROUTES (PROTECTED)
router.get('/all', authProtectedAdmin, isRetrictedToMainAdmin, wishItemController.findWishItems);
router.get('/all/:userId', authProtectedAdmin, isRetrictedToMainAdmin, wishItemController.findWishItemsByUserId);

// ADMIN ROUTES (PROTECTED & PAYMENT LOGS)
router.get('/logs/', authProtectedAdmin, isRetrictedToMainAdmin, wishItemController.findWishPaymentLogs);
router.get('/logs/user/:userId', authProtectedAdmin, isRetrictedToMainAdmin, wishItemController.findWishPaymentLogs);
router.get('/logs/wish/:wishId', authProtectedAdmin, isRetrictedToMainAdmin, wishItemController.findWishPaymentLogs);

// USER ROUTES (PROCTECTED)
router.post('/', authProtectedUser, wishItemController.createWishItem);
router.get('/', authProtectedUser, wishItemController.findUserWishItems);
router.patch('/:wishId', authProtectedUser, wishItemController.updateWishItemById);
router.delete('/:wishId', authProtectedUser, wishItemController.deleteWishItemById);

// USER ROUTES (PAYMENT & PROCTECTED)
router.post('/order-completed-wish/:reference/:charges', authProtectedUser, wishItemController.createOrderFromCompletedWishItem);
router.post('/complete-wish-and-order/:reference/:charges', authProtectedUser, wishItemController.completeWishItemAndCreateOrder);


//////////////////////////////////////////////
//// EXPORT ROUTER ////
//////////////////////////////////////////////
module.exports = router;