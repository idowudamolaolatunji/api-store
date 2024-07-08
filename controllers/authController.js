const crypto = require('crypto');
const jwt = require('jsonwebtoken');

//////////////////////////////////////////////////
//////////////////////////////////////////////////
const Admin = require("../models/adminModel");  
const Reward = require("../models/rewardModel");
const User = require("../models/userModel");    
//////////////////////////////////////////////////
//////////////////////////////////////////////////


//////////////////////////////////////////////////
//// AUTH HELPER FUNCTIONS ////
//////////////////////////////////////////////////
function generateOtp() {
    // GENERATE OTP
	return Math.floor(1000 + Math.random() * 9000);
};


//////////////////////////////////////////////////
//// CREATE A NEW ADMIN ////
//////////////////////////////////////////////////
exports.createAdmin = async function(req, res) {
	try {
        // CHECK AUTHORIZATION WITH PASSWORD CONFIRMATION
        const { adminPassword } = req.body;
		if(!adminPassword) return res.json({
			message: 'Provide password to complete this task!'
		});

		// GET THE ADMIN AND CHECK IF THE PASSWORD IS CORRECT
        const admin = await Admin.findById(req.user._id).select('+password');
        if(!(admin.comparePassword(adminPassword, admin.password))) {
            return res.json({ message: 'Password incorrect '});
        }

        // CHECK IF ADMIN ALREADY EXIST
		const alreadyExistAdmin = await Admin.findOne({ email: req.body.email });
		if (alreadyExistAdmin) {
			return res.json({
				message: "Email already used, Admin Exists",
			});
		}

        // CREATE NEW ADMIN
		const newAdmin = await Admin.create({
			email: req.body.email,
			fullName: req.body.fullName,
			password: req.body.password,
			passwordConfirm: req.body.passwordConfirm,
			role: req.body.role,
		});

		res.status(201).json({
			status: "success",
			message: "Admin Creation Successful!",
			data: {
				admin: newAdmin
			}
		});

	} catch (err) {
		res.status(400).json({
			status: "fail",
			message: err.message
		});
	}
};


//////////////////////////////////////////////////
//// USER SIGNUP AND SEND OTP CODE ////
//////////////////////////////////////////////////
exports.userSignup = async function(req, res) {
    try {
        const { inviteCode } = req.params;

        // CHECK IF EMAIL ALREADY EXISTS
        const emailExist = await User.findOne({ email: req.body.email });
		const AcctExistAndUnverified = await User.findOne({ email: req.body.email, username: req.body.username, fullName: req.body.fullName, isOtpVer: false })
		if(AcctExistAndUnverified) {
            return res.json({ message: "Email Already Exists and Unverified!" });
        }
		if (emailExist) {
            return res.json({ message: "Email already exist!" });
        }

        // CHECK IF THERE'S AN INVITER ID
        let inviterId = null, inviter;
        if(inviteCode) {
            inviter = (await User.findOne({ inviteCode }));
			inviterId = inviter._id
        }

        // GENERATE OTP AND GET EMAIL TEMPLETE
        const newOtp = generateOtp();
		// const emailOtp = otpEmail(newOtp);

        // CREATE NEW USER AND GRANT HIM 1 FREE DELEIVERY
		const newUser = await User.create({
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			password: req.body.password,
			passwordConfirm: req.body.passwordConfirm,
			role: "user",
			isActive: true,
			otpCode: newOtp,
			myInviter: inviterId,
		});

		// IF THERE'S AN INVITER, ADD NEW USER TO INVITER'S INVITE ARRAY
		if(inviteCode && inviter) {
            inviter.invites.push(newUser._id);
			await inviter.save({ validateBeforeSave: false });
        }

        // SEND BACK RESPONSE
		res.status(201).json({
			status: "success",
			message: "You signed up successfully!",
            data: {
                user: newUser
            }
		});

        // SEND OTP EMAIL AFTER RESPONSE HAS BEEN SENT
		// return await sendEmail({
        //     email: newUser.email,
        //     subject: "Devwares verification code",
        //     message: emailOtp
        // });

    } catch(err) {
        res.status(400).json({
            status: 'success',
            message: err.message
        })
    }
}


//////////////////////////////////////////////////
//// USER REQUEST NEW OTP CODE ////
//////////////////////////////////////////////////
exports.requestOtp = async (req, res) => {
	try {
		const requestingUser = await User.findOne({ email: req.body.email });
        
		// GO THROUGH SOME CHECKINGS
		if (!requestingUser) return res.json({ message: "You are not a valid user" });
		if(requestingUser.isOtpVerified) {
			return res.json({ message: "You are already a verified user" });
		};
		if(!requestingUser.isOTPExpired()) {
			return res.json({ message: "OTP not yet expired" });
		}

		// GENRATE OTP
		const newOtp = generateOtp();
		// const emailOtp = otpEmail(newOtp)
		requestingUser.otpCode = newOtp;
		await requestingUser.save({ validateBeforeSave: false });

		res.status(200).json({
			status: 'success',
			message: 'Gifta Verification Code Resent!',
			data: {
				otp: newOtp
			}
		})

		// SEND OTP TO THE USER EMAIL
		// return await sendEmail({
		// 	email: requestingUser.email,
        //     subject: "Gifta Verification Code Resent!",
        //     message: emailOtp,
		// });

	} catch (err) {
		res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};


//////////////////////////////////////////////////
//// VERIFYING USER OTP CODE ////
//////////////////////////////////////////////////
exports.verifyOtp = async (req, res) => {
	try {
		const { email, otp } = req.body;
		const verifyingUser = await User.findOne({ email });

		// CHECK IF USER TRULY EXIST
		if (!verifyingUser || !verifyingUser?.isActive) {
			return res.json({ message: "Invalid User, User no longer exist!" });
		}

		// CHECK IF THE USER IS ALREADY VERIFIED
		if(verifyingUser.isOtpVerified) {
			return res.json({ message: "You are already a verified user" })
		}

		// CHECK IF OTP HAS EXPIRED (ONLY VALID FOR 3 MINUTES)
		if (verifyingUser.isOTPExpired()) {
			return res.json({ message: "OTP expired. Please request a new one." });
		}

		// NOW CHECK IF OTP IS CORRECT
		if (verifyingUser?.otpCode !== Number(otp)) {
			return res.json({ message: "Invalid OTP Code, Try again!" });
		}

		// UPDATE THE USER AND GRANT ACCESS
		verifyingUser.isOtpVerified = true;
		verifyingUser.otpCode = null;
		await verifyingUser.save({ validateBeforeSave: false });

		if (verifyingUser.myInviter) {
			// FIND THE INVITER AND UPDATE
			const inviter = await User.findById(verifyingUser.myInviter);
			if(!inviter || !inviter.isActive) {
				return res.json({ message: 'User no longer exist' });
			}

            inviter.invites.push(verifyingUser._id);
            await inviter.save({ validateBeforeSave: false });
			
            await Reward.create({
                user: inviter._id,
                rewardType: 'free-delivery'
            });
		}

		return res.status(200).json({
			status: "success",
			message: "OTP Verified",
			data: {
				user: verifyingUser,
			},
		});

	} catch (err) {
		res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};


//////////////////////////////////////////////////
//// USER LOGIN ////
//////////////////////////////////////////////////
exports.userLogin = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email }).select("+password");
		const isAdmin = await Admin.findOne({ email });

		// SOME USER CHECKINGS
		if(isAdmin) return res.json({ message: "Admins must signin through the admin login route" });

		if (!user) {
			return res.json({ message: "Account does not exist" });
		}
		if (!user?.isActive) {
			return res.json({ message: "Account no longer active" });
		}
		if (!user?.email || !(await user.comparePassword(password, user?.password))) {
			return res.json({ message: "Incorrect email or password" });
		}
		if (!user.isOtpVerified) {
			return res.json({ message: "Account not Verified!" });
		}

		// CREATING AND SINGING TOKEN
		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_TOKEN, {
			expiresIn: process.env.JWT_EXPIRES_IN,
		});

		res.status(200).json({
			status: "success",
			message: "Login Successful!",
			data: {
				user,
			},
			token,
		});
	} catch (err) {
		res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};


//////////////////////////////////////////////////
//// ADMIN LOGIN ////
//////////////////////////////////////////////////
exports.adminLogin = async (req, res) => {
	try {
		const { email, password } = req.body;
        
		const admin = await Admin.findOne({ email }).select("+password");
		if (!admin || !admin.isActive) return res.json({ message: "Account either doesnt exist or inactive" });
		if (!admin?.email || !(await admin.comparePassword(password, admin.password))) {
			return res.json({ message: "Incorrect email or password" });
		}

        // SIGNING JWT TOKEN
		const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET_TOKEN, {
			expiresIn: process.env.JWT_EXPIRES_IN,
		});

		return res.status(200).json({
			status: "success",
            message: 'Login successful!',
			data: {
				admin,
			},
			token,
		});
	} catch (err) {
		res.status(400).json({
			status: "fail",
			message: err.message
		});
	}
};


//////////////////////////////////////////////////
//// USER LOGOUT ////
//////////////////////////////////////////////////
exports.logout = (req, res) => {
	res.clearCookie("jwt");
	res.status(200).json({ status: "success" });
};


//////////////////////////////////////////////////
//// FORGOT PASSWORD ////
//////////////////////////////////////////////////
exports.forgotPassword = async (req, res) => {
	try {
		// GET USER BASED ON THE REQUEST EMAIL
		const user = await User.findOne({ email: req.body.email });
		if (!user) {
			return res.status(404).json({ message: "There is no user with email address" });
		}

		// GENERATE RANDOM AND SECURED RESET TOKEN
		const resetToken = user.createPasswordResetToken();
		await user.save({ validateBeforeSave: false });

		// CREATE EMAIL AND UPDATE USER
		// const resetURL = `https://{url}/reset-password/${resetToken}`;
		const resetURL = `https://localhost:5173/reset-password/${resetToken}`;
		const message = `Forgot your password? Submit a request with your new password and confirmed password to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

		// THE BELOW IS A PROBLEM
		// user.passwordResetToken = undefined;
		// user.passwordResetExpires = undefined;
		// await user.save({ validateBeforeSave: false });

		res.status(200).json({
			status: "success",
			message: `Password reset email successfully to ${user.email}!`,
			data: {
				user,
				resetToken
			}
		});

        // SEND PASSWORD RESET EMAIL
        // return await sendEmail({
		// 	email: user.email,
		// 	subject: 'Your password reset token (valid for 10 min)',
		// 	message
		// });
	} catch (err) {
		res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};


//////////////////////////////////////////////////
//// RESET PASSWORD ////
//////////////////////////////////////////////////
exports.resetPassword = async (req, res) => {
	try {
		console.log(req.params.resetToken)

		// ENCRYPT THE TOKEN AND GET THE USER BASED ON THE ENCRYPTED TOKEN
		const hashedToken = crypto.createHash("sha256").update(req.params.resetToken).digest("hex");
		const user = await User.findOne({
			passwordResetToken: hashedToken,
			passwordResetExpires: { $gte: Date.now() },
		});

		// CHECK IF TOKEN HAS EXPIRED, THEN THERE IS NO USER
		if (!user) {
            return res.json({ message: "Token is invalid or has expired" });
        }

        // IF TOKEN HAS NOT EXPIRED, THERE IS A USER, SO PROCEED PASSWORD RESET
		user.password = req.body.password;
		user.passwordConfirm = req.body.passwordConfirm;
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save({ validateModifiedOnly: true });

		// FINALLY, UPDATE THE USER'S changedPasswordAt (BUT HAS BEEN DONE ALREADY ON THE USER MODEL)

		res.status(200).json({
			status: "success",
			message: "Password reset successful!",
		});

	} catch (err) {
		res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};


//////////////////////////////////////////////////
//// UPDATE PASSWORD ////
//////////////////////////////////////////////////
exports.updatePassword = async (req, res) => {
	try {
        const { currentPassword, newPassword, newPasswordConfirm } = req.body;
		const user = await User.findById(req.user._id).select("+password");
		// CHECK AND CONFIRM USER PASSWORD
		if (!(await user.comparePassword(currentPassword, user.password))) {
			return res.json({ message: "Your current password is wrong." });
		}

		// UPDATE USER PASSWORD
		user.password = newPassword;
		user.passwordConfirm = newPasswordConfirm;
		await user.save({ validateModifiedOnly: true });
		// User.findByIdAndUpdate, will not work here...

		res.status(201).json({
			status: "success",
            message: 'Password updated successfully!',
		});
	} catch (err) {
		res.status(404).json({
			status: "fail",
			message: err,
		});
	}
};