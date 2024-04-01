const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncError = require("../../utils/catchAsyncError");
const bcrypt = require("bcryptjs");
const { serviceModel } = require("../services");
const { otpModel, wishlistModel } = require("../user/user.model");
const { providerModel, proServiceModel, availabilityModel } = require("./provider.model");

const { s3UploadMulti, s3Uploadv2 } = require("../../utils/s3");
const sendEmail = require("../../utils/sendEmail");
const generateOTP = require("../../utils/otpGenerator");
const formattedQuery = require("../../utils/apiFeatures");
const { db } = require("../../config/database");
const { Op } = require("sequelize");
const { videoModel, postModel } = require("../posts/post.model");

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

const storeOTP = async ({ otp, email, providerId }, transaction) => {
  console.log({ otp, email, providerId }, transaction);

  const otpInstance = await otpModel.findOne({ where: { email, providerId } });
  if (!otpInstance) {
    await otpModel.create({
      otp, email, providerId
    }, { transaction });
  } else {
    otpInstance.otp = otp;
    await otpInstance.save({ transaction });
  }
}

exports.register = catchAsyncError(async (req, res, next) => {
  console.log("register provider", req.body);
  const { services, categories, email, password } = req.body;
  req.body.role = ROLE;

  if (!services || services.length <= 0) {
    return next(new ErrorHandler("Please select at least one service", 400));
  }

  if (!categories || categories.length <= 0) {
    return next(new ErrorHandler("Please select at least one category", 400));
  }

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
    await provider.setCategories(categories, { transaction });
    await provider.setServices(services, { transaction });

    const otp = generateOTP();
    await storeOTP({ otp, email, providerId: provider.id }, transaction);

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

  const otp = generateOTP();
  await storeOTP({ otp, email, providerId: provider.id });

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
      "id",
      "fullname",
      "email",
      "mobile_no",
      "buisness_location",
      "buisness_name",
      "document",
      "country_code",
      "profileImage",
      "facebook",
      "instagram",
      "website",
      "onHold",
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
  await storeOTP({ otp, email, providerId: provider.id });

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

  const { mobile_no, country_code } = req.body;
  if (!mobile_no || !country_code) {
    return next(new ErrorHandler("Required mobile number and country code", 400));
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

  const provider = await providerModel.findByPk(id || userId);
  if (!provider) {
    return next(new ErrorHandler("Provider not found", 404));
  }

  await provider.removeCategories();
  await provider.removeServices();
  await provider.removeOwnService();
  await availabilityModel.destroy({ where: { providerId: provider.id } });

  await provider.destroy();
  res.status(200).json({ success: true, message: "Provider deleted successfully" });
});

exports.updateAvailability = catchAsyncError(async (req, res, next) => {
  console.log("updateAvailability", req.body);
  const providerId = req.userId;

  const { timing, avail_type } = req.body;
  if (!avail_type) {
    return next(new ErrorHandler("Please select availability type", 400));
  }

  if (!timing || timing.length === 0) {
    return next(new ErrorHandler("Please select timing for weekdays", 400));
  }

  console.log(typeof timing)
  if (typeof timing !== "object") {
    return next(new ErrorHandler("Timing must be array type", 400));
  }

  const provider = await providerModel.findByPk(providerId);
  if (!provider) {
    return next(new ErrorHandler("Provider not found", 404));
  }

  timing.forEach(time => {
    time.providerId = providerId
  });
  await availabilityModel.destroy({ where: { providerId: provider.id } });
  await availabilityModel.bulkCreate(timing, { validate: true });

  provider.is_avail = true;
  provider.avail_type = avail_type;
  await provider.save();

  res.status(200).json({ success: true, message: "Timing updated successfully" });
});

exports.getAvailability = catchAsyncError(async (req, res, next) => {
  console.log("getAvailabiltiy");
  const userId = req.userId;
  const provider = await providerModel.findByPk(userId);
  if (!provider) {
    return next(new ErrorHandler("Provider not found", 404));
  }

  let timing = await availabilityModel.findAll({
    where: { providerId: provider.id },
    attributes: ["weekday", "from", "to", "is_open"]
  });

  if (!timing || timing.length === 0) {
    const body = [...Array(7).keys()].map((i) => {
      console.log({ i });
      return {
        weekday: `${i}`,
        providerId: provider.id
      };
    });
    timing = await availabilityModel.bulkCreate(body, { validate: true });
  }

  res.status(200).json({
    avail_type: provider.avail_type,
    is_avail: provider.is_avail,
    timing
  });
});

exports.disableAvailability = catchAsyncError(async (req, res, next) => {
  console.log("disableAvailability");
  const userId = req.userId;
  const provider = await providerModel.findByPk(userId);
  if (!provider) {
    return next(new ErrorHandler("Provider not found", 404));
  }

  provider.is_avail = false;
  await provider.save();

  res.status(200).json({ success: true, message: "Availability disabled successfully" });
});

exports.getSelectedCategory = catchAsyncError(async (req, res, next) => {
  console.log("getSelectedCategory", req.userId);
  const provider = await providerModel.findByPk(req.userId);
  if (!provider) {
    return next(new ErrorHandler("Provider not found", 404));
  }

  const myCategory = await provider.getCategories({
    attributes: ["id", "categoryName"],
    joinTableAttributes: []
  });
  res.status(200).json({ myCategory });
});

exports.updateMyCategory = catchAsyncError(async (req, res, next) => {
  console.log("updateMyCategory", req.userId, req.body);
  const provider = await providerModel.findByPk(req.userId);
  if (!provider) {
    return next(new ErrorHandler("Provider not found", 404));
  }

  const { deleteCategory, addCategory } = req.body;
  if (addCategory && (typeof addCategory === 'object') && addCategory.length > 0) {
    await provider.addCategories(addCategory);
  }

  if (deleteCategory && (typeof deleteCategory === 'object') && deleteCategory.length > 0) {
    // fetch all services whose category matches
    var services = await serviceModel.findAll({
      where: { categoryId: deleteCategory }
    });

    // deleting services of provider
    for (let ser of services) {
      // deleting service created by provider
      await proServiceModel.destroy({ where: { serviceId: ser.id, providerId: provider.id } });

      // deleting service selected at the time of register
      await provider.removeService(ser.id);
    }

    // deleting category
    await provider.removeCategories(deleteCategory);
  }

  res.status(200).json({ success: true, messagae: "Category updated successfully" });
});

//  Providers service 
exports.createProService = catchAsyncError(async (req, res, next) => {
  console.log("createProService", req.body);
  const userId = req.userId;

  const provider = await providerModel.findByPk(userId);
  if (!provider) {
    return next(new ErrorHandler("Provider not found", 404));
  }

  await proServiceModel.findOrCreate({ where: { ...req.body, providerId: provider.id } });
  res.status(201).json({ message: "Service create successfully" });
});

exports.getProServices = catchAsyncError(async (req, res, next) => {
  console.log("getProServices", req.body);
  const userId = req.userId;

  const provider = await providerModel.findByPk(userId);
  if (!provider) {
    return next(new ErrorHandler("Provider not found", 404));
  }

  const services = await provider.getOwnService({
    attributes: ["id", "desc", "charge", "serviceId"], include: [{
      model: serviceModel,
      as: "serviceTitle", attributes: ["id", "title"]
    }]
  });
  res.status(200).json({ services });
});

exports.updateProService = catchAsyncError(async (req, res, next) => {
  console.log("updateProServices", req.body);
  const { id } = req.params;

  delete req.body.serviceId;

  const [isUpdated, result] = await proServiceModel.update(req.body, { where: { id }, returning: true });
  if (isUpdated === 0) {
    return next(new ErrorHandler("Something went wrong", 500));
  }
  res.status(200).json({ success: isUpdated === 1, message: "Service updated successfully" });
});

exports.deleteProService = catchAsyncError(async (req, res, next) => {
  console.log("deleteProService", req.params);
  const { id } = req.params;

  const result = await proServiceModel.destroy({ where: { id } });
  if (!result) {
    return next(new ErrorHandler("Service not found", 404));
  }

  res.status(200).json({ success: true, message: "Service deleted successfully" });
});

// enquiry
exports.getEnquiry = catchAsyncError(async (req, res, next) => {
  console.log("getEnquiry", req.query);
  let { date } = req.query;
  if (!date) {
    date = new Date();
  }

  const todayMidTime = new Date(date);
  todayMidTime.setHours(0, 0, 0, 0);

  const comingDayMidTime = new Date(date);
  comingDayMidTime.setDate(comingDayMidTime.getDate() + 1);
  comingDayMidTime.setHours(0, 0, 0, 0);

  console.log({ date, todayMidTime, comingDayMidTime });

  const provider = await providerModel.findByPk(req.userId);
  if (!provider) {
    return next(new ErrorHandler("Provider not found", 404));
  }

  const count = await wishlistModel.count({
    where: {
      providerId: req.userId,
      createdAt: {
        [Op.gte]: todayMidTime,
        [Op.lt]: comingDayMidTime,
      }
    }
  });

  res.status(200).json({ count });
});
// For Admin
exports.verifyProvider = catchAsyncError(async (req, res, next) => {
  console.log("verifyProvider");
  const userId = req.userId;
  const provider = await providerModel.findByPk(userId);
  if (!provider) {
    return next(new ErrorHandler("Provider not found", 404));
  }

  provider.onHold = false;
  await provider.save();

  res.status(200).json({ success: true, message: "Provider verified successfully" });
});

exports.getAllProvider = catchAsyncError(async (req, res, next) => {
  console.log("getAllProvider", req.query);
  const query = formattedQuery("", req.query, ["email", "fullname", "mobile_no"]);

  const count = await providerModel.count({ ...query });
  const providers = await providerModel.findAll({
    ...query,
    attributes: ["id", "email", "fullname", "isVerified", "onHold", "country_code", "profileImage", "mobile_no"]
  });
  res.status(200).json({ providers, count });
});

exports.getProvider = catchAsyncError(async (req, res, next) => {
  console.log("getProvider", req.params);
  const { id } = req.params;

  const provider = await providerModel.findByPk(id, {
    attributes: {
      exclude: ["password", "role"]
    },
    include: [{
      model: videoModel,
      as: "video",
      attributes: ["id", "url"]
    }, {
      model: postModel,
      as: "posts",
      attributes: ["id", "url"]
    }, {
      model: availabilityModel,
      as: "time",
      attributes: ["weekday", "from", "to", "is_open"]
    }, {
      model: proServiceModel,
      as: "ownService",
      attributes: ["id", "desc", "charge"],
      include: [{
        model: serviceModel,
        as: "serviceTitle",
        attributes: ["id", "title", "image"]
      }]
    }]
  });
  if (!provider) {
    return next(new ErrorHandler("Provider not found", 404));
  }

  res.status(200).json({ provider });
});

exports.updateProvider = catchAsyncError(async (req, res, next) => { });
exports.deleteProvider = catchAsyncError(async (req, res, next) => { });