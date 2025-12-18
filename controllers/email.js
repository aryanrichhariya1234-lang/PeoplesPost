import nodemailer from 'nodemailer';
export const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const mailOptions = {
    from: 'Aryan Richhariya <aryan@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    url: options.link,
  };
  transporter.sendMail(mailOptions);
};
