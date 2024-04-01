const catchAsyncError = require("../../utils/catchAsyncError");
const ErrorHandler = require("../../utils/errorHandler");
const bannerModel = require("./banner.model");

exports.createBanner = catchAsyncError(async (req, res, next) => {
  console.log("createBanner", req.body);
  const { url } = req.body;

  const banner = await bannerModel.create({ url });
  res.status(200).json({ banner });
});

exports.getAllBanner = catchAsyncError(async (req, res, next) => {
  const banners = await bannerModel.findAll({
    order: [["createdAt", "DESC"]]
  });
  res.status(200).json({ banners });
});

exports.getBanner = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const banner = await bannerModel.findByPk(id);
  if (!banner) return next(new ErrorHandler("Banner not found", 404));

  res.status(200).json({ banner });
});

exports.updateBanner = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const [isUpdated, banner] = await bannerModel.update(req.body, { where: { id }, returning: true });
  if (!isUpdated) {
    return next(new ErrorHandler("Banner not found", 404));
  }
  res.status(200).json({ banner });
});

exports.deleteBanner = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const isDeleted = await bannerModel.destroy({ where: { id } });
  if (!isDeleted) {
    return next(new ErrorHandler("Banner Not Found", 404));
  }

  res.status(200).json({ success: true, message: "Banner Deleted successfully." });
});
