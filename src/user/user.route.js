var express = require("express");
var router = express.Router();
const { auth, authRole } = require("../../middlewares/auth");
const {
  register,
  login,
  BookService,
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
} = require("./user.controller");
const { upload } = require("../../utils/s3");

router.post("/register", upload.single("image"), register);
router.post("/verify-registerOtp", verifyRegisterOTP);
router.post("/login", login);
router.put("/resend-otp", resendOTP);
router.post("/bookservice", auth, BookService);
router.post("/forgotpassword", forgotPassword);
router.post("/verifyOTP", verifyOTP);
router.post("/updatepassword/:id", updatepassword);
router.post("/addWishList", auth, addWishList);
router.get("/getAllWishList", auth, getAllWishList);
router.delete("/deleteWishList/:id", auth, deleteWishList);
router.get("/get", getAlluser);
router
  .route("/profile")
  .get(auth, getProfile)
  .patch(auth, upload.single("image"), updateUserData);

router.delete("/delete/:userId", auth, deleteAccount);

module.exports = router;
