const bcrypt = require("bcryptjs");
const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncError = require("../../utils/catchAsyncError");
const { userModel, otpModel, wishlistModel } = require("./user.model");
const { s3Uploadv2 } = require("../../utils/s3");
const sendEmail = require("../../utils/sendEmail");
const generateOTP = require("../../utils/otpGenerator");
const { serviceModel } = require("../services/service.model");
const { providerModel } = require("../provider/provider.model");

const ROLE = "User";
const getMsg = (otp) => {
  return `<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      /* Add your CSS styles here */
      body {
        font-family: Arial, sans-serif;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f4f4f4;
      }
      h1 {
        color: #333;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Welcome to my Biz Pitch</h1>
      <p>your verification otp is</p><b>${otp}</b>
    </div>
  </body>
  </html>`;
};

const storeOTP = async ({ otp, email, userId }) => {
  console.log({ otp, email, userId });

  const otpInstance = await otpModel.findOne({ where: { email, userId } });
  if (!otpInstance) {
    await otpModel.create({
      otp, email, userId
    });
  } else {
    otpInstance.otp = otp;
    await otpInstance.save();
  }
}

exports.register = catchAsyncError(async (req, res, next) => {
  console.log("register user", req.body);
  const { email, password } = req.body;
  req.body.role = ROLE;
  if (!email || !password) {
    return next(new ErrorHandler("Email and password is required.", 400));
  }

  var user = await userModel.findOne({ where: { email } });
  console.log("isUserEXIST", { user, isVerified: user?.isVerified })
  if (user && user.isVerified) {
    return next(new ErrorHandler("Email is already registered.", 400));
  }

  // file is only uploaded if either 
  // user not verified 
  // or new user
  const file = req.file;
  if (file) {
    const imageUrl = await s3Uploadv2(file);
    req.body.profileImage = imageUrl.Location;
  }

  if (user && !user.isVerified) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(password, salt);

    await userModel.update(req.body, {
      where: {
        id: user.id,
        email
      }
    });
  } else {
    var user = await userModel.create(req.body);
  }

  const otp = generateOTP();
  await storeOTP({ otp, email, userId: user.id });

  try {
    const message = getMsg(otp);
    await sendEmail({
      email: user.email,
      subject: "Verify Registration OTP",
      message,
    });
    res.status(201).json({ message: "OTP sent to your email successfully" });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.verifyRegisterOTP = catchAsyncError(async (req, res, next) => {
  console.log("verifyRegisterOTP", req.body);
  const { otp, email } = req.body;
  if (!otp || !email) {
    return next(new ErrorHandler("Missing OTP or email", 400));
  }
  const user = await userModel.findOne({ where: { email } });
  console.log({ user })
  if (!user)
    return next(
      new ErrorHandler("User not found please check entered email", 404)
    );

  const otpInstance = await otpModel.findOne({ where: { otp, email } });
  if (!otpInstance || !otpInstance.isValid()) {
    if (otpInstance) {
      await otpModel.destroy({ where: { id: otpInstance.id } });
      await userModel.destroy({ where: { email } });
    }
    return next(new ErrorHandler("OTP is invalid or has been expired.", 400));
  }
  user.isVerified = true;
  await user.save();
  await otpModel.destroy({ where: { id: otpInstance.id } });

  // await sendData(user, 201, res);
  const token = user.getJWTToken();
  res.status(200).json({ success: true, user, token });
});

exports.login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Enter Email and Password"));
  }

  const user = await userModel.findOne({ where: { email, role: ROLE } });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (!user.isVerified) {
    return next(new ErrorHandler("Verify OTP.", 403));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password!", 401));

  const token = user.getJWTToken();
  res.status(200).json({ success: true, user, token });
});

exports.resendOTP = catchAsyncError(async (req, res, next) => {
  console.log("resendOTP", req.body);
  const { email } = req.body;
  if (!email) {
    return next(new ErrorHandler("Please enter your email.", 400));
  }

  const user = await userModel.findOne({ where: { email } });
  if (!user) {
    return next(new ErrorHandler("Please register or User doesn't exist.", 400));
  }

  const otp = generateOTP();
  await storeOTP({ otp, email, userId: user.id });

  try {
    const message = getMsg(otp);
    await sendEmail({
      email: email,
      subject: "Resend OTP",
      message,
    });

    res.status(200).json({ message: "OTP sent to your email successfully" });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  console.log("forgot password", req.body);
  const { email } = req.body;
  if (!email) {
    return next(new ErrorHandler("Please provide a valid email.", 400));
  }

  const user = await userModel.findOne({ where: { email } });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // get resetPassword OTP
  const otp = generateOTP();
  await storeOTP({ otp, email, userId: user.id });

  const message = `<b>Your password reset OTP is :- <h2>${otp}</h2></b><div>If you have not requested this email then, please ignore it.</div>`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Password Reset`,
      message,
    });

    res.status(200).json({ message: "OTP email sent" });
  } catch (error) {
    await otpModel.destroy({
      where: { otp, userId: user.id },
    });
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.verifyOTP = catchAsyncError(async (req, res, next) => {
  const { otp } = req.body;
  if (!otp) {
    return next(new ErrorHandler("Missing OTP", 400));
  }
  const otpInstance = await otpModel.findOne({ where: { otp } });

  if (!otpInstance || !otpInstance.isValid()) {
    if (otpInstance) {
      await otpModel.destroy({ where: { id: otpInstance.id } });
    }
    return next(new ErrorHandler("OTP is invalid or has been expired.", 400));
  }

  await otpModel.destroy({ where: { id: otpInstance.id } });

  res.status(200).json({
    message: "OTP verified successfully.",
    userId: otpInstance.userId,
  });
});

exports.updatepassword = catchAsyncError(async (req, res, next) => {
  const { password, confirmPassword } = req.body;
  const { id } = req.params;
  if (!password || !confirmPassword) {
    return next(new ErrorHandler("Please enter required fields"));
  }
  if (password != confirmPassword) {
    return next(new ErrorHandler("Passwords do not match"));
  }
  const users = await userModel.findOne({ where: { id }, raw: false });
  users.password = password;
  await users.save();
  res.status(200).json({ message: "password updated" });
});

exports.getProfile = catchAsyncError(async (req, res, next) => {
  const { userId } = req;
  const user = await userModel.findByPk(userId);
  const {
    fullname,
    email,
    mobile_no,
    profileImage,
    role,
    country_code,
    gender,
  } = user.toJSON();
  res.json({
    success: true,
    data: {
      fullname,
      email,
      mobile_no,
      profileImage,
      role,
      country_code,
      gender,
    },
  });
});

exports.updateUserData = catchAsyncError(async (req, res, next) => {
  const { userId } = req;
  const user_check = await userModel.findByPk(userId);
  let imageUrl;
  req.file && (imageUrl = await s3Uploadv2(req.file));
  if (!user_check) {
    return next(new ErrorHandler("User do not exist"));
  } else {
    imageUrl
      ? await userModel.update(
        { ...req.body, profileImage: imageUrl.Location },
        { where: { id: userId } }
      )
      : await userModel.update({ ...req.body }, { where: { id: userId } });
    res.status(200).json({ message: "Updated" });
  }
});

exports.getAlluser = catchAsyncError(async (req, res, next) => {
  const user = await userModel.findAll();
  res.status(200).json({ user });
});

exports.deleteAccount = catchAsyncError(async (req, res, next) => {
  const { userId } = req;
  const { id } = req.params;

  await userModel.destroy({ where: { id: userId || id } });
  res
    .status(200)
    .json({ success: true, message: "User deleted successfully" });
});

const checkAndCreateRow = async (query) => {
  console.log("checkAndCreateRow", { query });
  let row = await wishlistModel.findOne({ where: query });
  if (!row) {
    row = await wishlistModel.create(query);
  }
  return row;
}

// enquiry
exports.createEnquiry = catchAsyncError(async (req, res, next) => {
  console.log("createEnquiry", req.userId, req.body);
  const { providerId, serviceId } = req.body;
  if (!providerId || !serviceId) {
    return next(new ErrorHandler("Please send provider and service ID", 400));
  }

  const user = await userModel.findByPk(req.userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  await checkAndCreateRow({ userId: user.id, serviceId, providerId });

  res.status(201).json({ message: "Enquiry created successfully" });
});

exports.getAllEnquiry = catchAsyncError(async (req, res, next) => {
  console.log("getAllEnquiry", req.userId);

  const user = await userModel.findByPk(req.userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const enquiries = await user.getWishlists({
    attributes: ["id", "createdAt", "is_wishlist"],
    include: [{
      model: serviceModel,
      attributes: ["id", "title", "image"]
    }, {
      model: providerModel,
      attributes: ["id", "fullname"]
    }]
  });

  res.status(200).json({ enquiries });
});

// wishlist
exports.addWishList = catchAsyncError(async (req, res, next) => {
  console.log("addWishlist", req.body);
  const userId = req.userId;
  const { providerId, serviceId } = req.body;
  if (!providerId || !serviceId) {
    return next(new ErrorHandler("Send provider Id and service Id", 400));
  }

  const user = userModel.findByPk(userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const wishlist = await checkAndCreateRow({
    userId, providerId, serviceId
  });
  if (wishlist && !wishlist.is_wishlist) {
    wishlist.is_wishlist = true;
    await wishlist.save();
  }

  res.status(200).json({ wishlist });
});

exports.getAllWishList = catchAsyncError(async (req, res, next) => {
  console.log("getAllWishList", req.userId);

  const user = await userModel.findByPk(req.userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const wishlists = await user.getWishlists({
    attributes: ["id", "createdAt", "is_wishlist"],
    where: { is_wishlist: true },
    include: [{
      model: serviceModel,
      attributes: ["id", "title", "image"]
    }, {
      model: providerModel,
      attributes: ["id", "fullname"]
    }]
  });

  res.status(200).json({ wishlists });
});

exports.deleteWishList = catchAsyncError(async (req, res, next) => {
  console.log("deleteWishlist", req.params);
  const { id } = req.params;

  const [isDeleted, _] = await wishlistModel.update({ is_wishlist: false }, { where: { id, userId: req.userId, is_wishlist: true } });
  if (isDeleted === 0) {
    return next(new ErrorHandler("Wishlist not found", 404));
  }

  res.status(200).json({ success: true, message: "Wish List Deleted" });
});

// For Admin
exports.getAllUser = catchAsyncError(async (req, res, next) => { });
exports.getUser = catchAsyncError(async (req, res, next) => { });
exports.updateUser = catchAsyncError(async (req, res, next) => { });
exports.deleteUser = catchAsyncError(async (req, res, next) => { });