import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookie from "cookies-js";
import { Link, useNavigate, useParams } from "react-router-dom";
import UserSearchCard from "../components/UserSearchCard";
import { Container, PostCard } from "../components";

const FollowersList = ({ type = "followers" }) => {
  const token = Cookie.get("token");
  const navigate = useNavigate();
  const { username } = useParams();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        // First get user by username to obtain id
        const profileRes = await axios.get(
          `${import.meta.env.VITE_URL}user/profile/${username}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );

        const userId = profileRes.data.user?._id;
        if (!userId) throw new Error("User not found");

        const res = await axios.get(
          `${import.meta.env.VITE_URL}user/${userId}/${type}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );

        const list = type === "followers" ? res.data.followers : res.data.following;
        setUsers(Array.isArray(list) ? list : []);
      } catch (e) {
        setError("Failed to load users.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [username, type, token]);

  const filteredUsers = users.filter((u) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      (u.username || "").toLowerCase().includes(q) ||
      (u.name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen py-12 px-4">
      <Container>
        <div className="max-w-3xl mx-auto bg-white shadow-2xl rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-bold text-blue-900 capitalize">
              {type} of {username}
            </h1>
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-blue-700 hover:underline"
              type="button"
            >
              Back
            </button>
          </div>

          <div className="mb-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${type}...`}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-gray-500">No users found.</p>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((u) => (
                <Link
                  key={u._id}
                  to={`/profile/${u.username}`}
                  className="flex items-center justify-between p-4 rounded-xl border hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={u.profilePicture}
                      alt={u.username}
                      className="w-10 h-10 rounded-full object-cover bg-gray-100"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{u.username}</p>
                      <p className="text-sm text-gray-600 truncate">{u.name}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default FollowersList;

