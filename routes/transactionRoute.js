//////////////////////////////////////////////////
//////////////////////////////////////////////////
const express = require('express');
const { authProtectedUser, authProtectedAdmin, isRetrictedToMainAdmin } = require('../middlewares/protected');
const transactionController = require('../controllers/transactionController');
const router = express.Router();
//////////////////////////////////////////////////
//////////////////////////////////////////////////


//////////////////////////////////////////////
//// CREATING AND CONFIGURING ROUTES ////
//////////////////////////////////////////////

// USER ROUTES
router.get('/user', authProtectedUser, transactionController.findUserTransactions);


// ADMIN ROUTES
router.get('/', authProtectedAdmin, isRetrictedToMainAdmin, transactionController.getTransactions);
router.get('/:userId', authProtectedAdmin, isRetrictedToMainAdmin, transactionController.findTransactionsbByUserId);


//////////////////////////////////////////////
//// EXPORT ROUTER ////
//////////////////////////////////////////////
module.exports = router;