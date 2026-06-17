import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "./index.js";
import { useForm } from "react-hook-form";
import { uploadMedia } from "../api/media.js";
import axios from "axios";
import Cookie from "cookies-js";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";
import Side from "./Side.jsx";


function Signup({ user }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "",
      name: "",
      email: "",
      bio: "",
    },
  });

  const token = Cookie.get("token");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTime, setUploadTime] = useState(null);

  useEffect(() => {
    if (user) {
      reset({
        _id: user._id || "",
        username: user.username || "",
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        profilePicturePublicId: user.profilePicturePublicId || "",
      });
    }
  }, [user]);

  const handleRegister = async (data) => {
    try {
      // Upload profile picture if provided
      if (data.profilePicture && data.profilePicture.length > 0) {
        const file = data.profilePicture[0];
  
        // Validate if the file is an image
        if (!file.type.startsWith("image/")) {
          await Swal.fire({
            icon: "error",
            title: "Invalid File Type",
            text: "Only image files are allowed for the profile picture.",
            confirmButtonText: "OK",
            confirmButtonColor: "#007BFF",
          });
          return; // Stop execution
        }
  
        const startTime = Date.now();
  
        const mediaResult = await uploadMedia(file, (progress) => {
          setUploadProgress(progress);
        });
  
        const endTime = Date.now();
        setUploadTime(((endTime - startTime) / 1000).toFixed(2));
        data.profilePicture = mediaResult.url;
        data.profilePicturePublicId = mediaResult.publicId;
      } else {
        data.profilePicture = user?.profilePicture || "";
        data.profilePicturePublicId = user?.profilePicturePublicId || "";
      }
  
      let res;
      if (user) {
        res = await axios.put(`${import.meta.env.VITE_URL}user/profile`, data, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        if (res?.status === 201) {
          await Swal.fire({
            icon: "success",
            title: "Profile Updated Successfully",
            confirmButtonText: "OK",
            confirmButtonColor: "#007BFF",
          }).then(() => {
            reset();
            navigate("/");
          });
        }
      } else {
        res = await axios.post(`${import.meta.env.VITE_URL}user/register`, data);
        if (res?.status === 201) {
          Cookie.set("token", res.data.token, {
            secure: window.location.protocol === "https:",
            sameSite: "Lax",
          });

          await Swal.fire({
            icon: "success",
            title: "Account Created",
            text: "Welcome to BlogBuddy!",
            timer: 1500,
            showConfirmButton: false,
            confirmButtonColor: "#007BFF",
          }).then(() => {
            reset();
            navigate("/");
          });
        }
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || "Something went wrong!";
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonText: "OK",
        confirmButtonColor: "#007BFF",
      });
    }
  };
  

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row -mt-10">
      {/* Left Side - Website Description */}
      <Side />

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-xl p-8 shadow-lg border border-gray-200">
          {!user && (
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Sign up to create an account
              </h2>
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Sign In
                </Link>
              </p>
            </div>
          )}

          {user && (
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Edit Your Profile
              </h2>
            </div>
          )}

          <form onSubmit={handleSubmit(handleRegister)} className="space-y-4">
            {!user && (
              <Input
                label="Username: "
                placeholder="Username"
                {...register("username", { required: true })}
                className="w-full"
              />
            )}
            <Input
              label="Full Name: "
              placeholder="Enter your full name"
              {...register("name", { required: true })}
              className="w-full"
            />
            <Input
              label="Email: "
              placeholder="Enter your email"
              type="email"
              {...register("email", {
                required: true,
                validate: {
                  matchPattern: (value) =>
                    /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value) ||
                    "Email address must be valid",
                },
              })}
              className="w-full"
            />
            {!user && (
              <div>
                <div className="relative">
                  <Input
                    label="Password: "
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password", {
                      required: "Password is required",
                      validate: {
                        minLength: (value) =>
                          value.length >= 8 ||
                          "Password must be at least 8 characters long",
                        hasUpperCase: (value) =>
                          /[A-Z]/.test(value) ||
                          "Password must contain at least one uppercase letter",
                        hasSpecialChar: (value) =>
                          /[!@#$%^&*(),.?":{}|<>]/.test(value) ||
                          "Password must contain at least one special character",
                        hasDigit: (value) =>
                          /\d/.test(value) ||
                          "Password must contain at least one digit",
                      },
                    })}
                    className="w-full"
                  />
                  <span
                    className="absolute bottom-3 right-0 flex items-center pr-3 cursor-pointer text-gray-500"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {errors.password && (
                  <p className="text-red-600 text-center mt-2">
                    {errors.password.message}
                  </p>
                )}
              </div>
            )}
            <Input
              label="Bio: "
              type="text"
              placeholder="Enter your Bio"
              {...register("bio")}
              className="w-full"
            />
            <Input
              label="Profile Picture"
              type="file"
              {...register("profilePicture")}
              className="w-full"
            />
             {/* Upload Progress UI */}
             {uploadProgress > 0 && (
              <div className="w-full mb-4">
                <p className="text-gray-700 font-medium">
                  Uploading: {uploadProgress}%
                </p>
                {uploadTime && (
                  <p className="text-gray-500">Time taken: {uploadTime} seconds</p>
                )}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            <Button type="submit" className="w-full mt-4">
              {user ? "Save Changes" : "Create Account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
