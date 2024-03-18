const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncError = require("../../utils/catchAsyncError");
const bcrypt = require("bcryptjs");
const { otpModel } = require("../user/user.model");
const { providerModel, proServiceModel } = require("./provider.model");

const { s3UploadMulti, s3Uploadv2 } = require("../../utils/s3");
const sendEmail = require("../../utils/sendEmail");
const generateOTP = require("../../utils/otpGenerator");
const { db } = require("../../config/database");

const ROLE = "Provider";
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
}

exports.register = catchAsyncError(async (req, res, next) => {
  console.log("register provider", req.body);
  const { services, categories, email, password } = req.body;
  req.body.role = ROLE;

  // if (!services || services.length <= 0) {
  //   return next(new ErrorHandler("Please select at least one service", 400));
  // }

  // if (!categories || categories.length <= 0) {
  //   return next(new ErrorHandler("Please select at least one category", 400));
  // }

  const transaction = await db.transaction();
  try {
    var provider = await providerModel.findOne({ where: { email } });
    if (provider && provider.isVerified) {
      return next(new ErrorHandler("Provider with email already registered.", 400));
    }

    // file is only uploaded if either 
    // provider not verified 
    // or new provider
    const imageFile = req.files["image"][0];
    const pdfFile = req.files["pdf"][0];
    if (!imageFile || !pdfFile) {
      return next(new ErrorHandler("Image or pdf files are missing", 400));
    }
    const result = await s3UploadMulti([imageFile, pdfFile]);
    const urls = result.map((file) => file.Location);
    if ((urls && urls.length < 2) || !urls) {
      return next(new ErrorHandler("Something Went Wrong", 500));
    }

    req.body.profileImage = urls[0];
    req.body.document = urls[1];

    if (provider && !provider.isVerified) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(password, salt);

      await providerModel.update(req.body, {
        where: {
          id: provider.id,
          email
        },
        transaction
      });
    } else {
      var provider = await providerModel.create(req.body, { transaction });
    }

    // await provider.addCategories(categories, { transaction });
    // await provider.addServices(services, { transaction });
    // below two line automatically set the latest category / service 
    // await provider.setCategories(categories, { transaction });
    // await provider.setServices(services, { transaction });

    const otp = generateOTP();
    // console.log({ provider, otp })
    await otpModel.create({
      otp,
      email,
      providerId: provider.id,
    }, { transaction });

    const message = getMsg(otp);
    await sendEmail({
      email: provider.email,
      subject: "Verify Registration Otp",
      message,
    });

    await transaction.commit();
    res.status(200).json({ message: "OTP sent to your email successfully" });

  } catch (error) {
    await transaction.rollback();
    return next(new ErrorHandler(error.message, 400));
  }
});

exports.verifyRegisterOTP = catchAsyncError(async (req, res, next) => {
  console.log("verifyRegisterOTP", req.body);
  const { otp, email } = req.body;
  if (!otp || !email) {
    return next(new ErrorHandler("Missing OTP or email", 400));
  }

  const provider = await providerModel.findOne({ where: { email } });
  if (!provider) {
    return next(new ErrorHandler("Provider with this email not found", 404));
  }


  const otpInstance = await otpModel.findOne({ where: { otp, email } });
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

  const provider = await providerModel.findOne({ where: { email, role: ROLE } });
  if (!provider) {
    return next(new ErrorHandler("Provider not found"));
  }

  if (!provider.isVerified) {
    return next(new ErrorHandler("Verify OTP.", 403));
  }

  const isPasswordMatched = await provider.comparePassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password!", 401));

  const token = provider.getJWTToken();
  res.status(200).json({ success: true, provider, token });
});

exports.resendOTP = catchAsyncError(async (req, res, next) => {
  console.log("resendOTP", req.body);
  const { email } = req.body;
  if (!email) {
    return next(new ErrorHandler("Please enter your email.", 400));
  }

  const provider = await providerModel.findOne({ where: { email } });
  if (!provider) {
    return next(new ErrorHandler("Please register or Provider doesn't exist.", 400));
  }


  let otpInstance = await otpModel.findOne({ where: { email, providerId: provider.id } });
  if (!otpInstance) {
    otpInstance = await otpModel.create({
      email, providerId: provider.id, otp
    })
  } else {
    otpInstance.otp = otp;
    await otpInstance.save();
  }

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
  console.log("forgot password", req.body);
  const { email } = req.body;
  if (!email) {
    return next(new ErrorHandler("Please provide a valid email.", 400));
  }

  const provider = await providerModel.findOne({ where: { email } });
  if (!provider) {
    return next(new ErrorHandler("Provider not found", 404));
  }

  // get resetPassword OTP
  const otp = generateOTP();

  let otpInstance = await otpModel.findOne({ where: { email, providerId: provider.id } });
  if (!otpInstance) {
    otpInstance = await otpModel.create({
      email, providerId: provider.id, otp
    })
  } else {
    otpInstance.otp = otp;
    await otpInstance.save();
  }

  const message = `<b>Your password reset OTP is :- <h2>${otp}</h2></b><div>If you have not requested this email then, please ignore it.</div>`;

  try {
    await sendEmail({
      email: provider.email,
      subject: `Password Reset`,
      message,
    });

    res.status(200).json({ success: true, message: `OTP sent to ${provider.email}` });
  } catch (error) {
    await otpModel.destroy({
      where: { otp, providerId: provider.id },
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

  const provider = await providerModel.findByPk(userId);
  if (!provider) {
    return next(new ErrorHandler("Provider do not exist", 404));
  } else {
    if (req.file) {
      const result = await s3Uploadv2(req.file);
      req.body.profileImage = result.Location && result.Location;
    }

    await providerModel.update(req.body, { where: { id: userId } });
    res.status(200).json({ message: "Updated" });
  }
});

exports.reUpload = catchAsyncError(async (req, res, next) => {
  console.log("reUpload", req.body);
  const { userId } = req;
  console.log(userId);

  if (!req.body.mobile_no) {
    return next(new ErrorHandler("Please enter your mobile number", 400));
  }
  if (!req.file) {
    return next(new ErrorHandler("Please upload your document", 400));
  }

  const { mimetype } = req.file;
  // console.log({ mimetype });
  if (mimetype !== "application/pdf") {
    return next(new ErrorHandler("Document must be a pdf", 400));
  }

  // console.log({ file: req.file });
  const provider = await providerModel.findByPk(userId);
  if (!provider) {
    return next(new ErrorHandler("Provider do not exist", 404));
  }

  const result = await s3Uploadv2(req.file);
  req.body.document = result.Location && result.Location;

  await providerModel.update(req.body, { where: { id: userId } });
  res.status(200).json({ message: "Updated" });
});

exports.deleteAccount = catchAsyncError(async (req, res, next) => {
  const { userId } = req;
  const { id } = req.params;

  await providerModel.destroy({ where: { id: userId || id } });
  res
    .status(200)
    .json({ success: true, message: "Provider deleted successfully" });
});

// For Admin
exports.verifyProvider = catchAsyncError(async (req, res, next) => { });
exports.getAllProvider = catchAsyncError(async (req, res, next) => { });
exports.getProvider = catchAsyncError(async (req, res, next) => { });
exports.updateProvider = catchAsyncError(async (req, res, next) => { });
exports.deleteProvider = catchAsyncError(async (req, res, next) => { });