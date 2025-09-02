const express = require("express");
const auth = require("../middleware/auth");
const { allowRoles } = require("../middleware/rbac");
const { 
  createStudentAccount, 
  getOwnProfile, 
  updateOwnProfile, 
  addMaterial,
  getOwnMaterials 
} = require("../controllers/student.controller");
const { listBooks, getBookById } = require("../controllers/book.controller");

const router = express.Router();

router.post("/register", createStudentAccount);


router.use(auth, allowRoles("student"));

router.get("/profile", getOwnProfile);
router.put("/profile", updateOwnProfile);
router.post("/materials", addMaterial);
router.get("/materials", getOwnMaterials);
router.get("/books", listBooks);
router.get("/books/:id", getBookById);

module.exports = router;