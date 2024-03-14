var express = require("express");
var router = express.Router();
const { auth, onlyAdmin } = require("../middlewares/auth");
const {
  CreateService,
  DeleteService,
  UpdateService,
  getSimilar,
  addCategory,
  serach,
  getAllServices,
  getAllCategory,
} = require("../controllers/serviceController");

router.post("/add", CreateService);
router.delete("/delete/:id", onlyAdmin, DeleteService);
router.patch("/update/:id", UpdateService);
router.get("/:CategoryId/getSimilar", getSimilar);
router.post("/addCategory", addCategory);
router.post("/search", serach);
router.get("/getAllServices", getAllServices);
router.get("/getAllCategories", getAllCategory);

module.exports = router;
