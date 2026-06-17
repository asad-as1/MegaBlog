import React, { useEffect, useState } from "react";
import { Container, PostCard } from "../components"; // Import the Error component
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookie from "cookies-js";
import Error from "../pages/ErrorPage";

function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [totalPages, setTotalPages] = useState(1);

  const token = Cookie.get("token");
  const BACKEND_URL = import.meta.env.VITE_URL;


  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        setLoading(true);
        try {
          const res = await axios.get(`${BACKEND_URL}user/check-auth`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res?.data?.user);
        } catch (error) {
          setError("Authentication check failed. Please log in.");
          console.error("Authentication check failed", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  useEffect(() => {
    // Pagination switch ke time page top pe scroll reset
    window.scrollTo({ top: 0, behavior: "instant" });

    const fetchPosts = async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}post/allPosts?page=${page}&limit=${limit}`
        );

        setPosts(res.data.posts || []);
        setTotalPages(res.data.totalPages || 1);
        setLoading(false);
      } catch (error) {
        setError("Failed to fetch posts. Please try again later.");
        console.error("Request failed", error);
      }
    };

    fetchPosts();
  }, [page, limit]);



  // Loading state
  if (loading) {
    return <div className="w-full py-8 mt-4 text-center">Loading...</div>;
  }

  // Display error message if any
  if (error) {
    return (
      <Container>
        <Error message={error} />
      </Container>
    );
  }

  // Main posts rendering logic based on user role

  const getPageButtons = () => {
    // 1 2 3 4 5 next/prev with shift around current page
    const windowSize = 5;
    if (totalPages <= windowSize) return Array.from({ length: totalPages }, (_, i) => i + 1);

    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + windowSize - 1);

    // adjust if end hits boundary
    start = Math.max(1, end - windowSize + 1);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const pageButtons = getPageButtons();

  return (
    <div className="w-full py-8">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map(
            (post) =>
              (user?.id === post?.author || user?.role === "admin" || post?.isPublished === "Public") && (
                <div key={post._id} className="p-2">
                  <PostCard {...post} />
                  {(user?.role === "admin" || user?.id === post?.author) &&
                    post.isPublished !== "Public" && (
                      <h2 className="text-center text-xl mt-1">Private Post</h2>
                    )}
                </div>
              )
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            className={`px-3 py-1 rounded-md border ${page === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>

          {pageButtons.map((p) => (
            <button
              key={p}
              className={`px-3 py-1 rounded-md border ${p === page ? "bg-blue-900 text-white border-blue-900" : "hover:bg-gray-50"}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}

          <button
            className={`px-3 py-1 rounded-md border ${page === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </Container>
    </div>
  );
}

export default Home;