//////////////////////////////////////////////////
//////////////////////////////////////////////////
const express = require('express');
const { authProtectedUser, authProtectedAdmin, isRetrictedToMainAdmin } = require('../middlewares/protected');
const { uploadSinglePhoto, resizeSingleUserPhoto } = require('../middlewares/multer');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const router = express.Router();
//////////////////////////////////////////////////
//////////////////////////////////////////////////


//////////////////////////////////////////////
//// CREATING AND CONFIGURING ROUTES ////
//////////////////////////////////////////////


// USER ROUTES (AUTHS)
router.post('/signup', authController.userSignup);
router.post('/login', authController.userLogin);
router.post('/request-otp', authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);

router.get('/logout', authController.logout);
router.patch('/forgot-password', authController.forgotPassword);
router.patch('/reset-password', authController.resetPassword);

// ADMIN ROUTES (AUTHS)
router.post('/admin-signup', authProtectedAdmin, isRetrictedToMainAdmin, authController.createAdmin);
router.post('/admin-login', authController.adminLogin);

// ADMIN ROUTES (PROTECTED)
router.post('/', authProtectedAdmin, isRetrictedToMainAdmin, userController.getAllUser);
router.post('/:userId', authProtectedAdmin, isRetrictedToMainAdmin, userController.getUserById);
router.post('/:userId', authProtectedAdmin, isRetrictedToMainAdmin, userController.updateUserById);
router.post('/:userId', authProtectedAdmin, isRetrictedToMainAdmin, userController.deleteUserById);


// USER ROUTES (AUTHS)
router.post('/signup', authController.userSignup);
router.post('/signup/:inviteCode', authController.userSignup);
router.post('/login', authController.userLogin);
router.post('/request-otp', authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);

router.get('/logout', authController.logout);
router.patch('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:resetToken', authController.resetPassword);


// USER ROUTES (PROTECTED)
router.patch('/change-password', authProtectedUser, authController.updatePassword);
router.patch('/upload-profile-img', authProtectedUser, uploadSinglePhoto, resizeSingleUserPhoto, userController.uploadProfilePicture);
router.patch('/account-update', authProtectedUser, userController.updateMe);
router.patch('/account-delete', authProtectedUser, userController.deleteMyAccount);


//////////////////////////////////////////////
//// EXPORT ROUTER ////
//////////////////////////////////////////////
module.exports = router;