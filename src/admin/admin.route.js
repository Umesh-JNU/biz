const express = require("express");
const router = express.Router();
const { auth, onlyAdmin } = require("../../middlewares/auth");
const { upload } = require("../../utils/s3");

// ----------------------------   ADMIN  ----------------------------
const { setAdmin, login, postSingleImage } = require("./admin.controller");

router.put("/", setAdmin);
router.post("/login", login);
router.post("/upload", auth, onlyAdmin, upload.single("image"), postSingleImage);

// ---------------------------- PROVIDER ----------------------------
const { verifyProvider, getAllProvider, getProvider, updateProfile, deleteAccount: deleteProvider } = require("../provider/provider.controller");

router.get("/provider", auth, onlyAdmin, getAllProvider);
router.put("provider/verify", auth, onlyAdmin, verifyProvider);
router.route("/provider/:id")
  .get(auth, onlyAdmin, getProvider)
  .put(auth, onlyAdmin, updateProfile)
  .delete(auth, onlyAdmin, deleteProvider);

// ----------------------------   USER   ----------------------------
const { getAllUser, getUser, updateUserData, deleteAccount } = require("../user/user.controller");

router.get("/user", auth, onlyAdmin, getAllUser);
router.route("/user/:id")
  .get(auth, onlyAdmin, getUser)
  .put(auth, onlyAdmin, updateUserData)
  .delete(auth, onlyAdmin, deleteAccount);

// ----------------------------  SERIVCE ----------------------------
const { createService, getAllService, getService, updateService, deleteService, createCategory, getAllCategory, getCategory, updateCategory, deleteCategory } = require("../services/service.controller");

router.post("/service", auth, onlyAdmin, upload.single("image"), createService);
router.get("/service", auth, onlyAdmin, getAllService);
router.route("/service/:id")
  .get(auth, onlyAdmin, getService)
  .put(auth, onlyAdmin, updateService)
  .delete(auth, onlyAdmin, deleteService);

router.post("/category", auth, onlyAdmin, createCategory);
router.get("/category", auth, onlyAdmin, getAllCategory);
router.route("/category/:id")
  .get(auth, onlyAdmin, getCategory)
  .put(auth, onlyAdmin, updateCategory)
  .delete(auth, onlyAdmin, deleteCategory);

// ----------------------------  CONTENT ----------------------------
const { createUpdateContent, getContent, deleteContent } = require("../contents/content.controller");

router.route("/content")
  .get(auth, onlyAdmin, getContent)
  .delete(auth, onlyAdmin, deleteContent)
  .post(auth, onlyAdmin, createUpdateContent);

// ----------------------------  BANNER ----------------------------
const { createBanner, updateBanner, deleteBanner } = require("../banner/banner.controller");
router.post("/banner", auth, onlyAdmin, createBanner);
router
  .route("/banner/:id")
  .put(auth, onlyAdmin, updateBanner)
  .delete(auth, onlyAdmin, deleteBanner);

module.exports = router;
