//////////////////////////////////////////////////
//////////////////////////////////////////////////
const express = require('express');
const { authProtectedUser, authProtectedAdmin, isRetrictedToMainAdmin } = require('../middlewares/protected');
const orderController = require('../controllers/orderController');
const router = express.Router();
//////////////////////////////////////////////////
//////////////////////////////////////////////////


//////////////////////////////////////////////
//// CREATING AND CONFIGURING ROUTES ////
//////////////////////////////////////////////

// USER ROUTES (PROTECTED)
router.post('/checkout/:reference/:charges', authProtectedUser, orderController.checkoutOrder);
router.patch('/update-deleivery-info/:orderId', authProtectedUser, orderController.updateOrderDeliveryInfo);
router.get('/me', authProtectedUser, orderController.findUserCheckoutOrders);

// ADMIN ROUTES (PROTECTED)
router.get('/', authProtectedAdmin, isRetrictedToMainAdmin, orderController.getAllCheckoutOrder);
router.get('/:orderId', authProtectedAdmin, isRetrictedToMainAdmin, orderController.getCheckoutOrderById);
router.get('/product/:productId', authProtectedAdmin, isRetrictedToMainAdmin, orderController.getCheckoutOrderByProductId);


//////////////////////////////////////////////
//// EXPORT ROUTER ////
//////////////////////////////////////////////
module.exports = router;