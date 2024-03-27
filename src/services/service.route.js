const express = require("express");
const categoryRoute = express.Router();
const serviceRoute = express.Router();

const { auth } = require("../../middlewares/auth");

const { getServicesWithCategory, getServiceAndProviders, getProviderDetails, getCategoryWithService } = require("./service.controller");

categoryRoute.get("/", getCategoryWithService);

serviceRoute.get("/", getServicesWithCategory);
serviceRoute.get("/provider-details/:providerId", auth, getProviderDetails);
serviceRoute.get("/:id", auth, getServiceAndProviders);

module.exports = { categoryRoute, serviceRoute };
