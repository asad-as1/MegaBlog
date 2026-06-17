import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button, Input } from "./index.js";
import { useForm } from "react-hook-form";
import axios from "axios";
import Cookie from "cookies-js";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";
import Side from "./Side.jsx";

// Login function
export const login = async (data, navigate, setError, from) => {
  setError("");
  try {
    const res = await axios.post(`${import.meta.env.VITE_URL}user/login`, data);
    if (res?.status === 200) {
      Cookie.set("token", res.data.token, {
        // httpOnly cannot be set reliably from client-side; keep cookie usable in browser.
        httpOnly: false,
        secure: import.meta.env.PROD,
        sameSite: import.meta.env.PROD ? "none" : "lax",
      });


      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: "You are now logged in!",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        navigate(from || "/");
      });
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Login Failed",
      timer: 1500,
      showConfirmButton: false,
      text: error.response?.data?.message || "Login failed. Please try again.",
    });
    setError(error.response?.data?.message || "Login failed. Please try again.");
  }
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const { register, handleSubmit } = useForm();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = Cookie.get("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  const onSubmit = (data) => {
    login(data, navigate, setError, from);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row -mt-2">
      {/* Left Side - Website Description */}
      
      <Side />

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-xl p-8 shadow-lg border border-gray-200">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Sign in to your account
            </h2>
            <p className="text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-600 hover:underline font-semibold"
              >
                Sign Up
              </Link>
            </p>
          </div>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Username:"
              placeholder="Enter your username"
              {...register("username", { required: true })}
              className="w-full"
            />
            <div className="relative">
              <Input
                label="Password:"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password", { required: true })}
                className="w-full"
              />
              <span
                className="absolute bottom-3 right-0 flex items-center pr-3 cursor-pointer text-gray-500"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <Button type="submit" className="w-full mt-4">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
