var Sequelize = require("sequelize");
const { DataTypes, Model } = require("sequelize");
const { db } = require("../config/config");

const serviceModel = db.define("Service", {
  location: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  service: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const category = db.define(
  "Category",
  {
    categoryName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);
category.hasMany(serviceModel, { foreignKey: "categoryId" }); // A category has many services
serviceModel.belongsTo(category, { foreignKey: "categoryId" }); // A service belongs to a category

module.exports = { serviceModel, category };
