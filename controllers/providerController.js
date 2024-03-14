const { providerModel } = require("../models/providerModel");
const { serviceModel, category } = require("../models/serviceModel");
const catchAsyncError = require("../utils/catchAsyncError");
const { s3UploadMulti, s3Uploadv2 } = require("../utils/s3");
const { otpModel } = require("../models/userModel");
const generateOTP = require("../utils/otpGenerator");
const sendEmail = require("../utils/sendEmail");
const ErrorHandler = require("../utils/errorHandler");

exports.register = catchAsyncError(async (req, res, next) => {
  const { service } = req.body;
  const imageFile = req.files["image"][0];
  const pdfFile = req.files["pdf"][0];
  if (!imageFile || !pdfFile) {
    return next(new ErrorHandler("Image or pdf files are missing", 400));
  }
  const result = await s3UploadMulti([imageFile, pdfFile]);
  const urls = result.map((file) => file.Location);
  let provider;
  const prevPro = await providerModel.findOne({
    where: { email: req.body.email },
  });

  if (prevPro && !prevPro?.isVerified) {
    console.log("coming here line 32");
    await prevPro.update();
    provider = prevPro;
  } else {
    console.log("in else");
    provider = await providerModel.create({
      ...req.body,
      profileImage: urls[0],
      document: urls[1],
    });
  }

  const serviceData = await serviceModel.findOne({ where: { id: service } });
  await provider.setService(serviceData);
  const otp = generateOTP();

  await otpModel.create({ otp, providerId: provider.id });

  const message = `<html lang="en">
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

  try {
    await sendEmail({
      email: provider.email,
      subject: "Verify Registration Otp",
      message,
    });

    res.status(200).json({ message: "OTP sent to your email successfully" });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.verifyRegisterOTP = catchAsyncError(async (req, res, next) => {
  const { otp, email } = req.body;
  if (!otp || !email) {
    return next(new ErrorHandler("Missing OTP or email", 400));
  }

  const otpInstance = await otpModel.findOne({ where: { otp } });
  const provider = await providerModel.findOne({ where: { email: email } });

  if (!provider) {
    return next(new ErrorHandler("Provider with this email not found", 404));
  }

  if (!otpInstance || !otpInstance.isValid()) {
    if (otpInstance) {
      await otpModel.destroy({ where: { id: otpInstance.id } });
      await providerModel.destroy({ where: { email: email } });
    }
    return next(new ErrorHandler("OTP is invalid or has been expired.", 400));
  }
  provider.isVerified = true;
  await provider.save();

  await otpModel.destroy({ where: { id: otpInstance.id } });

  // await sendData(user, 201, res);
  const token = provider.getJWTToken();
  res.status(200).json({ success: true, provider, token });
});

exports.login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Enter Email and Password"));
  }
  const provider = await providerModel.findOne({ where: { email } });

  if (!provider) {
    return next(new ErrorHandler("User not found"));
  }
  const isPasswordMatched = await provider.comparePassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password!", 401));

  const token = provider.getJWTToken();
  const data = await providerModel.findByPk(provider.id);

  res.status(200).json({ success: true, data, token });
});

exports.getProfile = catchAsyncError(async (req, res, next) => {
  const { userId } = req;

  const provider = await providerModel.findByPk(userId, {
    attributes: [
      "fullname",
      "email",
      "mobile_no",
      "buisness_location",
      "buisness_name",
      "document",
      "country_code",
      "profileImage",
    ],
  });
  res.status(200).json({ success: true, provider });
});

exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  console.log("forgot password", req.body.email);
  if (!req.body.email) {
    return next(new ErrorHandler("Please provide a valid email.", 400));
  }

  const provider = await providerModel.findOne({
    where: { email: req.body.email },
  });
  if (!provider) {
    return next(new ErrorHandler("Provider not found", 404));
  }

  // get resetPassword OTP
  const otp = generateOTP();
  await otpModel.create({
    otp: otp,
    providerId: provider.id,
  });

  const message = `<b>Your password reset OTP is :- <h2>${otp}</h2></b><div>If you have not requested this email then, please ignore it.</div>`;

  try {
    await sendEmail({
      email: provider.email,
      subject: `Password Reset`,
      message,
    });

    res
      .status(200)
      .json({ success: true, message: `OTP sent to ${provider.email}` });
  } catch (error) {
    await otpModel.destroy({
      where: { otp: user.dataValues.id, userId: user.dataValues.id },
    });
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.changePassword = catchAsyncError(async (req, res, next) => {
  console.log(req.body);
  const providerId = req.userId || req.body.providerId;
  const { password, confirmPassword } = req.body;
  if (!password || !confirmPassword) {
    return next(new ErrorHandler("Please enter required fields"));
  }
  if (password != confirmPassword) {
    return next(new ErrorHandler("Passwords do not match"));
  }
  const users = await providerModel.findOne({
    where: { id: providerId },
    raw: false,
  });
  users.password = password;
  await users.save();
  res.status(200).json({ message: "password updated" });
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
    providerId: otpInstance.providerId,
  });
});

exports.updateProfile = catchAsyncError(async (req, res, next) => {
  console.log("Update provider", req.body);
  const { userId } = req;
  console.log(userId);
  console.log(req.userId);
  const provider_check = await providerModel.findByPk(userId);
  let imageUrl;
  req.file && (imageUrl = await s3Uploadv2(req.file));
  if (!provider_check) {
    return next(new ErrorHandler("Provider do not exist"));
  } else {
    imageUrl
      ? await providerModel.update(
          { ...req.body, profileImage: imageUrl.Location },
          { where: { id: userId } }
        )
      : await providerModel.update({ ...req.body }, { where: { id: userId } });
    res.status(200).json({ message: "Updated" });
  }
});

exports.deleteAccount = catchAsyncError(async (req, res, next) => {
  await providerModel.destroy({ where: { id: req.params.providerId } });
  res
    .status(200)
    .json({ success: true, message: "Provider destroyed successfully" });
});
