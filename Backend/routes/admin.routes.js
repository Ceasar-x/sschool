const express = require("express");
const auth = require("../middleware/auth");
const { allowRoles } = require("../middleware/rbac");
const {
  createAdmin,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats
} = require("../controllers/admin.controller");
const {
  listBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  totalBooks
} = require("../controllers/book.controller");

const router = express.Router();


router.use(auth, allowRoles("admin"));

router.post("/create-admin", createAdmin);


router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/dashboard/stats", getDashboardStats);
router.get("/books", listBooks);
router.get("/books/:id", getBookById);
router.post("/books", createBook);
router.put("/books/:id", updateBook);
router.delete("/books/:id", deleteBook);
router.get("/books/stats/total", totalBooks);

module.exports = router;