import React from "react";
import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation(); // to highlight active page

  const options = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "User Management", path: "/user-management" },
    { name: "Profile", path: "/profile" },
    { name: "Feedback and FAQs", path: "/feedback" },
  ];

  return (
    <nav className="w-60 bg-black text-white p-6 flex flex-col gap-4">
      {options.map((option) => (
        <Link
          key={option.name}
          to={option.path}
          className={`px-3 py-2 rounded-md transition hover:bg-gray-800 ${
            location.pathname === option.path ? "bg-gray-900 font-semibold" : ""
          }`}
        >
          {option.name}
        </Link>
      ))}
    </nav>
  );
}

export default Sidebar;
