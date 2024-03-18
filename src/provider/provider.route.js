var express = require("express");
var router = express.Router();
const { auth, onlyProvider } = require("../../middlewares/auth");

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
  reUpload,
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
router.get("/profile", auth, onlyProvider, getProfile);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.put("/update-password", auth, onlyProvider, changePassword);
router.put("/reset-password", changePassword);
router.put("/profile", auth, onlyProvider, upload.single("image"), updateProfile);
router.put("/re-upload", auth, onlyProvider, upload.single("pdf"), reUpload);
router.delete("/delete", auth, onlyProvider, deleteAccount);

module.exports = router;
