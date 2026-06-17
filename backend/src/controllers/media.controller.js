const cloudinary = require("../config/cloudinary");

const uploadBufferToCloudinary = ({ buffer, folder, resourceType }) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );
    stream.end(buffer);
  });

exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const isVideo = req.file.mimetype.startsWith("video/");
    const folder = process.env.CLOUDINARY_FOLDER || "megablog";
    const result = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      folder,
      resourceType: isVideo ? "video" : "image",
    });

    return res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      bytes: result.bytes,
      format: result.format,
    });
  } catch (error) {
    return res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

exports.deleteMedia = async (req, res) => {
  try {
    const { publicId, resourceType } = req.body;
    if (!publicId) {
      return res.status(400).json({ message: "publicId is required" });
    }

    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType || "image",
    });
    return res.status(200).json({ message: "Media deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Delete failed", error: error.message });
  }
};
