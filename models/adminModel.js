const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');


//////////////////////////////////////////////
//// SCHEMA CONFIGURATION  ////
//////////////////////////////////////////////
const adminSchema = new mongoose.Schema({
    username: String,
    email: {
        type: String,
        unique: true,
        validate: [validator.isEmail, "Enter a valid email"],
        lowercase: true,
        required: true,
    },
    password: {
        type:String,
        required: true,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: true,
        validate: {
            validator: function(el) {
                return el === this.password;
            },
            message: 'Password are not the same!',
        }
    },
    image: {
        type: String,
        default: 'https://res.cloudinary.com/dy3bwvkeb/image/upload/v1698676214/avatar_unr3vb.png'
    },
    role: {
        type: String,
        enum: ['sub-admin', 'admin'],
        default: 'sub-admin',
    },
    isActive: {
        type: Boolean,
        default: true
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
}, {
    timestamps: true
});


//////////////////////////////////////////////
//// SCHEMA MIDDLEWARES ////
//////////////////////////////////////////////
const saltRound = 12;
adminSchema.pre('save', async function(next) {
    // CHECK IF PASSWORD IS ALREADY MODIFIED
    if(!this.isModified('password')) return next();

    // IF NOT HASH THE PASSWORD
    const hashedPassword = await bcrypt.hash(this.password, saltRound);
    this.password = hashedPassword;
    this.passwordConfirm = undefined

    next();
});

adminSchema.pre("save", async function (next) {
	if (this.isModified("password") || this.isNew) return next();
	this.passwordChangedAt = Date.now() - 100;
	next();
});


//////////////////////////////////////////////
//// INSTANCE METHODS ////
//////////////////////////////////////////////
adminSchema.methods.changedPasswordAfter = function (jwtTimeStamp) {
	if (this.passwordChangedAt) {
		const changeTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
		return jwtTimeStamp < changeTimeStamp;
	}
	// return false means not changed
	return false;
};

adminSchema.methods.comparePassword = async function (candidatePassword, hashedPassword) {
	const encrypted = await bcrypt.compare(candidatePassword, hashedPassword);
	return encrypted;
}

adminSchema.methods.createPasswordResetToken = function () {
	// create random bytes token
	const resetToken = crypto.randomBytes(32).toString("hex");

	// simple hash random bytes token
	const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
	this.passwordResetToken = hashedToken;

	// create time limit for token to expire (10 mins)
	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
	return resetToken;
	// send the unencrypted version
};


//////////////////////////////////////////////
//// MODEL AND COLLECTION ////
//////////////////////////////////////////////
const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin