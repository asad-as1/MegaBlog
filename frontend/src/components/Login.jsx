import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import { Button, Input } from "./index.js";
import { useForm } from "react-hook-form";
import axios from "axios";
import Cookie from "cookies-js";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from 'sweetalert2';

// Login function
export const login = async (data, navigate, setError, from) => {
  setError("");
  try {
    const res = await axios.post(`${import.meta.env.VITE_URL}user/login`, data);
    if (res?.status === 200) {
      const val = {
        httpOnly: true,
        secure: true,
      };
      Cookie.set("token", res.data.token, val);

      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: 'You are now logged in!',
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        navigate(from || "/"); // Redirect to 'from' or home
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Login Failed',
      text: error.response?.data?.message || "Login failed. Please try again.",
    });
    setError(error.response?.data?.message || "Login failed. Please try again.");
  }
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation(); // Use useLocation to access location.state
  const from = location.state?.from || "/"; // Use the passed `from` or default to "/"

  const { register, handleSubmit } = useForm();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = Cookie.get("token");
    if (token) {
      navigate("/"); // Redirect to homepage if already logged in
    }
  }, [navigate]);

  const onSubmit = (data) => {
    login(data, navigate, setError, from); // Pass 'from' to login function
  };

  return (
    <div className="flex text-black items-center justify-center w-full mt-12 mb-12 px-4">
      <div className="w-full max-w-md bg-gray-100 rounded-xl p-6 border border-gray-300 shadow-md">
        <h2 className="text-center text-black text-2xl font-bold leading-tight mb-4">
          Sign in to your account
        </h2>
        <p className="text-center text-base text-black/60 mb-4">
          Don&apos;t have an account?&nbsp;
          <Link
            to="/signup"
            className="font-medium text-blue-600 hover:underline"
          >
            Sign Up
          </Link>
        </p>
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <Input
              label="Username: "
              placeholder="Enter your username"
              {...register("username", {
                required: true,
              })}
              className="w-full"
            />
            <div className="relative">
              <Input
                label="Password: "
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password", {
                  required: true,
                })}
                className="w-full"
              />
              <div
                className="absolute bottom-3 right-0 flex items-center pr-3 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className="text-gray-600" />
                ) : (
                  <FaEye className="text-gray-600" />
                )}
              </div>
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
