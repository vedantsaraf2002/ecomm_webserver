const nodemailer = require("nodemailer");

const mailHelper = async (options) => {
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
          user: process.env.SMTP_USER, // generated ethereal user
          pass: process.env.SMTP_PASS, // generated ethereal password
        },
      });

      const message = {
          from: 'vedant@lco.dev',
          to: options.email,
          subject: options.subject,
          text: options.message,
      };

    
      // send mail with defined transport object
      await transporter.sendMail(message);
}

module.exports = mailHelper;