const { DataTypes } = require("sequelize");
const { db } = require("../../config/database");

const serviceModel = db.define("Service", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      max: {
        args: [100],
        msg: "Title can have maximum 100 characters"
      },
    }
  },
}, { timestamps: true });

const categoryModel = db.define("Category", {
  categoryName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      max: {
        args: [50],
        msg: "Category should have maximum 50 characters"
      }
    }
  },
}, { timestamps: true });

module.exports = { serviceModel, categoryModel };
