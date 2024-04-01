const { DataTypes } = require("sequelize");
const { db } = require("../../config/database");

const bannerModel = db.define("Banner", {
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: "Url for banner is required" },
      notEmpty: { msg: "Url for banner is required" }
    }
  }
}, { timestamps: true });

module.exports = bannerModel;