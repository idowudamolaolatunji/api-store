const multer = require('multer');
const sharp = require('sharp');


//////////////////////////////////////////////////
//// MULTER STORAGE ////
//////////////////////////////////////////////////
const multerStorage = multer.memoryStorage();


//////////////////////////////////////////////////
//// MULTER FILTER ////
//////////////////////////////////////////////////
const multerFilter = (req, file, cb) => {
    try {
        if (file.mimetype.startsWith('image') || file.mimetype.startsWith('application/pdf')) {
            cb(null, true);
        } else {
            throw new Error('Not a Vaild file! Please upload only accepted files');
        }
    } catch (error) {
        cb(error, false);
    }
}


//////////////////////////////////////////////////
//// MULTER UPLOAD ////
//////////////////////////////////////////////////
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});


//////////////////////////////////////////////////
//// MULTER UPLOAD SINGLE IMAGE ////
//////////////////////////////////////////////////
exports.uploadSinglePhoto = upload.single('image');


//////////////////////////////////////////////////
//// MULTER UPLOAD MULTIPLE PRODUCT IMAGE ////
//////////////////////////////////////////////////
exports.uploadMultipleProductPhoto = upload.array('images', 6);


//////////////////////////////////////////////////
//// SHARP RESIZE SINGLE USER IMAGE ////
//////////////////////////////////////////////////
exports.resizeSingleUserPhoto = async function (req, res, next) {
    if(!req.file) return next();

    try {
        req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

        await sharp(req.file.buffer)
            .resize(350, 350)
            .toFormat('jpeg')
            .jpeg({ quality: 75 })
            .toFile(`public/assets/users/${req.file.filename}`);
        next();

    } catch(err) {
        next(err);
    }
};


//////////////////////////////////////////////////
//// SHARP RESIZE SINGLE BLOG IMAGE ////
//////////////////////////////////////////////////
exports.resizeSingleBlogPhoto = async function (req, res, next) {
    if(!req.file) return next();

    try {
        req.file.filename = `blog-${req.params.blogId}-${Date.now()}.jpeg`;

        await sharp(req.file.buffer)
            .resize(500, 500)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/assets/blogs/${req.file.filename}`);
        next();

    } catch(err) {
        next(err)
    }
};


//////////////////////////////////////////////////
//// SHARP RESIZE SINGLE CATEGORY IMAGE ////
//////////////////////////////////////////////////
exports.resizeSingleCategoryPhoto = async function (req, res, next) {
    if(!req.file) return next();

    try {
        req.file.filename = `productCategory-${req.params.categoryId}-${Date.now()}.jpeg`;

        await sharp(req.file.buffer)
            .resize(500, 500)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/assets/products/${req.file.filename}`);
        next();

    } catch(err) {
        next(err)
    }
};