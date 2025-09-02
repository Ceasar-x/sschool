const express = require("express");
const auth = require("../middleware/auth");
const { allowRoles } = require("../middleware/rbac");
const { 
  listBooks, 
  getBookById
} = require("../controllers/book.controller");

const router = express.Router();

router.get("/", listBooks);
router.get("/:id", getBookById);



module.exports = router;