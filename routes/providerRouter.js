const {
  register,
  login,
  getProfile,
  verifyRegisterOTP,
  forgotPassword,
  verifyOTP,
  changePassword,
  updateProfile,
  deleteAccount,
} = require("../controllers/providerController");
const { auth } = require("../middlewares/auth");
const { upload } = require("../utils/s3");
var express = require("express");
var router = express.Router();
const uploadFiles = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "pdf", maxCount: 1 },
]);

router.post("/register", uploadFiles, register);
router.post("/verify-registerOtp", verifyRegisterOTP);
router.post("/login", login);
router.get("/profile", auth, getProfile);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.put("/update-password", auth, changePassword);
router.put("/reset-password", changePassword);
router.put("/profile", upload.single("image"), auth, updateProfile);
router.delete("/delete/:providerId", auth, deleteAccount);
module.exports = router;
