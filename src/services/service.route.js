var express = require("express");
var categoryRoute = express.Router();
var serviceRoute = express.Router();

const { auth } = require("../../middlewares/auth");

const { getAllService, getAllCategory } = require("./service.controller");

categoryRoute.get("/", getAllCategory);

serviceRoute.get("/", getAllService);

module.exports = { categoryRoute, serviceRoute };
