const express = require("express");
const {
  getAllBanner,
  getBanner,
} = require("./banner.controller");
const router = express.Router();

router.get("/", getAllBanner);
router.get("/:id", getBanner);

module.exports = router;
