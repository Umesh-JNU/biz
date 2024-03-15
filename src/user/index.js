const { userModel, otpModel } = require("./user.model")
const userRoute = require("./user.route");

module.exports = { userRoute, userModel, otpModel };