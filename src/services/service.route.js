const express = require("express");
const categoryRoute = express.Router();
const serviceRoute = express.Router();

const { auth } = require("../../middlewares/auth");

const { getServicesWithCategory, getService, getCategoryWithService } = require("./service.controller");

categoryRoute.get("/", getCategoryWithService);

serviceRoute.get("/", getServicesWithCategory);
serviceRoute.get("/:id", auth, getService);

module.exports = { categoryRoute, serviceRoute };
