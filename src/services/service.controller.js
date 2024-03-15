const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncError = require("../../utils/catchAsyncError");

const { userModel } = require("../user/user.model");
const { providerModel } = require("../provider/provider.model");
const { serviceModel, categoryModel } = require("./service.model");

exports.createService = catchAsyncError(async (req, res, next) => {

});

exports.getAllService = catchAsyncError(async (req, res, next) => {
  console.log("getAllService");
  const services = await serviceModel.findAll();
  res.status(200).json({ services });
});

exports.getService = catchAsyncError(async (req, res, next) => { });
exports.updateService = catchAsyncError(async (req, res, next) => { });
exports.deleteService = catchAsyncError(async (req, res, next) => { });

exports.createCategory = catchAsyncError(async (req, res, next) => {
  console.log("createCategory", req.body);
  const { categoryName } = req.body;
  const category = await categoryModel.create({ categoryName });

  res.status(201).json({ category });
});

exports.getAllCategory = catchAsyncError(async (req, res, next) => {
  const categories = await categoryModel.findAll({
    include: [{
      model: serviceModel,
      as: "services",
      attributes: ["id", "title"]
    }]
  });
  res.status(200).json({ categories });
});
exports.getCategory = catchAsyncError(async (req, res, next) => { });
exports.updateCategory = catchAsyncError(async (req, res, next) => { });
exports.deleteCategory = catchAsyncError(async (req, res, next) => { });