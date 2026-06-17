import axios from "axios";
import Cookie from "cookies-js";

const BACKEND_URL = import.meta.env.VITE_URL;

export const saveAccessToken = (token) => {
  Cookie.set("token", token, {
    secure: window.location.protocol === "https:",
    sameSite: "Lax",
  });
};

export const clearAccessToken = () => {
  Cookie.expire("token");
};

export const refreshAccessToken = async () => {
  const response = await axios.post(
    `${BACKEND_URL}user/refresh-token`,
    {},
    { withCredentials: true }
  );

  saveAccessToken(response.data.token);
  return response.data.token;
};

export const setupAuthInterceptor = () => {
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const isAuthRequest =
        originalRequest?.url?.includes("/user/login") ||
        originalRequest?.url?.includes("/user/register") ||
        originalRequest?.url?.includes("/user/refresh-token");

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isAuthRequest
      ) {
        originalRequest._retry = true;

        try {
          const token = await refreshAccessToken();
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          originalRequest.withCredentials = true;
          return axios(originalRequest);
        } catch (refreshError) {
          clearAccessToken();
        }
      }

      return Promise.reject(error);
    }
  );
};
