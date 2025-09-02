// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const connectDB = require("./config/db");
//   const bookroutes = require("./routes/book.routes");

// dotenv.config();
// connectDB();

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Test each route file one by one
// console.log("Loading auth routes...");
// try {
//   const authroutes = require("./routes/auth.routes");
//   app.use('/api/auth', authroutes);
//   console.log("✅ Auth routes loaded successfully");
// } catch (error) {
//   console.log("❌ Error in auth routes:", error.message);
// }

// console.log("Loading student routes...");
// try {
//   const studentroutes = require("./routes/student.routes");
//   app.use('/api/students', studentroutes);
//   console.log("✅ Student routes loaded successfully");
// } catch (error) {
//   console.log("❌ Error in student routes:", error.message);
// }

// console.log("Loading admin routes...");
// try {
//   const adminroutes = require("./routes/admin.routes");
//   app.use('/api/admin', adminroutes);
//   console.log("✅ Admin routes loaded successfully");
// } catch (error) {
//   console.log("❌ Error in admin routes:", error.message);
// }


//   app.use('/api/books', bookroutes);
  
// app.get("/", (req, res) => res.json({ message: "SSchool API running" }));

// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () =>
//   console.log(`Server running on http://localhost:${PORT}`)
// );

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test each route file one by one
console.log("Loading auth routes...");
try {
  const authroutes = require("./routes/auth.routes");
  app.use('/api/auth', authroutes);
  console.log("✅ Auth routes loaded successfully");
} catch (error) {
  console.log("❌ Error in auth routes:", error.message);
  process.exit(1);
}

console.log("Loading student routes...");
try {
  const studentroutes = require("./routes/student.routes");
  app.use('/api/students', studentroutes);
  console.log("✅ Student routes loaded successfully");
} catch (error) {
  console.log("❌ Error in student routes:", error.message);
  process.exit(1);
}

console.log("Loading admin routes...");
try {
  const adminroutes = require("./routes/admin.routes");
  app.use('/api/admin', adminroutes);
  console.log("✅ Admin routes loaded successfully");
} catch (error) {
  console.log("❌ Error in admin routes:", error.message);
  process.exit(1);
}

console.log("Loading book routes...");
try {
  const bookroutes = require("./routes/book.routes");
  app.use('/api/books', bookroutes);
  console.log("✅ Book routes loaded successfully");
} catch (error) {
  console.log("❌ Error in book routes:", error.message);
  process.exit(1);
}

app.get("/", (req, res) => res.json({ message: "SSchool API running" }));

const PORT = process.env.PORT ;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);