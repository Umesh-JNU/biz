const ErrorHandler = require("../../utils/errorHandler")
const catchAsyncError = require("../../utils/catchAsyncError")
const contentModel = require("./enquiry.model");

const TT = "TERMS_AND_CONDITIONS";
const PP = "PRIVACY_POLICY";

exports.createUpdateContent = catchAsyncError(async (req, res, next) => {
	console.log("create content", req.body);
	const { title, desc } = req.body;
	if (!title || !desc) {
		return next(new ErrorHandler("Title and description is required", 400));
	}

	let content = await contentModel.findOne({ where: { title } });
	if (!content) {
		content = await contentModel.create(req.body);
	} else {
		[_, content] = await contentModel.update(req.body, { where: { title }, returning: true });
	}

	res.status(201).json({ content });
});

exports.getContent = catchAsyncError(async (req, res, next) => {
	console.log("getContent");
	const pp = await contentModel.findOne({ where: { title: PP } });
	const tt = await contentModel.findOne({ where: { title: TT } });
	res.status(200).json({ pp, tt });
});

exports.getTT = catchAsyncError(async (req, res, next) => {
	console.log("getTT");
	const content = await contentModel.findOne({
		where: { title: TT },
		attributes: ["desc"]
	});

	res.status(200).json({ success: true, data: content.desc });
});

exports.getPP = catchAsyncError(async (req, res, next) => {
	console.log("getPP");
	const content = await contentModel.findOne({
		where: { title: PP },
		attributes: ["desc"]
	});

	res.status(200).json({ success: true, data: content.desc });
});


