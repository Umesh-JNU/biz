const S3 = require("aws-sdk/clients/s3");
const multer = require("multer");

exports.s3Uploadv2 = async (file) => {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  const param = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `biz/${Date.now().toString()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  return await s3.upload(param).promise();
};

exports.s3UploadMulti = async (files) => {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  const params = files.map((file) => {
    return {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `biz/${Date.now().toString()}-${file.originalname ? file.originalname : "not"
        }`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
  });

  return await Promise.all(params.map((param) => s3.upload(param).promise()));
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const mimetype = file.mimetype.split("/")[0];
  console.log({ mimetype });
  switch (mimetype) {
    case "image":
    case "application":
      req.video_file = false;
      cb(null, true);
      break;

    case "video":
      req.video_file = true;
      cb(null, true);
      break;

    default:
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
  }
};

// ["image", "jpeg"]

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 11006600, files: 5 },
});
