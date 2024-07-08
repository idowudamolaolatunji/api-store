
async function verifyPayment(reference) {
    try {
        const headers = {
            'Authorization': 'Bearer ' + process.env.PAYSTACK_SECRET_KEY,
        };
       
        const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`,
            { method: 'GET', headers }
        );
        const data = await res.json();

        if (data?.data?.status !== "success") {
            res.status(400).json({
                message: "Unable to Verify Payment"
            });
        }
        return data;
    } catch(err) {
        return err;
    }
}


module.exports = verifyPayment;