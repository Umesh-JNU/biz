const catchAsyncError = require("../../utils/catchAsyncError");
const ErrorHandler = require("../../utils/errorHandler");
const { s3Uploadv2, s3UploadMulti } = require("../../utils/s3");
const { providerModel } = require("../provider");
const { videoModel, postModel } = require("./post.model");

exports.createIntroVideo = catchAsyncError(async (req, res, next) => {
  console.log("createVideo", req.file);
  const file = req.file;
  if (!file) {
    return next(new ErrorHandler("Please upload file", 400));
  }

  const provider = await providerModel.findByPk(req.userId);
  if (!provider) {
    return next(new ErrorHandler("Provider not found", 404));
  }

  const result = await s3Uploadv2(file);
  if (result.Location) {
    const video = await videoModel.create({ url: result.Location });
    await provider.setVideo(video.id);

    // deleting video for providerId = null;
    await videoModel.destroy({ where: { providerId: null } });
    // await provider.createVideo({ url: result.Location });
  } else
    return next(new ErrorHandler("Something went wrong", 400));

  res.status(200).json({ message: "Video uploaded successfully" });
});

exports.getVideo = catchAsyncError(async (req, res, next) => { });

exports.updateVideo = catchAsyncError(async (req, res, next) => { });

exports.deleteVideo = catchAsyncError(async (req, res, next) => { });

// POSTs
exports.createPost = catchAsyncError(async (req, res, next) => {
  console.log("createPost", req.files);
  const files = req.files;
  if (!files || files.length === 0) {
    return next(new ErrorHandler("Please upload file/s", 400));
  }

  const provider = await providerModel.findByPk(req.userId);
  if (!provider) {
    return next(new ErrorHandler("Provider not found", 404));
  }

  const result = await s3UploadMulti(files);
  console.log(result)
  if (!result || result.length === 0) {
    return next(new ErrorHandler("Something went wrong", 400));
  }

  const posts = result.map(({ Location }) => ({
    providerId: provider.id,
    url: Location
  }));
  await postModel.bulkCreate(posts);

  res.status(200).json({ message: "New post uploaded successfully" });
});

exports.getAllPost = catchAsyncError(async (req, res, next) => { });

exports.getPost = catchAsyncError(async (req, res, next) => { });

exports.updatePost = catchAsyncError(async (req, res, next) => { });

exports.deletePost = catchAsyncError(async (req, res, next) => { });

// Album
exports.getAlbum = catchAsyncError(async (req, res, next) => {
  const userId = req.userId;

  const video = await videoModel.findOne({
    where: { providerId: userId },
    attributes: ["id", "url"]
  });

  const posts = await postModel.findAll({
    where: { providerId: userId },
    attributes: ["id", "url"]
  });

  res.status(200).json({ video, posts });
});