const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const registerUser = async (req, res) => {
  try {
    const { name, email, password, course, studentId, semester, faculty, role } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Check if user exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already exists" });
    }

    // Hash password
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
    const hashed = await bcrypt.hash(password, rounds);

    // Create user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      course: course?.trim() || "",
      studentId: studentId?.trim() || "",
      semester: semester?.trim() || "",
      faculty: faculty?.trim() || "",
      role: role === "admin" ? "admin" : "student",
    });

    await newUser.save();

    // Remove password from response
    const safeUser = newUser.toObject();
    delete safeUser.password;

    res.status(201).json({
      message: "User registered successfully",
      user: safeUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already exists" });
    }
    
    res.status(500).json({ error: "Server error during registration" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Return user info without password
    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      course: user.course,
      studentId: user.studentId,
      semester: user.semester,
      faculty: user.faculty
    };

    res.json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: "Server error during login" });
  }
};

module.exports = { registerUser, loginUser };