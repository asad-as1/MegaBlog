const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  media: {
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    resourceType: {
      type: String,
      enum: ["image", "video"],
      required: true
    },
    isVideo: {
      type: Boolean, // Corrected from `boolean` to `Boolean`
      default: false
    }
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categories: [{
    type: String,
    trim: true
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  },
  isPublished: {
    type: String,
    enum: ["Public", "Private", "Scheduled"],
    default: "Public"
  },
  scheduledAt: {
    type: Date,
    default: null
  }
});

// Pre-save hook to update the 'updatedAt' field
postSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create the Post model
const Post = mongoose.model('Post', postSchema);
module.exports = Post;