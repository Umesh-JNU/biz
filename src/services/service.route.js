const express = require("express");
const categoryRoute = express.Router();
const serviceRoute = express.Router();

const { auth } = require("../../middlewares/auth");

const { getAllService, getAllCategory, getService } = require("./service.controller");

categoryRoute.get("/", getAllCategory);

serviceRoute.get("/", getAllService);
serviceRoute.get("/:id", auth, getService);

module.exports = { categoryRoute, serviceRoute };
