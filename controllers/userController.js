////////////////////////////////////////////////
////////////////////////////////////////////////
const User = require('../models/userModel');
////////////////////////////////////////////////
////////////////////////////////////////////////


//////////////////////////////////////////////////
//// USER HELPER FUNCTIONS ////
//////////////////////////////////////////////////
const NewObj = {}
// FILTER USER OBJECT FOR UPDATE
const filterObj = function(obj, ...allowed) {
	Object.keys(obj).forEach(el => {
		if(allowed.includes(el)) NewObj[el] = obj[el];
	});
    return NewObj;
}


//////////////////////////////////////////////
//// FIND ALL USERS ////
//////////////////////////////////////////////
exports.getAllUser = async(req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        res.status(200).json({
            status: "success",
            count: users.length,
            data: {
                users,
            }
        })
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
};


//////////////////////////////////////////////
//// FIND USER BY ID ////
//////////////////////////////////////////////
exports.getUserById = async(req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if(!user || !user.isActive) {
            return res.json({ message: 'User not found' })
        }

        res.status(200).json({
            status: "success",
            data: {
                user,
            }
        })
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
};


//////////////////////////////////////////////
//// FIND USER BY ID AND UPDATE ////
//////////////////////////////////////////////
exports.updateUserById = async(req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.userId, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: "success",
            message: 'User updated!',
            data: {
                user,
            }
        })
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
};


//////////////////////////////////////////////
//// ADD USER PROFILE IMAGE ////
//////////////////////////////////////////////
exports.uploadProfilePicture = async (req, res) => {
    try {
        let image;
        if(req.file) image = req.file.filename;

        const updatedUser = await User.findByIdAndUpdate(req.user._id, {image}, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            status: 'success',
            message: 'Updated user profile picture',
            data: {
                user: updatedUser,
            }
        });
    } catch(err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
}


//////////////////////////////////////////////
//// UPDATE ACCOUNT ////
//////////////////////////////////////////////
exports.updateMe = async (req, res) => {
    try {
        // MAKE SURE THE USER IS NOT UPDATING PASSWORD
        if(req.body.password || req.body.passwordConfirm) {
            return res.json({ message: 'This route is not for password updates.' });
        }
        
        // 1. FILTER WHAT IS UPDATED
        /*
        const { email, isActive, role, isOTPVerified, isKycVerified } = req.body
        if(email || isActive || role  || isOTPVerified || isKycVerified) return res.status(403).json({
            message: 'You are unauthorised to perform this action!'
        })
        */
        const allowedFileds = [firstName, lastName, country, phone, address];
        const filterBody = filterObj(req.body, allowedFileds);

        // 2. update
        const updatedUser = await User.findByIdAndUpdate(req.user._id, filterBody, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: "success",
            message: 'Profile Updated!',
            data: {
                user: updatedUser,
            }
        })
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
}


//////////////////////////////////////////////
//// DELETE USER ////
//////////////////////////////////////////////
exports.deleteUserById = async(req, res) => {
    try {
        await User.findByIdAndDelete(req.params.userId);

        res.status(200).json({
            status: "success",
            message: 'Deleted user successfully',
            data: null
        });
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
};


//////////////////////////////////////////////
//// DELETE MY ACCOUNT ////
//////////////////////////////////////////////
exports.deleteMyAccount = async(req, res, next) => {
    try {
        // CHECK IF PASSWORD WAS PROVIDED 
        const { password } = req.body;
        if(!password) return res.json({
			message: 'Provide password to complete this task!'
		});

        // GET THE USER
        const user = await User.findById(req.user._id).select('+password');
        if(!user || !user.isActive) {
            return res.json({ message: 'User not found!' });
        }

        // CHECK IF THE PROVIDED PASSWORD IS CORRECT
        if (!(await user?.comparePassword(password, user.password))) {
            return res.json({ message: "Incorrect password " });
        }

        await User.findByIdAndDelete(user._id);

        res.status(200).json({
            status: "success",
            message: 'Account deleted!',
            data: null
        });

    } catch(err) {
        res.status(400).json({
            status: "fail",
            message: err.message
        })
    }
};
