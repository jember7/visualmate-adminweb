// src/pages/ChangePassword.js
import React, { useState } from "react";
import { auth, db } from "../firebase";
import { updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

function ChangePassword({ user }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("❌ Passwords do not match!");
      return;
    }

    try {
      setLoading(true);

      // 1. Update Firebase Auth password
      await updatePassword(auth.currentUser, newPassword);

      // 2. Update Firestore to mark reset complete
      await updateDoc(doc(db, "users", user.uid), {
        forcePasswordReset: false,
      });

      alert("✅ Password updated successfully!");
      window.location.href = "/dashboard"; // redirect to dashboard
    } catch (error) {
      console.error(error.message);
      alert("❌ Failed to update password: " + error.message);
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-96">
        <h2 className="text-2xl font-bold mb-4">Change Your Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="border w-full px-3 py-2 rounded-md"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="border w-full px-3 py-2 rounded-md"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md w-full hover:bg-blue-700 transition"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
