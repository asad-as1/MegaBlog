import axios from "axios";
import Cookie from "cookies-js";

const BACKEND_URL = import.meta.env.VITE_URL;

export const uploadMedia = async (file, onProgress) => {
  const token = Cookie.get("token");
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(`${BACKEND_URL}media/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
    withCredentials: true,
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        const progress = ((event.loaded / event.total) * 100).toFixed(2);
        onProgress(progress);
      }
    },
  });

  return response.data;
};

export const deleteMedia = async ({ publicId, resourceType }) => {
  const token = Cookie.get("token");
  await axios.delete(`${BACKEND_URL}media`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
    data: { publicId, resourceType },
  });
};
