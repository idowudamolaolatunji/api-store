const nodemailer = require('nodemailer');


//////////////////////////////////////////////
//// EMAIL SENDING CONFIGRATIONS ////
//////////////////////////////////////////////
async function sendEmail({ email, subject, message }) {
    try {
        // CREATE A TRANSPORTER
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure: false,
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // DEFINE EMAIL OPTIONS
        const mailOptions = {
            from: 'support@getgifta.com',
            to: email,
            subject,
            html: message
        };

        // NOW SEND THE EMAIL
       const data = await transporter.sendMail(mailOptions);
       console.log('Email sent successfully!', data);

    } catch (err) {
        console.log('Error sending email:', err);
    }
};


//////////////////////////////////////////////
//// EXPORT EMAIL CONFIG ////
//////////////////////////////////////////////
module.exports = sendEmail;