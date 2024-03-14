const app = require("./app");
const { connectDatabase } = require("./config/config")


process.on("uncaughtException", (err) => {
  console.log(err);
  // process.exit(0);
});

// connecting database
connectDatabase();

// creating server
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log("app is listening on ", port);
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  // server.close(() => process.exit(0));
});
