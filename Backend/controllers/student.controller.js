const bcrypt = require("bcrypt");
const User = require("../models/User.model");
const { sendEmail } = require("../services/nodemailer");
const Material = require("../models/Material.model");

// Student registration
async function createStudentAccount(req, res) {
  try {
    const { name, email, password, course, studentId, semester, faculty } =
      req.body;

    // Validation
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ error: "Please provide a valid email address" });
    }

    // Password strength validation
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
    const hash = await bcrypt.hash(password, rounds);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hash,
      course: course?.trim() || "",
      studentId: studentId?.trim() || "",
      semester: semester?.trim() || "",
      faculty: faculty?.trim() || "",
      role: "student",
    });

    // Send welcome email
    const welcomeSubject = "Welcome to SSchool - Student Account Created";
    const welcomeMessage = `Dear ${user.name},

Welcome to SSchool! Your student account has been successfully created.

Account Details:
- Name: ${user.name}
- Email: ${user.email}
- Role: Student
${user.course ? `- Course: ${user.course}` : ""}
${user.faculty ? `- Faculty: ${user.faculty}` : ""}
${user.studentId ? `- Student ID: ${user.studentId}` : ""}
${user.semester ? `- Semester: ${user.semester}` : ""}

You can now login to your student dashboard and start using the platform.

Best regards,
SSchool Team
Developer: kunlexlatest@gmail.com`;

    await sendEmail(user.email, welcomeSubject, welcomeMessage);

    const safe = user.toObject();
    delete safe.password;

    res
      .status(201)
      .json({ message: "Student account created successfully", user: safe });
  } catch (err) {
    console.error("Create student error:", err);

    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already exists" });
    }

    res
      .status(500)
      .json({ error: "Server error while creating student account" });
  }
}

async function getOwnProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User profile not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Server error while fetching profile" });
  }
}

async function updateOwnProfile(req, res) {
  try {
    const { name, course, studentId, semester, faculty, password } = req.body;
    const updates = {};

    // Build updates object (cannot change email or role)
    if (name) updates.name = name.trim();
    if (course !== undefined) updates.course = course.trim();
    if (studentId !== undefined) updates.studentId = studentId.trim();
    if (semester !== undefined) updates.semester = semester.trim();
    if (faculty !== undefined) updates.faculty = faculty.trim();

    // Hash password if provided
    if (password) {
      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters long" });
      }
      const rounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
      updates.password = await bcrypt.hash(password, rounds);
    }

    const updated = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send profile update email
    const updateSubject = "SSchool - Profile Updated";
    const updateMessage = `Dear ${updated.name},

Your profile has been successfully updated.

Updated Information:
- Name: ${updated.name}
- Email: ${updated.email}
${updated.course ? `- Course: ${updated.course}` : ""}
${updated.faculty ? `- Faculty: ${updated.faculty}` : ""}
${updated.studentId ? `- Student ID: ${updated.studentId}` : ""}
${updated.semester ? `- Semester: ${updated.semester}` : ""}

If you did not make these changes, please contact support immediately.

Best regards,
SSchool Team
Developer: kunlexlatest@gmail.com`;

    await sendEmail(updated.email, updateSubject, updateMessage);

    res.json({ message: "Profile updated successfully", user: updated });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Server error while updating profile" });
  }
}

async function addMaterial(req, res) {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const material = await Material.create({
      userId: req.user.id,
      title: title.trim(),
      content: content.trim(),
    });

    const populatedMaterial = await Material.findById(material._id).populate(
      "userId",
      "name email"
    );

    // Send material added email
    const materialSubject = "SSchool - New Study Material Added";
    const materialMessage = `Dear ${req.user.name},

You have successfully added a new study material.

Material Details:
- Title: ${material.title}
- Content Preview: ${material.content.substring(0, 200)}${
      material.content.length > 200 ? "..." : ""
    }
- Added on: ${new Date(material.createdAt).toLocaleDateString()}

You can access this material anytime from your student dashboard.

Best regards,
SSchool Team
Developer: kunlexlatest@gmail.com`;

    await sendEmail(req.user.email, materialSubject, materialMessage);

    res.status(201).json({
      message: "Material added successfully",
      material: populatedMaterial,
    });
  } catch (err) {
    console.error("Add material error:", err);
    res.status(500).json({ error: "Server error while adding material" });
  }
}

async function getOwnMaterials(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;

    const materials = await Material.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Material.countDocuments({ userId: req.user.id });

    res.json({
      materials,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (err) {
    console.error("Get materials error:", err);
    res.status(500).json({ error: "Server error while fetching materials" });
  }
}

module.exports = {
  createStudentAccount,
  getOwnProfile,
  updateOwnProfile,
  addMaterial,
  getOwnMaterials,
};
