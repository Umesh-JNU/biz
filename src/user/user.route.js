const express = require("express");
const router = express.Router();
const { auth, authRole } = require("../../middlewares/auth");
const {
  register,
  login,
  forgotPassword,
  verifyOTP,
  updatepassword,
  verifyRegisterOTP,
  addWishList,
  getAllWishList,
  deleteWishList,
  updateUserData,
  getProfile,
  getAlluser,
  deleteAccount,
  resendOTP,
  createEnquiry,
  getAllEnquiry
} = require("./user.controller");
const { upload } = require("../../utils/s3");

router.post("/register", upload.single("image"), register);
router.post("/verify-registerOtp", verifyRegisterOTP);
router.post("/login", login);
router.put("/resend-otp", resendOTP);
router.post("/forgotpassword", forgotPassword);
router.post("/verifyOTP", verifyOTP);
router.post("/updatepassword/:id", updatepassword);
router.get("/get", getAlluser);
router
  .route("/profile")
  .get(auth, getProfile)
  .patch(auth, upload.single("image"), updateUserData);

router.delete("/delete", auth, deleteAccount);

// enquiry
router.route("/enquiry")
  .post(auth, createEnquiry)
  .get(auth, getAllEnquiry);

// wishlist
router.route("/wishlist")
  .post(auth, addWishList)
  .get(auth, getAllWishList);
router.delete("/wishlist/:id", auth, deleteWishList);


module.exports = router;
