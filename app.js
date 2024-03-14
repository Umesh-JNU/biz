const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middlewares/error");
const dotenv = require("dotenv");
const app = express();

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

var userRouter = require("./routes/userRouter");
var serviceRouter = require("./routes/serviceRouter");
var adminRouter = require("./routes/adminRouter");
var providerRouter = require("./routes/providerRouter");

app.get("/", (req, res, next) => res.json({ message: "Server is running" }));

app.use("/api/users", userRouter);
app.use("/api/service", serviceRouter);
app.use("/api/admin", adminRouter);
app.use("/api/providers", providerRouter);

app.all("*", async (req, res) => {
  res.status(404).json({
    error: {
      message: "Not Found. Kindly Check the API path as well as request type",
    },
  });
});

app.use(errorMiddleware);

module.exports = app;
