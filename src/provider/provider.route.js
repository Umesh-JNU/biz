const express = require("express");
const router = express.Router();
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
  updateAvailability,
  getAvailability,
  disableAvailability,
  createProService,
  getProServices,
  updateProService,
  deleteProService,
  getSelectedCategory,
  updateMyCategory
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

// timing api
router.put("/update-avail", auth, onlyProvider, updateAvailability);
router.get("/timing", auth, onlyProvider, getAvailability);
router.put("/disable-avail", auth, onlyProvider, disableAvailability);

// services api
router.route("/service")
  .post(auth, onlyProvider, createProService)
  .get(auth, onlyProvider, getProServices);
router.route("/service/:id")
  .put(auth, onlyProvider, updateProService)
  .delete(auth, onlyProvider, deleteProService);

// category
router.route("/category")
  .get(auth, onlyProvider, getSelectedCategory)
  .put(auth, onlyProvider, updateMyCategory);

module.exports = router;
