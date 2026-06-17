import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home.jsx";
import { Login } from "./components/index.js";
import AddPost from "./pages/AddPost";
import Signup from "./pages/Signup";
import EditPost from "./pages/EditPost";
import SinglePost from "./pages/SinglePost.jsx"
import Profile from "./pages/Profile.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import Favourites from "./pages/Favourites.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import Search from "./pages/Search.jsx";
import NotFound from "./pages/NotFound.jsx";
import Notifications from "./pages/Notifications.jsx";
import FollowersList from "./pages/FollowersList.jsx";


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/signup",
        element: <Signup />,
      },
      {
        path: "/search",
        element: (
          <ProtectedRoute element={<Search />} />
        ),
      },
      {
        path: "/notifications",
        element: <ProtectedRoute element={<Notifications />} />,
      },
      {
        path: "/profile/:username",
        element: (
          <ProtectedRoute element={<Profile />} />
        ),
      },
      {
        path: "/profile/:username/followers",
        element: (
          <ProtectedRoute element={<FollowersList type="followers" />} />
        ),
      },
      {
        path: "/profile/:username/following",
        element: (
          <ProtectedRoute element={<FollowersList type="following" />} />
        ),
      },
      {
        path: "user/edit-profile",
        element: (
          <ProtectedRoute element={<EditProfile />} />
        ),
      },
      {
        path: "/add-post",
        element: (
          <ProtectedRoute element={<AddPost />} />
        ),
      },
      {
        path: "/user/favourites",
        element: (
          <ProtectedRoute element={<Favourites />} />
        ),
      },
      {
        path: "/post/:id",
        element: (
          <ProtectedRoute element={<SinglePost />} />
        ),
      },
      {
        path: "/edit-post/:slug",
        element: (
          <ProtectedRoute element={<EditPost />} />
        ),
      },
      {
        path: "*",
        element: <NotFound />,
      }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
