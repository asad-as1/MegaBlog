const User = require("../models/user");
const Post = require("../models/post");
const Notification = require("../models/notification");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const cloudinary = require("../config/cloudinary");
const { createNotification } = require("../utils/notification");

dotenv.config();

const accessTokenExpiry = "15m";
const refreshTokenExpiry = "7d";

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const signAccessToken = (user) =>
  jwt.sign({ userId: user._id, username: user.username }, process.env.SECRET, {
    expiresIn: accessTokenExpiry,
  });

const signRefreshToken = (user) =>
  jwt.sign(
    { userId: user._id, username: user.username, type: "refresh" },
    process.env.REFRESH_SECRET || process.env.SECRET,
    { expiresIn: refreshTokenExpiry }
  );

const sendAuthResponse = (res, statusCode, message, user) => {
  const token = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  return res.status(statusCode).json({
    message,
    token,
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
      email: user.email,
    },
  });
};

exports.register = async (req, res) => {
  try {
    const { username, name, email, password, profilePicture, profilePicturePublicId, bio } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({
      username,
      name,
      email,
      password,
      profilePicture,
      profilePicturePublicId,
      bio,
    });
    await newUser.save();

    return sendAuthResponse(res, 201, "User registered successfully", newUser);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    return sendAuthResponse(res, 200, "Login successful", user);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET || process.env.SECRET);
    if (decoded.type !== "refresh") {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const token = signAccessToken(user);

    return res.status(200).json({
      message: "Access token refreshed",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    res.clearCookie("refreshToken", refreshCookieOptions);
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

exports.logout = (req, res) => {
  try {
    res.clearCookie("refreshToken", refreshCookieOptions);
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("posts")
      .populate("followers", "username name profilePicture")
      .populate("following", "username name profilePicture");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username })
      .select("-password")
      .populate("posts")
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isOwnProfile = req.user.username === username;
    const isFollowing = user.followers.some((follower) => follower._id.toString() === req.user.id.toString());

    return res.status(200).json({ user, isOwnProfile, isFollowing });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUsernameById = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ username: user.username });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.body?.author;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found!!" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, profilePicture, profilePicturePublicId, email } = req.body;
    const userId = req.user.id.toString();
    const existingUser = await User.findById(userId).select("profilePicturePublicId");

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      existingUser.profilePicturePublicId &&
      profilePicturePublicId &&
      existingUser.profilePicturePublicId !== profilePicturePublicId
    ) {
      await cloudinary.uploader.destroy(existingUser.profilePicturePublicId, { resource_type: "image" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, bio, profilePicture, profilePicturePublicId, email },
      { new: true, runValidators: true }
    ).select("-password");

    return res.status(201).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const authoredPosts = await Post.find({ author: userId }).select("media.publicId media.resourceType");
    for (const post of authoredPosts) {
      if (post.media?.publicId) {
        await cloudinary.uploader.destroy(post.media.publicId, {
          resource_type: post.media.resourceType || "image",
        });
      }
    }

    if (deletedUser.profilePicturePublicId) {
      await cloudinary.uploader.destroy(deletedUser.profilePicturePublicId, { resource_type: "image" });
    }

    await Post.deleteMany({ author: userId });
    await Post.updateMany({ likes: userId }, { $pull: { likes: userId } });
    await Post.updateMany({ "comments.user": userId }, { $pull: { comments: { user: userId } } });
    await User.updateMany({ followers: userId }, { $pull: { followers: userId } });
    await User.updateMany({ following: userId }, { $pull: { following: userId } });
    await Notification.deleteMany({
      $or: [{ recipient: userId }, { sender: userId }],
    });

    return res.status(200).json({ message: "User account and associated data deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addPostToFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (user.favourites.some((id) => id.toString() === postId.toString())) {
      return res.status(400).json({ message: "Post is already in favorites" });
    }

    user.favourites.push(postId);
    await user.save();

    return res.status(200).json({ message: "Post added to favorites", favourites: user.favourites });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.RemoveFromFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.favourites.some((id) => id.toString() === postId.toString())) {
      return res.status(400).json({ message: "Post is not in favorites" });
    }

    user.favourites.pull(postId);
    await user.save();

    return res.status(200).json({ message: "Post removed from favorites", favorites: user.favourites });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.isPostInFavourites = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFavourite = user.favourites.some((id) => id.toString() === postId.toString());
    return res.status(200).json({
      message: isFavourite ? "Post is in favourites" : "Post is not in favourites",
      isFavourite,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.fetchFavourites = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).populate("favourites");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ favourites: user.favourites });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    const users = await User.find({
      $or: [{ username: { $regex: query, $options: "i" } }, { name: { $regex: query, $options: "i" } }],
    }).select("username name profilePicture bio");

    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ error: "Failed to search users", details: err.message });
  }
};

exports.followUser = async (req, res) => {
  try {
    const currentUserId = req.user.id.toString();
    const targetUserId = req.params.userId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentUser.following.some((id) => id.toString() === targetUserId.toString())) {
      return res.status(400).json({ message: "Already following this user" });
    }

    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);
    await Promise.all([currentUser.save(), targetUser.save()]);

    await createNotification({
      recipient: targetUserId,
      sender: currentUserId,
      type: "follow",
    });

    return res.status(200).json({ message: "Followed successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to follow user", error: error.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user.id.toString();
    const targetUserId = req.params.userId;

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    currentUser.following.pull(targetUserId);
    targetUser.followers.pull(currentUserId);

    await Promise.all([currentUser.save(), targetUser.save()]);

    // Remove "follow" notifications that were generated when currentUser followed targetUser.
    // recipient = targetUserId (who received the notification)
    // sender = currentUserId (who did the follow)
    await Notification.deleteMany({
      recipient: targetUserId,
      sender: currentUserId,
      type: "follow",
    });

    return res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to unfollow user", error: error.message });
  }
};


exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("followers", "username name profilePicture");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ followers: user.followers });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch followers", error: error.message });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("following", "username name profilePicture");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ following: user.following });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch following", error: error.message });
  }
};
