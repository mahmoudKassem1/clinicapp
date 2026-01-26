const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Dr. Ellakany App <noreply@drellakany.com>',
    to: options.email,
    subject: options.subject,
    // CHANGE: Use 'html' instead of 'text'
    html: options.message, 
    // OPTIONAL: Keep 'text' as a backup for old email clients that don't support HTML
    text: options.message.replace(/<[^>]*>?/gm, '') // Strips HTML tags for plain text version
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;