import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Container } from "../components";
import parse from "html-react-parser";
import axios from "axios";
import Cookie from "cookies-js";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaHeart, FaComment, FaUser, FaShareAlt } from "react-icons/fa";
import ErrorComponent from "../pages/ErrorPage"; // Import the Error Component

export default function SinglePost() {
  const token = Cookie.get("token");
  const { id } = useParams();
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);
  
  // State declarations
  const [post, setPost] = useState({});
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [loggedInUserRole, setLoggedInUserRole] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likesList, setLikesList] = useState([]);
  const [commentsList, setCommentsList] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isCommentEmpty, setIsCommentEmpty] = useState(false);
  const [addedFav, setAddedFav] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // New error message state

  // Fetch post and user data
  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_URL}post/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
        setPost(res?.data);
        setIsLiked(res?.data?.likes?.includes(loggedInUserId));
        setLikeCount(res?.data?.likes?.length || 0);
      } catch (error) {
        setErrorMessage("It seems you're not connected to the internet. Check your connection and retry."); // Set error message
      }
    };

    const fetchUserData = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_URL}user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setLoggedInUserId(res?.data?.user?._id);
        setLoggedInUserRole(res?.data?.user?.role);
      } catch (error) {
        setErrorMessage("It seems you're not connected to the internet. Check your connection and retry."); // Set error message
      }
    };

    fetchUserData();
    fetchPostData();
  }, [id, loggedInUserId, token]);

  // Function to handle sharing
  const handleShare = () => {
    const shareData = {
      title: post?.title,
      text: "Check out this post!",
      url: window.location.href,
    };
  
    let shared = false;
  
    const showSuccessAlert = () => {
      MySwal.fire({
        icon: "success",
        title: "Post shared successfully!",
        text: "Your post has been shared.",
        confirmButtonText: "OK",
        confirmButtonColor: "#007BFF",
      });
    };
  
    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() => {
          shared = true;
  
          // Set a timer to show the success message after 1.5 seconds
          setTimeout(() => {
            if (shared) {
              showSuccessAlert();
            }
          }, 1500);
        })
        .catch((error) => {
          console.error("Error sharing post:", error);
          MySwal.fire({
            icon: "error",
            title: "Error sharing post",
            text: "Something went wrong while sharing the post.",
            confirmButtonText: "Try Again",
          });
        });
    } else {
      MySwal.fire({
        icon: "info",
        title: "Web Share API not supported",
        text: "Copy the link to share: " + window.location.href,
        confirmButtonText: "Copy",
        showCancelButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          navigator.clipboard.writeText(window.location.href).then(() => {
            MySwal.fire("Copied!", "Link copied to clipboard.", "success");
          });
        }
      });
    }
  };
  
  
  const handleLike = async () => {
    if (!loggedInUserId) return;

    try {
      const endpoint = isLiked
        ? `${import.meta.env.VITE_URL}post/${id}/unlike`
        : `${import.meta.env.VITE_URL}post/${id}/like`;

      const res = await axios.post(endpoint, {}, { 
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (res.status === 200) {
        setIsLiked(!isLiked);
        setLikeCount((prevCount) => (isLiked ? prevCount - 1 : prevCount + 1));
        fetchLikesList();
      }
    } catch (error) {
      setErrorMessage("It seems you're not connected to the internet. Check your connection and retry."); // Set error message
      console.error("Error liking/unliking post:", error);
    }
  };

  const fetchLikesList = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_URL}post/${id}/likes`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setLikesList(res?.data?.likes);
      // console.log(res.data.likes)
    } catch (error) {
      setErrorMessage("It seems you're not connected to the internet. Check your connection and retry."); // Set error message
      console.error("Failed to fetch likes list:", error);
    }
  };

  const fetchCommentsList = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_URL}post/${id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setCommentsList(res?.data?.comments);
    } catch (error) {
      setErrorMessage("It seems you're not connected to the internet. Check your connection and retry."); // Set error message
      console.error("Failed to fetch comments list:", error);
    }
  };

  const handleAddComment = async () => {
    const trimmedComment = commentText.trim();

    if (!trimmedComment) {
      setIsCommentEmpty(true); // Show validation message
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_URL}post/${id}/comment`,
        { comment: trimmedComment },
        { 
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setCommentText("");
      setIsCommentEmpty(false); // Hide validation message
      fetchCommentsList();
    } catch (error) {
      setErrorMessage("It seems you're not connected to the internet. Check your connection and retry."); // Set error message
      console.error("Failed to add comment:", error);
    }
  };

  const addPostToFavorites = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_URL}user/favourites/${post?._id}`, { 
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
  
      if (res.status === 200) {
        setAddedFav(true);
        MySwal.fire({
          icon: "success",
          title: "Post Added to Favorites!",
          text: "Post added successfully to your favorites.",
          confirmButtonText: "OK",
          confirmButtonColor: "#007BFF",
        });
      }
    } catch (error) {
      setErrorMessage("It seems you're not connected to the internet. Check your connection and retry.");
      console.error("Failed to add to Favorites:", error);
      MySwal.fire({
        icon: "error",
        title: "Error Adding to Favorites",
        text: "Failed to add the post to your favorites. Please try again.",
        confirmButtonText: "Retry",
      });
    }
  };

  
const RemoveFromFavorites = async (e) => {
  try {
    const res = await axios.delete(
      `${import.meta.env.VITE_URL}user/favourites/${post?._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      }
    );

    if (res.status === 200) {
      setAddedFav(false);
      MySwal.fire({
        icon: "success",
        title: "Post Removed from Favorites!",
        text: "Post removed successfully from your favorites.",
        confirmButtonText: "OK",
        confirmButtonColor: "#007BFF",
      });
    }
  } catch (error) {
    setErrorMessage("It seems you're not connected to the internet. Check your connection and retry.");
    console.error("Failed to remove from Favorites:", error);
    MySwal.fire({
      icon: "error",
      title: "Error Removing from Favorites",
      text: "Failed to remove the post from your favorites. Please try again.",
      confirmButtonText: "Retry",
    });
  }
};

  const checkIfPostIsFavorite = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_URL}user/favourites/check/${id}`, { 
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      // console.log(res)
      if (res?.data?.isFavourite) setAddedFav(res?.data?.isFavourite);
    } catch (error) {
      setErrorMessage("It seems you're not connected to the internet. Check your connection and retry."); // Set error message
      console.error("Failed to check Favourites:", error);
    }
  };

  const deletePost = async () => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
    });
  
    if (result.isConfirmed) {
      try {
        await axios.delete(`${import.meta.env.VITE_URL}post/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
  
        MySwal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Your post has been deleted.',
          confirmButtonText: 'OK',
          confirmButtonColor: "#007BFF",
        });
  
        navigate("/");
      } catch (error) {
        setErrorMessage("It seems you're not connected to the internet. Check your connection and retry."); // Set error message
        console.error("Failed to delete post:", error);
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete the post. Please try again.',
          confirmButtonText: 'Retry',
        });
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: "This comment will be permanently deleted!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
    });
  
    if (result.isConfirmed) {
      try {
        const res = await axios.delete(
          `${import.meta.env.VITE_URL}post/${id}/comment/${commentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
        fetchCommentsList();
        MySwal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Your comment has been deleted.',
          confirmButtonText: 'OK',
          confirmButtonColor: "#007BFF",
        });
      } catch (error) {
        setErrorMessage("It seems you're not connected to the internet. Check your connection and retry."); // Set error message
        console.error("Failed to delete comment:", error);
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete the comment. Please try again.',
          confirmButtonText: 'Retry',
        });
      }
    }
  }; 

  // console.log(likesList)

  const isAuthor = loggedInUserId === post?.author?._id;
  const isAdmin = loggedInUserRole === "admin"; // Check if user is admin

  useEffect(() => {
    checkIfPostIsFavorite();
    fetchLikesList();
    fetchCommentsList();
  }, [id, token]);

  return (
    <div className="p-8">
      <Container>
        {/* Display error message if exists */}
        {errorMessage ? (
          <ErrorComponent message={errorMessage} />
        ) : (
          <>
            {/* Post Media */}
            <div className="w-full h-screen flex justify-center relative rounded-xl">
              {post?.media?.isVideo ? (
                <video
                  controls
                  autoPlay
                  loop
                  className="rounded-xl object-fill border border-white"
                  style={{ height: "70%", width: "85%"}}
                  >
                  <source src={post?.media?.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={post?.media?.url}
                  alt={post?.title}
                  className="rounded-xl object-fill border border-white"
                  style={{ height: "75%", width: "85%"}}
                />
              )}
            </div>
  
            {/* Post Details */}
            <div className="w-full -mt-24 mb-6">
              <h1 className="text-3xl text-center font-bold mb-2">{post?.title}</h1>
              <div className="w-full text-center mb-6 leading-relaxed">
                {parse(post?.content || "")}
              </div>
              <p className="mb-4 text-center">
                Posted by:
                <Link
                  to={`/profile/${post?.author?.username}`}
                  className="ml-2 font-semibold"
                >
                  {post?.author?.username}
                </Link>
              </p>
            </div>
  
            {/* Bottom Buttons */}
            <div className="flex flex-col md:flex-row gap-2 justify-center mt-4 mb-6">
              {addedFav !== true ? (
                <Button
                  bgColor="bg-blue-500"
                  className="mb-3 md:mb-0 md:mr-3 h-10 px-4"
                  onClick={() => addPostToFavorites(post?._id)}
                >
                  Add To Favourites
                </Button>
              ) : (
                <Button
                  bgColor="bg-blue-500"
                  className="mb-3 md:mb-0 md:mr-3 h-10 px-4"
                  onClick={() => RemoveFromFavorites(post?._id)}
                >
                  Remove From Favourites
                </Button>
              )}
              {(isAuthor || isAdmin) && (
                <>
                  <Link to={`/edit-post/${post._id}`}>
                    <Button
                      bgColor="bg-green-500"
                      className="w-full mb-3 md:mb-0 md:mr-3 h-10 px-4"
                    >
                      Edit
                    </Button>
                  </Link>
                  <Button
                    bgColor="bg-red-500"
                    className="mb-3 md:mb-0 h-10 px-4"
                    onClick={() => deletePost()}
                  >
                    Delete
                  </Button>
                </>
              )}
              {/* Share Button */}
              <Button
                bgColor="bg-purple-500"
                className="h-10 px-4 flex items-center justify-center"
                onClick={handleShare}
              >
                <FaShareAlt className="mr-2" /> Share
              </Button>
            </div>
  
            {/* Post Stats: Likes and Comments Sections */}
            <div className="flex flex-col md:flex-row gap-8 mb-4">
              {/* Likes Section */}
              <div className="w-full md:w-1/2">
                <div className="flex items-center mb-4">
                  <FaHeart
                    onClick={handleLike}
                    className={`mr-2 cursor-pointer ${
                      isLiked ? "text-red-500" : "text-gray-400"
                    }`}
                    size={20}
                  />
                  <h2 className="text-xl font-bold">Likes ({likeCount})</h2>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg shadow-md h-72 overflow-y-auto">
                  {likesList.length > 0 ? (
                    likesList.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-2 mb-2"
                      >
                        <Link
                          to={`/profile/${user.username}`}
                          className="flex items-center gap-2"
                        >
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <FaUser className="w-6 h-7 text-gray-600" />
                          )}
                          <span className="text-md text-black">{user.username}</span>
                        </Link>
                        <Button bgColor="bg-blue-500" className="text-sm">
                          <Link to={`/profile/${user.username}`}>View Profile</Link>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center">No Likes Yet</p>
                  )}
                </div>
              </div>
  
              {/* Comments Section */}
              <div className="w-full md:w-1/2">
                <div className="flex items-center mb-4">
                  <FaComment className="mr-2 text-gray-400 text-xl" />
                  <h2 className="text-xl font-bold">
                    Comments ({commentsList.length || 0})
                  </h2>
                </div>
                <div className="relative bg-gray-100 p-4 rounded-lg shadow-md h-72 overflow-y-auto">
                  {commentsList.length > 0 ? (
                    commentsList.map((comment) => (
                      <div key={comment._id} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          {comment.user.profilePicture ? (
                            <img
                              src={comment.user.profilePicture}
                              alt={comment.user.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <FaUser className="w-6 h-7 text-gray-500" />
                          )}
                          <span className="font-semibold text-black">
                            <Link to={`/profile/${comment.user.username}`}>
                              @{comment.user.username}
                            </Link>
                          </span>
                        </div>
                        <p className="text-black bg-gray-300 p-2 rounded-lg mb-2">
                          {comment.comment}
                        </p>
                        {(comment?.user?._id === loggedInUserId ||
                          loggedInUserRole === "admin") && (
                          <div className="w-full flex justify-end">
                            <Button
                              bgColor="bg-blue-500"
                              onClick={() => handleDeleteComment(comment._id)}
                              className="text-sm"
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500">No Comments Yet</p>
                  )}
                </div>
  
                {/* Add Comment Section */}
                <div className="bottom-0 left-0 w-full p-4 bg-gray-100 rounded-lg mt-3 flex flex-col gap-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-2 border text-black rounded-md"
                    required
                  />
  
                  {/* Error Message */}
                  {isCommentEmpty && (
                    <p className="text-red-500 text-sm mt-1">Write Something !</p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      bgColor="bg-blue-500"
                      className="text-sm w-1/2 py-2 rounded-md"
                      onClick={handleAddComment}
                    >
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </Container>
    </div>
  );
}
