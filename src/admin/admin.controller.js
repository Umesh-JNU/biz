const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncError = require("../../utils/catchAsyncError");
const { userModel } = require("../user/user.model");
const { s3Uploadv2 } = require("../../utils/s3");

exports.postSingleImage = catchAsyncError(async (req, res, next) => {
    const file = req.file;
    if (!file) {
        return next(new ErrorHandler("Please upload a file", 400));
    }

    const { mimetype } = req.file;
    if (!mimetype.includes("image/")) {
        return next(new ErrorHandler("File must an image", 400));
    }

    const results = await s3Uploadv2(file);
    const location = results.Location && results.Location;
    return res.status(201).json({ data: { location } });
});

exports.setAdmin = catchAsyncError(async (req, res, next) => {
    const user = await userModel.findByPk(1);
    user.role = 'Admin';
    await user.save();
    res.status(200).json({ message: "Admin created", user });
});

exports.login = catchAsyncError(async (req, res, next) => {
    console.log("ADMIN LOGIN", req.body);
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorHandler("Enter your email and password", 400));
    }

    const admin = await userModel.findOne({ where: { email, isVerified: true, role: "Admin" } });
    if (!admin) {
        return next(new ErrorHandler("Either admin is not set or not verified", 400));
    }

    const isPasswordMatched = await admin.comparePassword(password);
    if (!isPasswordMatched)
        return next(new ErrorHandler("Invalid email or password!", 401));

    const token = admin.getJWTToken();
    res.status(200).json({ success: true, admin, token });
});

