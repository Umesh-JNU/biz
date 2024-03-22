const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncError = require("../../utils/catchAsyncError");
const formattedQuery = require("../../utils/apiFeatures");

const { providerModel } = require("../provider/provider.model");
const { serviceModel, categoryModel } = require("./service.model");
const { s3Uploadv2 } = require("../../utils/s3");

// ------------- for admin -----------------
exports.createService = catchAsyncError(async (req, res, next) => {
  console.log("createService", req.body, req.file);
  if (!req.body.categoryId) {
    return next(new ErrorHandler("Please a category", 400));
  }

  const service = await serviceModel.create(req.body);
  res.status(201).json({ service });
});

exports.getAllService = catchAsyncError(async (req, res, next) => {
  console.log("getAllService");
  const query = formattedQuery("title", req.query);

  const count = await serviceModel.count({ ...query });
  const services = await serviceModel.findAll({
    ...query,
    attributes: ["id", "title", "image"]
  });
  res.status(200).json({ services, count });
});

exports.getService = catchAsyncError(async (req, res, next) => {
  console.log("getService", req.params);
  const { id } = req.params;

  const service = await serviceModel.findByPk(id);
  if (!service) {
    return next(new ErrorHandler("Service not found", 404));
  }

  res.status(200).json({ service });
});

exports.updateService = catchAsyncError(async (req, res, next) => {
  console.log("updateService", req.body);
  const { id } = req.params;

  const [isUpdated, _] = await serviceModel.update(req.body, { where: { id }, returning: true });
  if (isUpdated === 0) {
    return next(new ErrorHandler("Service not found", 404));
  }

  res.status(200).json({ success: true, message: "Service updated successfully" })
});

exports.deleteService = catchAsyncError(async (req, res, next) => {
  console.log("deleteService", req.params);

  const isDeleted = await serviceModel.destroy({ where: { id: req.params.id } });
  if (!isDeleted) {
    return next(new ErrorHandler("Service not found", 404));
  }
  res.status(200).json({ success: true, message: "Service deleted successfully", });
});

// admin controller for category
exports.createCategory = catchAsyncError(async (req, res, next) => {
  console.log("createCategory", req.body);
  const { categoryName } = req.body;
  const category = await categoryModel.create({ categoryName });

  res.status(201).json({ category });
});

exports.getAllCategory = catchAsyncError(async (req, res, next) => {
  console.log("getAllCategory", req.query);
  const query = formattedQuery("categoryName", req.query);

  const count = await categoryModel.count({ ...query });
  const categories = await categoryModel.findAll({
    ...query
  });
  res.status(200).json({ categories, count });
});

exports.getCategory = catchAsyncError(async (req, res, next) => {
  console.log("getCategory", req.params);
  const { id } = req.params;

  const category = await categoryModel.findByPk(id, {
    include: [{
      model: serviceModel,
      as: "services",
      attributes: ["id", "title", "image"]
    }]
  });
  if (!category) {
    return next(new ErrorHandler("Category not found", 404));
  }

  res.status(200).json({ category });
});

exports.updateCategory = catchAsyncError(async (req, res, next) => {
  console.log("updateCategory", req.body);
  const { id } = req.params;

  const [isUpdated, _] = await categoryModel.update(req.body, { where: { id }, returning: true });
  if (isUpdated === 0) {
    return next(new ErrorHandler("Category not found", 404));
  }

  res.status(200).json({ success: true, message: "Category updated successfully" })
});

exports.deleteCategory = catchAsyncError(async (req, res, next) => {
  console.log("deleteCategory", req.params);

  const isDeleted = await categoryModel.destroy({ where: { id: req.params.id } });
  if (!isDeleted) {
    return next(new ErrorHandler("Category not found", 404));
  }
  res.status(200).json({ success: true, message: "Category deleted successfully", });
});

// For provider and users
exports.getCategoryWithService = catchAsyncError(async (req, res, next) => {
  console.log("getCategoryWithService");
  const categories = await categoryModel.findAll({
    include: [{
      model: serviceModel,
      as: "services",
      attributes: ["id", "title", "image"]
    }]
  });
  res.status(200).json({ categories });
});

exports.getServicesWithCategory = catchAsyncError(async (req, res, next) => {
  console.log("getServicesWithCategory");
  const services = await serviceModel.findAll();
  res.status(200).json({ services });
});