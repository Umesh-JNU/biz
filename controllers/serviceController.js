const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../utils/catchAsyncError");
const { userModel } = require("../models/userModel");

const { serviceModel, category } = require("../models/serviceModel");
const { providerModel } = require("../models/providerModel");

exports.CreateService = catchAsyncError(async (req, res, next) => {
  const { providerId, categoryId } = req.body;

  const provider = await providerModel.findOne({
    where: { id: providerId },
  });

  const cat = await category.findOne({ where: { id: categoryId } });

  if (!cat) {
    return next(new ErrorHandler("category do not exist"));
  }
  if (!provider) {
    return next(new ErrorHandler("user do not exist"));
  }

  const service = await serviceModel.create({ ...req.body });

  await service.setCategory(cat);

  await service.setProvider(provider);

  res.status(200).json({ service });
});

exports.DeleteService = catchAsyncError(async (req, res, next) => {
  const { id } = req.body;
  await serviceModel.destroy({ where: { id: id } });
  res.status(200).json({ status: true, message: "deleted" });
});

exports.UpdateService = catchAsyncError(async (req, res, next) => {
  const { serviceId } = req.body;
  console.log(serviceId);
  const service_check = await serviceModel.findByPk(serviceId);

  if (!service_check) {
    return next(new ErrorHandler("Service do not exit"));
  }

  await serviceModel.update(
    { ...req.body },
    { where: { id: serviceId }, include: userModel }
  );

  res.status(200).json({ message: "updated" });
});

exports.getSimilar = catchAsyncError(async (req, res, next) => {
  const categoryId = req.params.CategoryId;
  console.log(categoryId);
  const services = await category.findAll({
    where: { id: categoryId },
    include: serviceModel,
  });
  console.log("results--->", services);
  res.status(200).json({ services });
});

exports.addCategory = catchAsyncError(async (req, res, next) => {
  const { categoryName } = req.body;
  const result = await category.findOrCreate({
    where: { categoryName: categoryName },
  });
  console.log("results--->", result);
  try {
    res.status(200).json({ result });
  } catch (err) {
    res.status(400).json(err);
  }
});

exports.serach = catchAsyncError(async (req, res, next) => {
  const { service } = req.body;
  if (!service) {
    return next(new ErrorHandler("Add Service name"));
  }
  const service_data = await serviceModel.findAll({
    where: { service: service },
    include: userModel,
  });
  res.status(200).json({ service_data });
});

exports.getAllServices = catchAsyncError(async (req, res, next) => {
  const all_service = await serviceModel.findAll();
  res.status(200).json({ all_service });
});

exports.getAllCategory = catchAsyncError(async (req, res, next) => {
  const all_category = await category.findAll({ include: serviceModel });
  res.status(200).json({ all_category });
});
