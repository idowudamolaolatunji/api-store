const verifyPayment = require("./verifyPayment");


//////////////////////////////////////////////////
//// PAYMENT HELPER FUNCTION ////
//////////////////////////////////////////////////
exports.paymentResponse = async function(_, res, reference, charges) {
	// GET THE RESPONSE DATA
	const paymentVerification = await verifyPayment(reference);
	const response = paymentVerification.data;
	const amount = (Number(response.amount) / 100) - charges;

	// HANDLE PAYMENT VERIFICATION STATUS
	if (!paymentVerification.status) {
		return res.status(400).json({
			status: "fail",
			message: "Unable to verify payment",
		});
	}

	return amount;
}


//////////////////////////////////////////////////
//// NUMBER / CURRENCY HELPER FUNCTION ////
//////////////////////////////////////////////////
exports.numberConverter = function(curr='', amount, dec=0) {
	return curr + Number(amount).toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


//////////////////////////////////////////////////
//// ORDERID GENERATION HELPER FUNCTION ////
//////////////////////////////////////////////////
exports.generateOrderId = function () {
    return `#${Math.trunc(Math.random() * 1000000)}`;
}