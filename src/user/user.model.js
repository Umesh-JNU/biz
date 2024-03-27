const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { DataTypes } = require("sequelize");
const { db } = require("../../config/database");

const validateEmail = (email) => {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

const userModel = db.define("Users", {
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

  fullname: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: "Name is required" },
      notEmpty: { msg: "Name is required" },
    },
  },
  gender: {
    type: DataTypes.ENUM("M", "F"),
    allowNull: false,
    validate: {
      notNull: { msg: "Gender is required" },
      notEmpty: { msg: "Gender is required" },
    },
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  country_code: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: "Country Code is required" },
      notEmpty: { msg: "Country Code is required" },
    },
  },
  role: {
    type: DataTypes.ENUM("User", "Admin"),
    defaultValue: "User",
  },
  profileImage: {
    type: DataTypes.STRING,
    defaultValue: "https://exampleimage.com",
  },
  mobile_no: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isNumeric: true,
      notNull: { msg: "Mobile No. is required" },
      notEmpty: { msg: "Mobile No. is required" }
    },
  },

});

userModel.prototype.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userModel.beforeSave(async (user, options) => {
  // console.log("user", user, user.changed("password"));
  if (user.changed("password")) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

userModel.prototype.getJWTToken = function () {
  return jwt.sign({ userId: this.id }, process.env.JWT_SECRET);
  //   return jwt.sign({ userId: this.id }, process.env.JWT_SECRET, {
  //     expiresIn: process.env.JWT_TOKEN_EXPIRE,
  //   });
};

const otpModel = db.define(
  "OTP",
  {
    otp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: "OTP cannot be null." },
        notEmpty: { msg: "OTP cannot be empty." },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: "Email cannot be null." },
        notEmpty: { msg: "Email cannot be empty." },
      },
    }
  },
  { timestamps: true }
);

otpModel.prototype.isValid = async function (givenOTP) {
  const user = await userModel.findByPk(this.userId);
  if (!user) return false;

  const otpValidityDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
  const currentTime = new Date().getTime();
  const otpCreationTime = new Date(this.createdAt).getTime();

  // Calculate the time difference between current time and OTP creation time
  const timeDifference = currentTime - otpCreationTime;

  // Check if the time difference is within the OTP validity duration
  return timeDifference <= otpValidityDuration;
};

const wishlistModel = db.define("Wishlist", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  is_wishlist: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  indexes: [{
    unique: true,
    fields: ["userId", "providerId", "serviceId"]
  }],
  timestamps: true,
  tableName: "wishlist"
});

module.exports = { userModel, otpModel, wishlistModel };
