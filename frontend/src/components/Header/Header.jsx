import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Cookie from "cookies-js";
import axios from "axios";
import { Menu, X, Sun, Moon, LogOut, Home, User, Search, PlusCircle, Heart, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function Header({ toggleDarkMode, isDarkMode }) {
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState(false);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const token = Cookie.get("token");
  const menuRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await axios.get(`${import.meta.env.VITE_URL}user/check-auth`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data.user);
          setAuthStatus(true);
        } catch (error) {
          setAuthStatus(false);
          console.error("Authentication check failed", error);
        }
      } else {
        setAuthStatus(false);
      }
    };

    checkAuth();
  }, [token]);

  useEffect(() => {
    let intervalRef;
    const fetchUnreadCount = async () => {
      if (!token) {
        setUnreadCount(0);
        return;
      }
      try {
        const res = await axios.get(`${import.meta.env.VITE_URL}notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setUnreadCount(res.data.unreadCount || 0);
      } catch (error) {
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();
    if (token) {
      intervalRef = setInterval(fetchUnreadCount, 15000);
    }
    return () => {
      if (intervalRef) clearInterval(intervalRef);
    };
  }, [token]);

  const handleDarkModeToggle = () => {
    toggleDarkMode();
    Cookie.set("darkMode", !isDarkMode);
  };

  useEffect(() => {
    const darkModePreference = Cookie.get("darkMode");
    if (darkModePreference === "true") {
      toggleDarkMode(true);
    }
  }, []);

  const navItems = [
    { name: "Home", slug: "/", active: true, icon: Home },
    { name: "Profile", slug: `/profile/${user?.username}`, active: authStatus, icon: User },
    { name: "Favourites", slug: "/user/favourites", active: authStatus, icon: Heart },
    { name: "Login", slug: "/login", active: !authStatus, icon: LogOut },
    { name: "Signup", slug: "/signup", active: !authStatus, icon: User },
    { name: "Add Post", slug: "/add-post", active: authStatus, icon: PlusCircle },
    { name: "Search", slug: "/search", active: authStatus, icon: Search },
    { name: `Notifications${unreadCount ? ` (${unreadCount})` : ""}`, slug: "/notifications", active: authStatus, icon: Bell },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const handleLogout = () => {
    Cookie.expire('token');
    setAuthStatus(false);
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-900 to-blue-950 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <nav className="flex items-center justify-between">
          {/* Logo with hover effect */}
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 50 50" 
              className="w-12 h-12"
            >
              <circle cx="25" cy="25" r="24" fill="#ffffff" />
              <path 
                d="M25 5 L35 15 L15 15 Z" 
                fill="#2563eb" 
              />
              <path 
                d="M10 25 L25 40 L40 25 L25 10 Z" 
                fill="#3b82f6" 
                opacity="0.7"
              />
            </svg>
            <span className="text-xl font-bold tracking-wider hidden md:block">
              BlogBuddy
            </span>
          </motion.div>

          {/* Navigation for Large Screens */}
          <div className="hidden md:flex items-center space-x-4">
            <ul className="flex items-center space-x-2">
              {navItems.map(
                (item) =>
                  item.active && (
                    <motion.li 
                      key={item.name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <button
                        onClick={() => navigate(item.slug)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-blue-800/50 transition duration-300"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </button>
                    </motion.li>
                  )
              )}
            </ul>

            {/* Dark Mode Toggle */}
            <motion.button
              onClick={handleDarkModeToggle}
              whileHover={{ rotate: 360 }}
              className="p-2 rounded-full hover:bg-blue-800/50 transition duration-300"
            >
              {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </motion.button>

            {/* Logout Button */}
            {authStatus && (
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 bg-red-600/20 hover:bg-red-600/40 px-3 py-2 rounded-full transition duration-300"
              >
                <LogOut className="w-5 h-5 text-red-400" />
                <span>Logout</span>
              </motion.button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              whileTap={{ scale: 0.9 }}
              className="p-2"
            >
              {isMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
            </motion.button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden absolute left-0 right-0 top-full bg-blue-950 shadow-lg"
            >
              <ul className="py-4 space-y-2">
                {navItems.map(
                  (item) =>
                    item.active && (
                      <motion.li
                        key={item.name}
                        whileHover={{ x: 10 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <button
                          onClick={() => {
                            navigate(item.slug);
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center space-x-3 w-full px-6 py-3 hover:bg-blue-900/50 transition"
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </button>
                      </motion.li>
                    )
                )}
                {/* Dark Mode Toggle in Mobile Menu */}
                <motion.li
                  whileHover={{ x: 10 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    onClick={() => {
                      handleDarkModeToggle();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full px-6 py-3 hover:bg-blue-900/50 transition"
                  >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                  </button>
                </motion.li>
                {authStatus && (
                  <motion.li
                    whileHover={{ x: 10 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full px-6 py-3 hover:bg-red-900/50 text-red-400 transition"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </motion.li>
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

export default Header;