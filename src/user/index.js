const { userModel, otpModel, wishlistModel } = require("./user.model")
const userRoute = require("./user.route");

module.exports = { userRoute, userModel, otpModel, wishlistModel };