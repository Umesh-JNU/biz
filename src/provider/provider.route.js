var express = require("express");
var router = express.Router();
const { auth } = require("../../middlewares/auth");

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
  resendOTP,
} = require("./provider.controller");

const { upload } = require("../../utils/s3");
const uploadFiles = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "pdf", maxCount: 1 },
]);

router.post("/register", uploadFiles, register);
router.post("/verify-registerOtp", verifyRegisterOTP);
router.post("/login", login);
router.put("/resend-otp", resendOTP);
router.get("/profile", auth, getProfile);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.put("/update-password", auth, changePassword);
router.put("/reset-password", changePassword);
router.put("/profile", upload.single("image"), auth, updateProfile);
router.delete("/delete/:providerId", auth, deleteAccount);
module.exports = router;
