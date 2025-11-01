import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getAuth, signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
function Header({ showAdmin = false }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { currentUser } = useAuth();
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
const { userProfile } = useAuth();
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/"); // ✅ go back to login page
    } catch (error) {
      console.error("Sign out failed:", error.message);
    }
  };

  return (
    <header className="dashboard-header flex justify-between items-center bg-white py-4 px-6 shadow-md relative">
      {/* Logo */}
      <h1 className="text-2xl font-bold text-blue-600">VisualMate</h1>

      {/* Admin info + time */}
      {showAdmin && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="text-right font-semibold focus:outline-none"
          >
            {/* ✅ Prefer fullName, fallback to username */}
            {userProfile?.fullName || userProfile?.username || "Unknown User"}
            <p className="text-sm text-gray-600">
              {currentTime.toLocaleString()}
            </p>
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md border border-gray-200 z-50">
              <Link
                to="/profile"
                className="block px-4 py-2 hover:bg-gray-100 transition"
              >
                Profile
              </Link>
<button
  onClick={() => {
    if (window.confirm("Are you sure you want to log out?")) {
      handleSignOut();
    }
  }}
  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
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
