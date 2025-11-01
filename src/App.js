import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import Profile from "./pages/Profile";
import Feedback from "./pages/Feedback";
import { useAuth } from "./context/AuthContext";

function App() {
  const { userRole } = useAuth() || {};  // ✅ fallback if undefined

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Admin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/user-management"
          element={<UserManagement currentUserRole={userRole} />}
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/feedback" element={<Feedback />} />
      </Routes>
    </Router>
  );
}

export default App;
