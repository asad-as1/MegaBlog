import React, { useState, useEffect } from "react";
import { Container, PostCard } from "../components";
import axios from "axios";
import { 
  UserCircle2, 
  Edit2, 
  Trash2, 
  Heart, 
  ImageIcon 
} from "lucide-react";
import Button from "../components/Button";
import { Link } from "react-router-dom";

import { useNavigate, useParams } from "react-router-dom";
import Cookie from "cookies-js";
import Error from "../pages/ErrorPage";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

function Profile() {
  const navigate = useNavigate();
  const { username } = useParams();
  const [posts, setPost] = useState([]);
  const [user, setUser] = useState({});
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState(null);
  const token = Cookie.get("token");

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_URL}user/profile/${username}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );

        setUser(response.data.user);
        setPost(response.data.user.posts);
        setIsOwnProfile(response.data.isOwnProfile);
        setIsFollowing(response.data.isFollowing);

        // Fetch followers/following counts (dashboard tiles)
        const [followersRes, followingRes] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_URL}user/${response.data.user._id}/followers`,
            {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true,
            }
          ),
          axios.get(
            `${import.meta.env.VITE_URL}user/${response.data.user._id}/following`,
            {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true,
            }
          ),
        ]);

        setFollowersCount(followersRes.data.followers?.length || 0);
        setFollowingCount(followingRes.data.following?.length || 0);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setError("Failed to load user data. Please try again later.");
      }
    };
    fetchUserData();
  }, [username, token]);

  const totalHiddenPosts = posts.filter(
    (post) => post.isPublished === "Private"
  ).length;

  const handleDeleteAccount = async () => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone. All your data will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete Account",
      cancelButtonText: "Cancel",
    });
  
    if (result.isConfirmed) {
      try {
        await axios.delete(`${import.meta.env.VITE_URL}user/delete`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
  
        // Expire user session
        Cookie.expire("token");
  
        MySwal.fire({
          title: "Account Deleted",
          text: "Your account has been permanently removed.",
          icon: "success",
          confirmButtonColor: "#3085d6",
        }).then(() => {
          navigate("/login");
        });
      } catch (error) {
        console.error("Failed to delete account:", error);
        MySwal.fire({
          icon: "error",
          title: "Deletion Failed",
          text: "An error occurred while deleting your account. Please try again.",
        });
      }
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await axios.delete(`${import.meta.env.VITE_URL}user/follow/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setIsFollowing(false);
      } else {
        await axios.post(
          `${import.meta.env.VITE_URL}user/follow/${user._id}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
        setIsFollowing(true);
      }
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Action failed",
        text: "Unable to update follow status.",
      });
    }
  };
  

  if (error) {
    return (
      <Container>
        <div className="py-8">
          <Error message={error} />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mt-8 mb-8 w-full min-h-screen py-12 px-4 rounded-lg">
        <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden">
          {/* Profile Header */}
          <div className="relative bg-gradient-to-r from-blue-900 to-blue-950 text-white p-8">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
              <div className="relative">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <UserCircle2 className="w-32 h-32 text-white/80" />
                )}
                {isOwnProfile && (
                  <button 
                    onClick={() => navigate("/user/edit-profile")}
                    className="absolute bottom-0 right-0 bg-white/80 rounded-full p-2 hover:bg-white/50 transition"
                  >
                    <Edit2 className="w-5 h-5 text-black" />
                  </button>
                )}
              </div>
              
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold">{user.username}</h2>
                <p className="text-xl opacity-80 mt-2">{user.name}</p>
                
<div className="flex justify-center md:justify-start space-x-8 mt-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{posts.length}</div>
                    <div className="text-sm opacity-80">Total Posts</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${user.username}/followers`)}
                    className="text-center hover:opacity-90 transition"
                  >
                    <div className="text-3xl font-bold">{followersCount}</div>
                    <div className="text-sm opacity-80">Followers</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${user.username}/following`)}
                    className="text-center hover:opacity-90 transition"
                  >
                    <div className="text-3xl font-bold">{followingCount}</div>
                    <div className="text-sm opacity-80">Following</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-8">
            {isOwnProfile && (
              <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium text-black">{user.email}</span>
                </div>
              </div>
            )}
            
            {user.bio && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-900 mb-2">About Me</h3>
                <p className="text-gray-700">{user.bio}</p>
              </div>
            )}

            {isOwnProfile && (
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <Button 
                  onClick={() => navigate("/user/favourites")} 
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition duration-300"
                >
                  <Heart className="w-5 h-5" />
                  <span>Your Favourites</span>
                </Button>
                <Button
                  onClick={() => handleDeleteAccount(user.profilePicture)}
                  className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg transition duration-300"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Delete Account</span>
                </Button>
              </div>
            )}
            {!isOwnProfile && (
              <Button
                onClick={handleFollowToggle}
                className={`${
                  isFollowing ? "bg-gray-700" : "bg-blue-600"
                } text-white py-3 px-6 rounded-lg transition duration-300`}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}
          </div>

          {/* Posts Section */}
          <div className="bg-gray-100 p-8">
            <h2 className="text-3xl font-bold text-center text-blue-900 mb-8">
              {isOwnProfile ? "Your Posts" : `${user.username}'s Posts`}
            </h2>
            
            {posts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-xl text-gray-600">No posts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                {posts
                  .filter((post) => isOwnProfile || post.isPublished === "Public")
                  .map((post) => (
                    <div 
                      key={post._id} 
                      className="bg-white rounded-lg shadow-md overflow-hidden transform transition hover:scale-105"
                    >
                      <PostCard {...post} />
                      {isOwnProfile && (
                        <div className="p-3 bg-gray-50 text-center">
                          <span className={`
                            inline-block px-3 py-1 rounded-full text-sm font-medium 
                            ${post.isPublished === 'Public' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                            }
                          `}>
                            {post.isPublished} Post
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}

export default Profile;