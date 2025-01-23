const { v4: uuidv4 } = require("uuid");
const sendGridMail = require("@sendgrid/mail");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { sendVerificationEmail } = require("../utils/sendGrid");

sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);

// User registration logic
const registerUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = uuidv4();

    // Create new user with hashed password and verification token
    const newUser = new User({
      email,
      password: hashedPassword,
      verificationToken,
    });

    // Save the new user to the database
    await newUser.save();

    // Send verification email with the verification URL
    const verificationUrl = `${process.env.BASE_URL}/users/verify/${verificationToken}`;
    await sendVerificationEmail(newUser.email, verificationUrl);

    // Respond with a success message
    res.status(201).json({ message: "User created, verification email sent" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// User login logic
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id }, config.jwtSecret, {
      expiresIn: "1h",
    });

    // Respond with the token
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// User logout logic
const logoutUser = async (req, res) => {
  try {
    // Clear the token from the logged-in user's data
    const user = req.user;
    user.token = null;
    await user.save();
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { registerUser, loginUser, logoutUser };
