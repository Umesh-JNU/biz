const { DataTypes } = require("sequelize");
const { db } = require("../../config/database");

const enquiryModel = db.define("Enquiry", {
  is_wishlist: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, { timestamps: true });

module.exports = enquiryModel;
