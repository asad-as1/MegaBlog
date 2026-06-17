const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const mediaController = require("../controllers/media.controller");

const handleSingleUpload = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    next();
  });
};

router.post("/upload", handleSingleUpload, mediaController.uploadMedia);
router.delete("/", authenticate, mediaController.deleteMedia);

module.exports = router;
