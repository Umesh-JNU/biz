const express = require("express");
const categoryRoute = express.Router();
const serviceRoute = express.Router();

const { auth } = require("../../middlewares/auth");

const { getAllService, getAllCategory } = require("./service.controller");

categoryRoute.get("/", getAllCategory);

serviceRoute.get("/", getAllService);

module.exports = { categoryRoute, serviceRoute };
