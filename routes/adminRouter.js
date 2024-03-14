var express = require("express");
var router = express.Router();
const { auth } = require("../middlewares/auth");
const { getAll, verifyProvider } = require("../controllers/adminController");

// const adminCheck=authRole("admin")
router.post("/getallUsers", auth, getAll);
router.patch("/verify-provider", auth, verifyProvider);
module.exports = router;
