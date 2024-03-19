const { DataTypes } = require("sequelize");
const { db } = require("../../config/database");

const videoModel = db.define("IntroVideo", {
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: "Url for video is required" },
      notEmpty: { msg: "Url for video is required" }
    }
  }
}, { timestamps: true, });

const postModel = db.define("Post", {
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: "Url for post is required" },
      notEmpty: { msg: "Url for post is required" }
    }
  }
}, { timestamps: true });

module.exports = { postModel, videoModel };