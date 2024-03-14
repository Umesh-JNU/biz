const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { DataTypes } = require("sequelize");
const { db } = require("../config/config");
const { serviceModel } = require("./serviceModel");
const { otpModel } = require("./userModel");

const validateEmail = (email) => {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

const providerModel = db.define("Providers", {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      args: true,
      msg: "Email address already in use!",
    },
    validate: {
      notNull: { msg: "Email is required" },
      notEmpty: { msg: "Email is required" },
      isEmail: function (value) {
        if (value !== "" && !validateEmail(value)) {
          throw new Error("Invalid email address");
        }
      },
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [8],
        msg: "Password must be at least 8 characters long",
      },
      notNull: { msg: "Password is required" },
      notEmpty: { msg: "Password is required" },
    },
  },
  country_code: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: "Name is required" },
      notEmpty: { msg: "Name is required" },
    },
  },

  fullname: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: "Name is required" },
      notEmpty: { msg: "Name is required" },
    },
  },
  buisness_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: "Name is required" },
      notEmpty: { msg: "Name is required" },
    },
  },
  buisness_location: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: "Location is required" },
      notEmpty: { msg: "Location is required" },
    },
  },
  profileImage: {
    type: DataTypes.STRING,
    defaultValue: "https://exampleimage.com",
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  mobile_no: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isNumeric: true,
    },
  },
  id_no: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isNumeric: true,
      len: {
        args: [10],
        msg: "Mobile number should be at least 10 digits",
      },
    },
  },
  document: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "Document is required" },
      notNull: { msg: "Document is required" },
    },
  },
  role: {
    type: DataTypes.ENUM("Provider"),
    defaultValue: "Provider",
  },
});

providerModel.prototype.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

providerModel.beforeSave(async (user, options) => {
  console.log("user", user, user.changed("password"));
  if (user.changed("password")) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

providerModel.prototype.getJWTToken = function () {
  return jwt.sign({ providerId: this.id }, process.env.JWT_SECRET);
  //   return jwt.sign({ userId: this.id }, process.env.JWT_SECRET, {
  //     expiresIn: process.env.JWT_TOKEN_EXPIRE,
  //   });
};

providerModel.hasOne(serviceModel, { foreignKey: "providerId", as: "service" });
serviceModel.belongsTo(providerModel, {
  foreignKey: "providerId",
  as: "provider",
});

providerModel.hasOne(otpModel, { foreignKey: "providerId", as: "otp" });
otpModel.belongsTo(providerModel, { foreignKey: "providerId", as: "provider" });

module.exports = { providerModel };
