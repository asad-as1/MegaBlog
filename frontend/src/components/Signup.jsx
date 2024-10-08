import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "./index.js";
import { useForm } from "react-hook-form";
import { login } from "./Login.jsx"; // Import login function
import { upload } from "../firebase.js";
import axios from "axios";
import Cookie from "cookies-js";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import the eye icons
import Swal from "sweetalert2"; // Import SweetAlert

function Signup({ user, location }) { // Receive location as a prop
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors } // Destructure the errors object
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
  const [showPassword, setShowPassword] = useState(false); // State for toggling password visibility

  useEffect(() => {
    if (user) {
      reset({
        _id: user._id || "",
        username: user.username || "",
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
      });
    }
  }, [user, reset]);

  const handleRegister = async (data) => {
    try {
      // Upload profile picture if provided
      if (data.profilePicture && data.profilePicture.length > 0) {
        const file = data.profilePicture[0];
        const url = await upload(file);
        data.profilePicture = url;
      } else {
        data.profilePicture = user?.profilePicture || "";
      }
  
      let res;
      if (user) {
        // Update user profile
        res = await axios.put(`${import.meta.env.VITE_URL}user/profile`, data, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        if (res?.status === 201) {
          await Swal.fire({
            icon: "success",
            title: "Profile Updated Successfully",
            confirmButtonText: "OK",
            confirmButtonColor: "#007BFF", // Set the confirm button color to blue
          }).then(() => {
            reset(); // Reset after the alert
            navigate("/"); // Navigate after resetting
          });
        }
      } else {
        // Register new user
        res = await axios.post(`${import.meta.env.VITE_URL}user/register`, data);
        if (res?.status === 201) {
          await Swal.fire({
            icon: "success",
            title: "Successfully Registered",
            confirmButtonText: "OK",
            confirmButtonColor: "#007BFF", // Set the confirm button color to blue
          }).then(() => {
            // Log the user in after successful registration
            login(data, navigate, () => {}, "/"); // Pass 'from' to login function for redirection
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
        confirmButtonColor: "#007BFF", // Set the confirm button color to blue
      });
    }
  };
  

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  return (
    <div className="text-black flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-gray-100 rounded-xl p-6 border border-gray-300 shadow-md">
        {!user && (
          <div>
            <h2 className="text-center text-black text-xl sm:text-2xl font-bold leading-tight mb-4">
              Sign up to create an account
            </h2>
            <p className="text-center text-sm sm:text-base text-black/60 mb-4">
              Already have an account?&nbsp;
              <Link
                to="/login"
                className="font-medium text-blue-600 transition-all duration-200 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        )}
        {user && (
          <div>
            <h2 className="text-center text-black text-xl sm:text-2xl font-bold leading-tight mb-4">
              Edit Your Profile
            </h2>
          </div>
        )}

        <form onSubmit={handleSubmit(handleRegister)} className="space-y-4">
          <div className="space-y-4">
            {!user && (
              <Input
                label="Username: "
                placeholder="Username"
                {...register("username", {
                  required: true,
                })}
                className="w-full"
              />
            )}
            <Input
              label="Full Name: "
              placeholder="Enter your full name"
              {...register("name", {
                required: true,
              })}
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
                    "Email address must be a valid address",
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
              {...register("bio", {
                required: false,
              })}
              className="w-full"
            />
            {user && user.profilePicture && (
              <div className="text-center">
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="mb-2 rounded-full h-24 w-24 mx-auto"
                />
                <p className="text-gray-500">Current Profile Picture</p>
              </div>
            )}
            <Input
              label="Profile Picture"
              type="file"
              {...register("profilePicture", {
                required: false,
              })}
              className="w-full"
            />
            <Button type="submit" className="w-full mt-4">
              {user ? "Save Changes" : "Create Account"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;
