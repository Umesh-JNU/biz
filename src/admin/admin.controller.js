const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncError = require("../../utils/catchAsyncError");
const { userModel } = require("../user/user.model");

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

// postgres://my_biz12_user:zUT6XLKMppDpOqMzk3glqKA3ZDbehrcU@dpg-cn297b0l5elc73eafkng-a.oregon-postgres.render.com/my_biz12 -external
// postgres://my_biz12_user:zUT6XLKMppDpOqMzk3glqKA3ZDbehrcU@dpg-cn297b0l5elc73eafkng-a/my_biz12  internal

exports.getAll = catchAsyncError(async (req, res, next) => {
    const users = userModel.findAll()
    res.status(200).json(users)
})


exports.verifyProvider = catchAsyncError(async (req, res, next) => {
    const { providerId } = req.body
    const user = await userModel.findOne({ where: { id: providerId } })
    if (!user) {
        return next(new ErrorHandler("Provider Do not exist"))
    }
    console.log(user.roleId)
    if (user.roleId != 2) {
        return next(new ErrorHandler("Restricted Action"))
    }
    user.isverified = true;
    await user.save()
    res.status(200).json("status updated")

})

exports.activateProider = catchAsyncError(async (req, res, next) => {
    const { providerId } = req.body
    const user = await userModel.findOne({ where: { id: providerId } })
    if (!user) {
        return next(new ErrorHandler("Provider Do not exist"))
    }
    console.log(user.roleId)
    if (user.roleId != 2) {
        return next(new ErrorHandler("Restricted Action"))
    }
    user.isactivated = true;
    await user.save()
    res.status(200).json("status updated")

})


exports.deleteUser = catchAsyncError(async (req, res, next) => {
    const { userId } = req.body
    const user = userModel.findByPk(userId)
    if (!user) {
        return next(new ErrorHandler("User Do not exist"))
    }
    var role = user.roleId
    if (role == 1) {
        role = "User"
    }
    else {
        role = "Provider"
    }
    await userModel.destroy({ where: { id: userId } })
    res.status(200).json({ message: `${role} deleted` })
})

