const Post = require("../models/post");
const User = require("../models/user");
const Notification = require("../models/notification");
const cloudinary = require("../config/cloudinary");
const { createNotification } = require("../utils/notification");

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { title, content, categories, media, isPublished, scheduledAt } = req.body;
    const user = req.user;

    if (!media?.url || !media?.publicId || !media?.resourceType) {
      return res.status(400).json({ message: "Media upload is required" });
    }

    if (isPublished === "Scheduled" && !scheduledAt) {
      return res.status(400).json({ message: "scheduledAt is required for scheduled posts" });
    }

    const newPost = new Post({
      author: user.id,
      title,
      content,
      media: {
        url: media.url,
        publicId: media.publicId,
        resourceType: media.resourceType,
        isVideo: media.resourceType === "video",
      },
      categories,
      isPublished,
      scheduledAt: isPublished === "Scheduled" ? scheduledAt : null,
    });

    const savedPost = await newPost.save();

    await User.findByIdAndUpdate(user.id, {
      $push: { posts: savedPost._id },
    });

    res.status(201).json(savedPost);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating post", error });
  }
};

// Get all posts (with pagination)
exports.getAllPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 9, 1);
    const skip = (page - 1) * limit;

    await Post.updateMany(
      {
        isPublished: "Scheduled",
        scheduledAt: { $lte: new Date() },
      },
      { $set: { isPublished: "Public", scheduledAt: null } }
    );

    const filter = { isPublished: "Public" };
    const total = await Post.countDocuments(filter);

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      posts,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching posts", error });
  }
};

// Get a single post by ID
exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId)
      .populate("author", "username name")
      .exec();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Error fetching post", error });
  }
};

// Update a post by ID
exports.updatePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { title, categories, content, media, isPublished, scheduledAt } = req.body;
    const existingPost = await Post.findById(postId);
    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (
      existingPost.author.toString() !== req.user.id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "You are not authorized to update this post" });
    }

    if (!media?.url || !media?.publicId || !media?.resourceType) {
      return res.status(400).json({ message: "Media upload is required" });
    }

    if (isPublished === "Scheduled" && !scheduledAt) {
      return res.status(400).json({ message: "scheduledAt is required for scheduled posts" });
    }

    if (
      existingPost.media?.publicId &&
      media?.publicId &&
      existingPost.media.publicId !== media.publicId
    ) {
      await cloudinary.uploader.destroy(existingPost.media.publicId, {
        resource_type: existingPost.media.resourceType || "image",
      });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        title,
        content,
        media: {
          url: media.url,
          publicId: media.publicId,
          resourceType: media.resourceType,
          isVideo: media.resourceType === "video",
        },
        categories,
        isPublished,
        scheduledAt: isPublished === "Scheduled" ? scheduledAt : null,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: "Error updating post", error });
  }
};

// Delete a post by ID
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user is the author of the post or an admin
    if (
      post.author.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this post" });
    }

    if (post.media?.publicId) {
      await cloudinary.uploader.destroy(post.media.publicId, {
        resource_type: post.media.resourceType || "image",
      });
    }

    const deletedPost = await Post.findByIdAndDelete(postId);

    if (deletedPost) {
      // Remove the post ID from the user's posts array
      await User.findByIdAndUpdate(post.author, {
        $pull: { posts: postId, favourites: postId },
      });

      // Optionally, remove the post ID from other users' favorites arrays
      await User.updateMany(
        { favourites: postId },
        { $pull: { favourites: postId } }
      );
      await Notification.deleteMany({ post: postId });

      res.status(200).json({ message: "Post deleted successfully" });
    } else {
      res.status(404).json({ message: "Post not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting post", error });
  }
};

// Like a post
exports.likePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.likes.some((id) => id.toString() === userId.toString())) {
      return res.status(400).json({ message: "You already liked this post" });
    }

    post.likes.push(userId);
    // Avoid validating required `media.*` on like-only save
    await post.save({ validateBeforeSave: false });

    await createNotification({
      recipient: post.author,
      sender: userId,
      type: "like",
      post: post._id,
    });

    res.status(200).json({ message: "Post liked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error liking post", error });
  }
};

// Unlike a post
exports.unlikePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!post.likes.some((id) => id.toString() === userId.toString())) {
      return res.status(400).json({ message: "You have not liked this post" });
    }

    post.likes.pull(userId);
    // Avoid validating required `media.*` on unlike-only save
    await post.save({ validateBeforeSave: false });

    res.status(200).json({ message: "Post unliked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error unliking post", error });
  }
};

// Add a comment to a post
exports.addComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { comment } = req.body;
    const trimmedComment = comment?.trim();
    const userId = req.user.id;

    if (!trimmedComment) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({
      user: userId,
      comment: trimmedComment,
      createdAt: Date.now(),
    });

    // IMPORTANT: avoid validating required `media.*` on comment-only save
    await post.save({ validateBeforeSave: false });

    await createNotification({
      recipient: post.author,
      sender: userId,
      type: "comment",
      post: post._id,
      comment: trimmedComment.substring(0, 120),
    });

    res.status(201).json({ message: "Comment added successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error adding comment", error });
  }
};

// Delete a comment from a post
exports.deleteComment = async (req, res) => {
  try {
    // console.log(req.user.role)
    const postId = req.params.postId;
    const commentId = req.params.commentId;
    const userId = req.user.id;

    // Find the post by ID
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Find the comment to check authorization
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if the user is authorized to delete the comment
    if (
      comment.user.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this comment" });
    }

    // Use $pull to remove the comment by its _id
    await Post.updateOne(
      { _id: postId },
      { $pull: { comments: { _id: commentId } } }
    );

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting comment", error });
  }
};

// Fetch the list of users who liked a post
exports.fetchLikesList = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId)
    .populate({
      path: 'likes',
      select: 'username profilePicture' // Only select specific fields
    })
    .exec();
  
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ likes: post.likes });
  } catch (error) {
    console.error("Error fetching likes list:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch the list of comments on a post
exports.fetchCommentsList = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId).populate({
      path: "comments.user", // Path to the user field within comments
      select: "username profilePicture", // Select only required fields
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ comments: post.comments });
  } catch (error) {
    console.error("Error fetching comments list:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.searchPosts = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const authorIds = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },   // Pattern Matching: $regex matches substrings within a field. If query is "John", it will match "John", "john", "Johnny", "Johnathan", etc., in the name field.
        { username: { $regex: query, $options: 'i' } } // Case-insensitive search for username
      ]
    }).distinct('_id');
    
    // Perform search based on the query (title, categories, or author ID)
    const posts = await Post.find({
      $or: [
        { title: { $regex: query, $options: 'i' } }, // Case-insensitive search for title
        { categories: { $elemMatch: { $regex: query, $options: 'i' } } }, // Case-insensitive search for categories
        { author: { $in: authorIds } } // Match posts by author ID(s)
      ]
    });

    res.json(posts);
  } catch (err) {
    console.error('Error searching posts:', err);
    res.status(500).json({ error: 'Failed to search posts' });
  }
};

exports.updatePostVisibility = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can moderate post visibility" });
    }

    const { isPublished } = req.body;
    if (!["Public", "Private"].includes(isPublished)) {
      return res.status(400).json({ message: "isPublished must be Public or Private" });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postId,
      { isPublished, scheduledAt: null },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.status(200).json({ message: "Post visibility updated", post: updatedPost });
  } catch (error) {
    return res.status(500).json({ message: "Error updating visibility", error: error.message });
  }
};
