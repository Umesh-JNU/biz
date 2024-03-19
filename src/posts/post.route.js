const express = require('express');
const router = express.Router();
const { upload } = require("../../utils/s3");
const { auth, onlyProvider } = require("../../middlewares/auth");

const { createIntroVideo, createPost, getAlbum } = require('./post.controller');

router.post("/video", auth, onlyProvider, upload.single("video"), createIntroVideo);
router.post("/post", auth, onlyProvider, upload.array("images"), createPost);

router.get("/", auth, onlyProvider, getAlbum);

module.exports = router;