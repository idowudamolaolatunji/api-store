const path = require('path');

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

//////////////////////////////////////////////
//////////////////////////////////////////////
const app = express();
const userRouter = require('./routes/userRoute');
const productRouter = require('./routes/productRoute');
const orderRouter = require('./routes/orderRoute');
const wishItemRouter = require('./routes/wishItemRoute');
const transactionRouter = require('./routes/transactionRoute');

//////////////////////////////////////////////
//////////////////////////////////////////////


//////////////////////////////////////////////
//// MIDDLEWARES ////
//////////////////////////////////////////////

// MORGAN REQUEST MIDDLEWARE
app.use(morgan("dev"));

// EXPRESS BODY PARSER
app.use(express.json({ limit: "10mb" }));

// COOKIE PARSER
app.use(cookieParser());

// CORS
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "https://www.luxewares.ng"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// RATE LIMITING
// const limiter = rateLimit({
//     max: 100,
//     windowMs: 60 * 60 * 1000,
//     message: 'Too many request from this IP, please try again in an hour!'
// })
// app.use('/', limiter);

// DATA SANITIZATION (AGAINST NOSQL QUERY INJECTION)
app.use(mongoSanitize());

// DATA SANITIZATION (AGAINST XSS)
app.use(xss());

// SET SECURITY HEADERS WITH HELMET
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));


// REQUEST MIDDLEWARE
app.use(function (_, _, next) {
	console.log("Fetching Data..");
	next();
});

// STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

//////////////////////////////////////////////
//// MOUNTING ROUTES ////
//////////////////////////////////////////////
app.use('/api/users', userRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.use('/api/wishitems', wishItemRouter);
app.use('/api/transactions', transactionRouter);


module.exports = app;
