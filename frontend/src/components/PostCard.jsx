import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { User, Video, Image } from "lucide-react";

function PostCard({ _id, title, isPublished, media, author }) {
  const [username, setUsername] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isVideo = media?.isVideo;
  const mediaUrl = typeof media === "string" ? media : media?.url;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const res = await axios.post(
          `${import.meta.env.VITE_URL}user/username`,
          { id: author }
        );
        setUsername(res.data.username);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        showAlert("Failed to load the post. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [author]);

  // Function to show alert
  const showAlert = (message) => {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: message,
      confirmButtonColor: "#f56565", // Red color for confirm button
    });
  };

  return (
    <Link to={`/post/${_id}`}>
      <div className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl group">
        {/* Media Section */}
        <div className="relative w-full h-48 overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
              <span className="text-gray-500">Loading...</span>
            </div>
          ) : mediaUrl ? (
            isVideo ? (
              <video
                className="w-full h-full object-fill"
                src={mediaUrl}
                controls
                alt="Video content"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={mediaUrl}
                alt="Post media"
                className="w-full h-full object-fill group-hover:scale-110 transition-transform duration-300"
              />
            )
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              {isVideo ? (
                <Video className="text-gray-500" />
              ) : (
                <Image className="text-gray-500" />
              )}
            </div>
          )}
        </div>

        {/* Post Details Section */}
        <div className="p-4">
          {/* Title */}
          <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
            {title}
          </h2>

          {/* Uploaded By */}
          <div className="flex items-center text-gray-600">
            <User className="w-5 h-5 mr-2" />
            <span>
              Uploaded by:
              {isLoading ? (
                <span className="ml-2 animate-pulse text-gray-400">
                  Loading...
                </span>
              ) : (
                <span className="font-medium ml-1">@{username}</span>
              )}
            </span>
          </div>

          {/* Additional Details */}
          <div className="mt-4 flex justify-between items-center">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isPublished === "Public"
                  ? "bg-green-100 text-green-800"
                  : isPublished === "Scheduled"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {isPublished || "Draft"}
            </span>

            <Link
              to={`/post/${_id}`}
              className="text-blue-500 hover:text-blue-700 transition-colors flex items-center"
            >
              View Post
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default PostCard;
