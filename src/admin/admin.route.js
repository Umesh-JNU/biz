var express = require("express");
var router = express.Router();
const { auth, onlyAdmin } = require("../../middlewares/auth");

// ----------------------------   ADMIN  ----------------------------
const { setAdmin, login } = require("./admin.controller");

router.put("/", setAdmin);
router.post("/login", login);

// ---------------------------- PROVIDER ----------------------------
const { verifyProvider, getAllProvider, getProvider, updateProvider, deleteProvider } = require("../provider/provider.controller");

router.get("/provider", auth, onlyAdmin, getAllProvider);
router.put("provider/verify", auth, onlyAdmin, verifyProvider);
router.route("/provider/:id")
  .get(auth, onlyAdmin, getProvider)
  .put(auth, onlyAdmin, updateProvider)
  .delete(auth, onlyAdmin, deleteProvider);

// ----------------------------   USER   ----------------------------
const { getAllUser, getUser, updateUser, deleteUser } = require("../user/user.controller");

router.get("/user", auth, onlyAdmin, getAllUser);
router.route("/user/:id")
  .get(auth, onlyAdmin, getUser)
  .put(auth, onlyAdmin, updateUser)
  .delete(auth, onlyAdmin, deleteUser);

// ----------------------------  SERIVCE ----------------------------
const { createService, getAllService, getService, updateService, deleteService, createCategory, getAllCategory, getCategory, updateCategory, deleteCategory } = require("../services/service.controller");

router.post("/service", auth, onlyAdmin, createService);
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

module.exports = router;
