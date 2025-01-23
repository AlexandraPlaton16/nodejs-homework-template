const sendGridMail = require("@sendgrid/mail");
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendVerificationEmail = async (email, verificationToken) => {
  const verificationUrl = `${process.env.BASE_URL}/users/verify/${verificationToken}`;
  const msg = {
    to: email,
    from: "platonmariaalexandra.com",
    subject: "Email Verification",
    text: `Please verify your email by clicking the following link: ${verificationUrl}`,
  };

  try {
    await sendGridMail.send(msg);
  } catch (err) {
    console.error("Error sending email: ", err);
  }
};

module.exports = { sendVerificationEmail };
