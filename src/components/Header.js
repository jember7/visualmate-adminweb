import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getAuth, signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; // <-- save your logo as src/assets/logo.png

function Header({ showAdmin = false }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { currentUser, userProfile } = useAuth();
  const auth = getAuth();
  const navigate = useNavigate();

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Logout handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Sign out failed:", error.message);
    }
  };

const handleLogoClick = () => {
  if (currentUser) {
    navigate("/dashboard");
  } else {
    navigate("/");
  }
};


  return (
    <header className="flex justify-between items-center bg-white px-6 py-4 shadow-md relative">

      {/* Logo */}
      <div
        onClick={handleLogoClick}
        className={`flex items-center gap-3 cursor-pointer select-none ${
          currentUser ? "hover:opacity-80" : "cursor-default"
        }`}
      >
        <img
          src={logo}
          alt="VisualMate Logo"
          className="w-10 h-10 object-contain"
        />
        <h1 className="text-2xl font-bold">
          <span className="text-blue-600">visual</span>
          <span className="text-yellow-500">mate</span>
        </h1>
      </div>

      {/* Admin Info */}
      {showAdmin && currentUser && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="text-right font-semibold focus:outline-none"
          >
            <p className="text-lg">
              {userProfile?.name || userProfile?.fullName || "Admin User"}
            </p>
            <p className="text-sm text-gray-600">
              {currentTime.toLocaleString()}
            </p>
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-md border border-gray-200 z-50 overflow-hidden">
              <Link
                to="/profile"
                className="block px-4 py-2 hover:bg-gray-100 transition text-sm"
              >
                Profile
              </Link>

              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to log out?")) {
                    handleSignOut();
                  }
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Header;
