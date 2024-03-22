const { DataTypes } = require("sequelize");
const { db } = require("../../config/database");
const { providerModel } = require("../provider/provider.model");
const { serviceModel } = require("../services/service.model");

const wishlistModel = db.define("Wishlist", {
  provider: {
    type: DataTypes.UUID,
    references: {
      model: providerModel,
      key: 'id'
    }
  },
  service: {
    type: DataTypes.INTEGER,
    references: {
      model: serviceModel,
      key: 'id'
    }
  },
  is_wishlist: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, { timestamps: true });

module.exports = wishlistModel;
