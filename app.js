const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middlewares/error");
const dotenv = require("dotenv");
const app = express();

// const path = "./config/local.env";
const path = "./config/config.env";
dotenv.config({ path });

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    credentials: true,
  })
);

const { userRoute, providerRoute, categoryRoute, serviceRoute, adminRoute, albumRoute, contentRoute, bannerRoute } = require('./src');

app.get("/", (req, res, next) => res.json({ message: "Server is running" }));

app.use("/api/users", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/album", albumRoute);
app.use("/api/banner", bannerRoute);
app.use("/api/content", contentRoute);
app.use("/api/service", serviceRoute);
app.use("/api/category", categoryRoute);
app.use("/api/providers", providerRoute);

app.all("*", async (req, res) => {
  res.status(404).json({
    error: {
      message: "Not Found. Kindly Check the API path as well as request type",
    },
  });
});

app.use(errorMiddleware);

module.exports = app;
