const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');
const bcrypt = require('bcrypt');


//////////////////////////////////////////////
//// SCHEMA CONFIGURATION  ////
//////////////////////////////////////////////
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        lowercase: true,
        required: true,
    },
    lastName: {
        type: String,
        lowercase: true,
        required: true,
    },
    email :{
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
    image: String,
    role: {
        type: String,
        default: 'user',
    },
    isActive: {
        type: Boolean,
        default: false
    },
    slug: String,
    inviteCode: String,
    invites: [{ type: mongoose.Schema.Types.ObjectId }],
    myInviter: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    level: {
        type: String,
        enum: ['starter', 'next-rated', 'og', 'prime-minster'],
        default: 'starter',
    },
    isOtpVerified: {
        type: Boolean,
        default: false
    },
    otpCode: Number,
    otpExpiresIn: Date,
    country: String,
    phone: String,
    address: String,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
}, {
    timestamps: true,
});


//////////////////////////////////////////////
//// SCHEMA MIDDLEWARES ////
//////////////////////////////////////////////
const saltRound = 12;
userSchema.pre('save', async function(next) {
    // CHECK IF PASSWORD IS ALREADY MODIFIED
    if(!this.isModified('password')) return next();

    // IF NOT HASH THE PASSWORD
    const hashedPassword = await bcrypt.hash(this.password, saltRound);
    this.password = hashedPassword;
    this.passwordConfirm = undefined

    next();
});

userSchema.pre("save", async function (next) {
	if (this.isModified("password") || this.isNew) return next();
	this.passwordChangedAt = Date.now() - 100;
	next();
});

userSchema.pre("save", function (next) {
    if(this.isNew) {
        // CREATING USER SLUG AND REFERALS LINK
        const randomID = this._id.toString().slice(-4);
        const slug = slugify(this.firstName, { lower: true });
        this.slug = `${slug}-${this._id}`;
        this.inviteCode = `${slug}-${randomID}`;
    }
	next();
});

userSchema.pre("save", function (next) {
	this.otpExpiresIn = Date.now() + 2.9 * 60 * 1000;
	next();
});

userSchema.methods.isOTPExpired = function () {
	if (this.otpCode && this.otpExpiresIn) {
		return Date.now() > this.otpExpiresIn;
	}
	return false;
};


//////////////////////////////////////////////
//// INSTANCE METHODS ////
//////////////////////////////////////////////
userSchema.methods.changedPasswordAfter = function (jwtTimeStamp) {
	if (this.passwordChangedAt) {
		const changeTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
		return jwtTimeStamp < changeTimeStamp;
	}
	// return false means not changed
	return false;
};

userSchema.methods.comparePassword = async function (candidatePassword, hashedPassword) {
	const encrypted = await bcrypt.compare(candidatePassword, hashedPassword);
	return encrypted;
};

userSchema.methods.createPasswordResetToken = function () {
	// create random bytes token
	const resetToken = crypto.randomBytes(32).toString("hex");

	// simple hash random bytes token
	const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
	this.passwordResetToken = hashedToken;

	// create time limit for token to expire (10 mins)
	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    console.log(resetToken, hashedToken, Date.now() + 10 * 60 * 1000)

	return resetToken;
	// send the unencrypted version
};


//////////////////////////////////////////////
//// MODEL AND COLLECTION ////
//////////////////////////////////////////////
const User = mongoose.model('User', userSchema);
module.exports = User;