const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const { sendVerificationEmail } = require("../../utils/sendGrid");
const router = express.Router();

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

    // Resend verification email
    const verificationUrl = `${process.env.BASE_URL}/users/verify/${user.verificationToken}`;
    await sendVerificationEmail(user.email, verificationUrl);

    res.status(200).json({ message: "Verification email sent" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Signup Route
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      subscription: "starter",
    });

    await user.save();

    // Send verification email after user is created
    const verificationUrl = `${process.env.BASE_URL}/users/verify/${user.verificationToken}`;
    await sendVerificationEmail(user.email, verificationUrl);

    res.status(201).json({
      token: null,
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    // Ensure user is verified before logging in
    if (!user.verify) {
      return res.status(400).json({ message: "Email not verified" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Health check or testing route
router.get("/", (req, res) => {
  res.json({ message: "User routes are working!" });
});

module.exports = router;
