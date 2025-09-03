const bcrypt = require("bcrypt");
const User = require("../models/User.model");
const Book = require("../models/Book.model");
const { sendEmail } = require("../services/nodemailer");
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

    // Send welcome email to new admin
    const welcomeSubject = "Welcome to SSchool - Admin Account Created";
    const welcomeMessage = `Dear ${admin.name},

Welcome to SSchool! Your admin account has been created by ${req.user.name}.

Account Details:
- Name: ${admin.name}
- Email: ${admin.email}
- Role: Admin
- Course/Department: ${admin.course}
- Faculty: ${admin.faculty}

You can now login to your admin dashboard and start managing the system.

Best regards,
SSchool Team
Developer: kunlexlatest@gmail.com`;

    await sendEmail(admin.email, welcomeSubject, welcomeMessage);

    // Send notification to creating admin
    const notificationSubject = "SSchool - New Admin Account Created";
    const notificationMessage = `Dear ${req.user.name},

You have successfully created a new admin account.

New Admin Details:
- Name: ${admin.name}
- Email: ${admin.email}
- Course/Department: ${admin.course}
- Faculty: ${admin.faculty}
- Created on: ${new Date().toLocaleDateString()}

The new admin has been notified via email.

Best regards,
SSchool Team
Developer: kunlexlatest@gmail.com`;

    await sendEmail(req.user.email, notificationSubject, notificationMessage);

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

    // Send notification emails
    const userUpdateSubject = "SSchool - Your Account Has Been Updated";
    const userUpdateMessage = `Dear ${user.name},

Your account has been updated by an administrator.

Updated Information:
- Name: ${user.name}
- Email: ${user.email}
- Role: ${user.role}
${user.course ? `- Course: ${user.course}` : ''}
${user.faculty ? `- Faculty: ${user.faculty}` : ''}
${user.studentId ? `- Student ID: ${user.studentId}` : ''}
${user.semester ? `- Semester: ${user.semester}` : ''}

If you have any questions about these changes, please contact support.

Best regards,
SSchool Team
Developer: kunlexlatest@gmail.com`;

    await sendEmail(user.email, userUpdateSubject, userUpdateMessage);

    // Send notification to admin
    const adminNotificationSubject = "SSchool - User Account Updated";
    const adminNotificationMessage = `Dear ${req.user.name},

You have successfully updated the account for ${user.name}.

Updated User Details:
- Name: ${user.name}
- Email: ${user.email}
- Role: ${user.role}
${user.course ? `- Course: ${user.course}` : ''}
${user.faculty ? `- Faculty: ${user.faculty}` : ''}
- Updated on: ${new Date().toLocaleDateString()}

The user has been notified of these changes via email.

Best regards,
SSchool Team
Developer: kunlexlatest@gmail.com`;

    await sendEmail(req.user.email, adminNotificationSubject, adminNotificationMessage);

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
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Store user info before deletion
    const deletedUserInfo = {
      name: user.name,
      email: user.email,
      role: user.role,
      course: user.course,
      faculty: user.faculty
    };

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    // Also delete user's materials
    await Material.deleteMany({ userId: req.params.id });

    // Send notification to admin
    const adminNotificationSubject = "SSchool - User Account Deleted";
    const adminNotificationMessage = `Dear ${req.user.name},

You have successfully deleted the account for ${deletedUserInfo.name}.

Deleted User Details:
- Name: ${deletedUserInfo.name}
- Email: ${deletedUserInfo.email}
- Role: ${deletedUserInfo.role}
${deletedUserInfo.course ? `- Course: ${deletedUserInfo.course}` : ''}
${deletedUserInfo.faculty ? `- Faculty: ${deletedUserInfo.faculty}` : ''}
- Deleted on: ${new Date().toLocaleDateString()}

All associated materials have also been removed.

Best regards,
SSchool Team
Developer: kunlexlatest@gmail.com`;

    await sendEmail(req.user.email, adminNotificationSubject, adminNotificationMessage);

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