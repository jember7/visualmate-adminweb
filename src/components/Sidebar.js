// Sidebar.jsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAuth, signOut } from "firebase/auth";

/**
 * Props:
 *  - onLogout?: () => Promise<void> | void (optional)
 */
export default function Sidebar({ onLogout } = {}) {
  const location = useLocation();
  const navigate = useNavigate();
   const { currentUser, userProfile } = useAuth();
    const auth = getAuth();
  const options = [
    { name: "Dashboard", path: "/dashboard", icon: "dashboard" },
    { name: "User Management", path: "/user-management", icon: "users" },
    { name: "Profile", path: "/profile", icon: "user" },
    { name: "Feedback & FAQs", path: "/feedback", icon: "help" },
  ];

 const handleSignOut = async () => {
  try {
    await signOut(auth);
    navigate("/"); // send user to login page
  } catch (error) {
    console.error("Sign out failed:", error.message);
  }
};

  const Icon = ({ name, className = "w-5 h-5" }) => {
    // inline SVGs for common icons — extend as needed
    switch (name) {
      case "dashboard":
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth="1.5" />
          </svg>
        );
      case "users":
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M17 21v-2a4 4 0 0 0-3-3.87" strokeWidth="1.5" />
            <path d="M7 21v-2a4 4 0 0 1 3-3.87" strokeWidth="1.5" />
            <circle cx="12" cy="7" r="3" strokeWidth="1.5" />
          </svg>
        );
      case "user":
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="1.5" />
            <circle cx="12" cy="7" r="4" strokeWidth="1.5" />
          </svg>
        );
      case "help":
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9.09 9a3 3 0 1 1 5.82 1c0 1.5-1.5 2.2-2.5 2.8" strokeWidth="1.5" />
            <path d="M12 17h.01" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
          </svg>
        );
      case "logout":
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="1.5" />
            <path d="M16 17l5-5-5-5" strokeWidth="1.5" />
            <path d="M21 12H9" strokeWidth="1.5" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-100 shadow-xl sticky top-0">

      {/* top brand / avatar */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center text-white text-lg font-bold shadow-lg">
          VM
        </div>
        <div>
          <div className="text-sm font-semibold">VisualMate</div>
          <div className="text-xs text-slate-300">Admin Panel</div>
        </div>
      </div>

      {/* nav items */}
      <nav className="px-3 mt-4 flex-1">
        <ul className="space-y-1">
          {options.map((option) => {
            const active = location.pathname === option.path;
            return (
              <li key={option.path}>
                <Link
                  to={option.path}
                  className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                    ${active ? "bg-gradient-to-r from-indigo-600 to-emerald-400 text-white shadow" : "text-slate-200 hover:bg-slate-700/40"}
                    `}
                >
                  <span
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-md
                      ${active ? "bg-white/10" : "bg-white/5 group-hover:bg-white/10"}
                    `}
                  >
                    <Icon name={option.icon} className="w-5 h-5 text-current" />
                  </span>

                  <span className="flex-1 text-sm font-medium">{option.name}</span>

                  {/* right-side small pill for active */}
                  {active && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/10 text-white">
                      Active
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* bottom area */}
      <div className="px-4 py-4 border-t border-slate-700">
        
<button
  onClick={handleSignOut}
  className="w-full flex items-center gap-3 justify-center px-3 py-2 rounded-lg bg-transparent hover:bg-red-600/20 transition text-red-400 border border-transparent hover:border-red-600"
>
  <Icon name="logout" className="w-5 h-5 text-red-400" />
  <span className="text-sm font-medium">Log out</span>
</button>

      </div>
    </aside>
  );
}
