const bcrypt = require("bcrypt");
const User = require("../models/User.model");
const Book = require("../models/Book.model");
const Material = require("../models/Material.model");

// Create admin account with name, email, password, course, faculty
async function createAdmin(req, res) {
  try {
    const { name, email, password, course, faculty } = req.body;

    // Validation
    if (!name || !email || !password || !course || !faculty) {
      return res.status(400).json({ 
        error: "Name, email, password, course, and faculty are required" 
      });
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
    const hashedPassword = await bcrypt.hash(password, rounds);

    // Create admin user
    const admin = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      course: course.trim(),
      faculty: faculty.trim(),
      role: "admin"
    });

    // Remove password from response
    const safeAdmin = admin.toObject();
    delete safeAdmin.password;

    res.status(201).json({
      message: "Admin created successfully",
      user: safeAdmin
    });
  } catch (err) {
    console.error('Create admin error:', err);
    
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already exists" });
    }
    
    res.status(500).json({ error: "Server error while creating admin" });
  }
}

// Get all users
async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const query = {};

    // Filter by role if provided
    if (role && ['student', 'admin'].includes(role)) {
      query.role = role;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { course: { $regex: search, $options: 'i' } },
        { faculty: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: "Server error while fetching users" });
  }
}

// Get user by ID
async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error('Get user by ID error:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    res.status(500).json({ error: "Server error while fetching user" });
  }
}

// Update user
async function updateUser(req, res) {
  try {
    const { name, email, course, studentId, semester, faculty, role, password } = req.body;
    const updates = {};

    // Build updates object
    if (name) updates.name = name.trim();
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Please provide a valid email address" });
      }
      updates.email = email.toLowerCase().trim();
    }
    if (course) updates.course = course.trim();
    if (studentId !== undefined) updates.studentId = studentId.trim();
    if (semester) updates.semester = semester.trim();
    if (faculty) updates.faculty = faculty.trim();
    if (role && ['student', 'admin'].includes(role)) updates.role = role;

    // Hash password if provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      const rounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
      updates.password = await bcrypt.hash(password, rounds);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User updated successfully", user });
  } catch (err) {
    console.error('Update user error:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already exists" });
    }
    
    res.status(500).json({ error: "Server error while updating user" });
  }
}

// Delete user
async function deleteUser(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Also delete user's materials
    await Material.deleteMany({ userId: req.params.id });

    res.json({ message: "User and associated materials deleted successfully" });
  } catch (err) {
    console.error('Delete user error:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    res.status(500).json({ error: "Server error while deleting user" });
  }
}

// Get dashboard statistics
async function getDashboardStats(req, res) {
  try {
    const [
      totalUsers,
      totalStudents,
      totalAdmins,
      totalBooks,
      totalMaterials,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "admin" }),
      Book.countDocuments(),
      Material.countDocuments(),
      User.find().select("-password").sort({ createdAt: -1 }).limit(5)
    ]);

    res.json({
      totalUsers,
      totalStudents,
      totalAdmins,
      totalBooks,
      totalMaterials,
      recentUsers
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: "Server error while fetching dashboard statistics" });
  }
}

module.exports = {
  createAdmin,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats
};