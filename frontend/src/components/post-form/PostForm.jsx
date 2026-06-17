import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, RTE, Select } from "..";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookie from "cookies-js";
import { uploadMedia } from "../../api/media";
import Swal from 'sweetalert2'; 



export default function PostForm({ post }) {
  const { register, handleSubmit, setValue, control, getValues, watch, formState: { errors }, setError } = useForm({
    defaultValues: {
      title: post?.title || "",
      categories: post?.categories || "",
      content: post?.content || "",
      isPublished: post?.isPublished || "Public",
      scheduledAt: post?.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : "",
    },
  });

  const token = Cookie.get("token");
  const [mediaPreview, setMediaPreview] = useState(post?.media?.url || "");
  const [isVideo, setIsVideo] = useState(post?.media?.isVideo || false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTime, setUploadTime] = useState(null);
  const [fileError, setFileError] = useState(""); // File input error
  const [errorMessage, setErrorMessage] = useState(""); // Error message state
  const navigate = useNavigate();
  const publishStatus = watch("isPublished");

  const submit = async (data) => {
    if (!data.media && !post?.media) {
      setFileError("Featured media is required");
      return;
    }
  
    if (!data.content) {
      setError("content", { type: "required", message: "Content is required" });
      return;
    }
  
    try {
      let newMedia = post?.media || null;
  
      // If a new media file is uploaded
      if (data.media) {
        // Upload new media
        const startTime = Date.now();
        const mediaResult = await uploadMedia(data.media, (progress) => {
          setUploadProgress(progress);
        });
        const endTime = Date.now();
        const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
  
        newMedia = {
          url: mediaResult.url,
          publicId: mediaResult.publicId,
          resourceType: mediaResult.resourceType,
          isVideo: mediaResult.resourceType === "video",
        };
        setUploadTime(timeTaken);
      }
  
      const postData = { ...data, media: newMedia };
  
      if (post) {
        await axios.put(`${import.meta.env.VITE_URL}post/${post._id}`, postData, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        Swal.fire({
          icon: "success",
          title: "Post Updated",
          text: "Your post has been updated successfully!",
          confirmButtonColor: "#3085d6",
        });
      } else {
        await axios.post(`${import.meta.env.VITE_URL}post/newPost`, postData, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        Swal.fire({
          icon: "success",
          title: "Post Created",
          text: "Your post has been created successfully!",
          confirmButtonColor: "#3085d6",
        });
      }
  
      navigate("/");
    } catch (error) {
      console.error("Error submitting post:", error);
      setErrorMessage("There was an error submitting the post. Please try again.");
  
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "There was an error submitting the post. Please try again.",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    setFileError(""); // Reset file error when new file is selected

    if (file) {
      const fileType = file.type.split("/")[0];
      setIsVideo(fileType === "video");

      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Handle video duration check if the file is a video
      if (fileType === "video") {
        const videoElement = document.createElement("video");
        videoElement.src = URL.createObjectURL(file);
        videoElement.onloadedmetadata = () => {
          if (videoElement.duration > 60) {
            setFileError("Video duration should not exceed 60 seconds.");
            setMediaPreview("");
            setValue("media", null);
            setIsVideo(false);
          } else {
            setValue("media", file);
            setUploadProgress(0);
            setUploadTime(null);
          }
        };
      } else {
        setValue("media", file);
        setUploadProgress(0);
        setUploadTime(null);
      }
    } else {
      setMediaPreview("");
      setIsVideo(false);
      setValue("media", null);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col sm:flex-row flex-wrap">
      <div className="w-full sm:w-2/3 px-2 mb-4 sm:mb-0">
        <Input
          label="Title :"
          placeholder="Title"
          className="mb-1"
          {...register("title", { required: "Title is required" })}
        />
        {errors.title && <p className="text-red-500">{errors.title.message}</p>}
        
        <Input
          label="Categories :"
          placeholder="Categories"
          className="mb-1"
          {...register("categories", { required: "Categories are required" })}
        />
        {errors.categories && <p className="text-red-500">{errors.categories.message}</p>}

        <RTE
          label="Content :"
          name="content"
          control={control}
          defaultValue={getValues("content")}
          rules={{ required: "Content is required" }}
        />
        {errors.content && <p className="text-red-500">{errors.content.message}</p>}
      </div>

      <div className="w-full sm:w-1/3 px-2">
        <Input
          label="Featured Media :"
          type="file"
          className="mb-4"
          accept="image/*,video/*"
          onChange={handleMediaChange}
        />
        {fileError && <p className="text-red-500">{fileError}</p>}
        {mediaPreview && (
          <div className="w-full mb-4">
            {isVideo ? (
              <video controls className="w-full rounded-lg">
                <source src={mediaPreview} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img src={mediaPreview} alt="Featured" className="w-full rounded-lg" />
            )}
          </div>
        )}
        {uploadProgress > 0 && (
          <div className="w-full mb-4">
            <p>Uploading: {uploadProgress}%</p>
            {uploadTime && <p>Time taken: {uploadTime} seconds</p>}
          </div>
        )}

        <Select
          options={["Public", "Private", "Scheduled"]}
          label="Status"
          className="mb-4"
          {...register("isPublished", { required: "Status is required" })}
        />
        {publishStatus === "Scheduled" && (
          <Input
            label="Schedule At :"
            type="datetime-local"
            className="mb-4"
            {...register("scheduledAt", { required: "Schedule date/time is required" })}
          />
        )}
        <Button type="submit" bgColor={post ? "bg-green-500" : undefined} className="w-full">
          {post ? "Update" : "Submit"}
        </Button>
      </div>
    </form>
  );
}
