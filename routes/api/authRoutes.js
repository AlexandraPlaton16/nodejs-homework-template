const express = require("express");
const router = express.Router();
const User = require("../../models/user");

const { sendVerificationEmail } = require("../../utils/sendGrid");
const { registerUser } = require("../../controllers/authController");

// Route for registering a user
router.post("/register", registerUser);

// Email verification endpoint
router.get("/verify/:verificationToken", async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.verificationToken,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verify) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Update user status to verified and clear the verification token
    user.verify = true;
    user.verificationToken = null;
    await user.save();

    res.status(200).json({ message: "Verification successful" });
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route to resend verification email
router.post("/verify", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Missing required field: email" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verify) {
      return res
        .status(400)
        .json({ message: "Verification has already been completed" });
    }

    // Send the verification email again
    await sendVerificationEmail(user.email, user.verificationToken);
    res.status(200).json({ message: "Verification email sent" });
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
