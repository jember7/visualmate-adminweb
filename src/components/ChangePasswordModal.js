// ChangePasswordModal.jsx
import React, { useState } from "react";
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ChangePasswordModal({ open, onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [strength, setStrength] = useState("");
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const auth = getAuth();

  const checkPasswordStrength = (password) => {
    if (!password) return { label: "", score: 0 };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { label: "Weak", score: 25 };
    if (score === 2) return { label: "Medium", score: 50 };
    if (score === 3) return { label: "Strong", score: 75 };
    return { label: "Very strong", score: 100 };
  };

  const handlePasswordChange = async () => {
    setError("");
    if (!newPassword || !confirmPassword || !currentPassword) {
      setError("Please fill all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    const pwStrength = checkPasswordStrength(newPassword);
    if (pwStrength.score < 50) {
      setError("Please choose a stronger password (at least Medium).");
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("User not authenticated");

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      // success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStrength("");
      setError("");
      onClose();
      // optional toast: alert("Password changed successfully!");
    } catch (err) {
      console.error(err);
      // friendly error messages
      if (err.code === "auth/wrong-password" || err.message?.toLowerCase().includes("wrong")) {
        setError("Current password is incorrect.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak.");
      } else {
        setError("Failed to change password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // keep strength updated as user types
  const handleNewPasswordChange = (v) => {
    setNewPassword(v);
    const s = checkPasswordStrength(v);
    setStrength(s.label ? `${s.label}` : "");
  };

  if (!open) return null;

  // small helper for colors
  const strengthColor = (label) => {
    if (!label) return "bg-gray-200";
    if (label === "Weak") return "bg-red-500";
    if (label === "Medium") return "bg-yellow-400";
    if (label === "Strong") return "bg-green-500";
    return "bg-green-700";
  };

  const strengthWidth = (label) => {
    if (!label) return "w-0";
    if (label === "Weak") return "w-1/4";
    if (label === "Medium") return "w-1/2";
    if (label === "Strong") return "w-3/4";
    return "w-full";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 id="change-password-title" className="text-xl font-semibold text-gray-800 text-center mb-3">
          Change Password
        </h2>

        <p className="text-sm text-gray-500 text-center mb-4">
          For security, please enter your current password and choose a new strong password.
        </p>

        <div className="space-y-3">
          {/* Current */}
          <div className="relative">
            <label className="text-xs font-medium text-gray-600">Current password</label>
            <input
              aria-label="Current password"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((s) => !s)}
              className="absolute right-2 top-8 text-gray-500"
              aria-label={showCurrent ? "Hide current password" : "Show current password"}
            >
              {showCurrent ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* New */}
          <div className="relative">
            <label className="text-xs font-medium text-gray-600">New password</label>
            <input
              aria-label="New password"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => handleNewPasswordChange(e.target.value)}
              className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="At least 8 characters, mix of letters and numbers"
            />
            <button
              type="button"
              onClick={() => setShowNew((s) => !s)}
              className="absolute right-2 top-8 text-gray-500"
              aria-label={showNew ? "Hide new password" : "Show new password"}
            >
              {showNew ? <FaEyeSlash /> : <FaEye />}
            </button>

            {/* Strength bar */}
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded overflow-hidden">
                <div
                  className={`${strengthColor(strength)} ${strengthWidth(strength)} h-full transition-all duration-300`}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>{strength ? strength : ""}</span>
                <span>{newPassword.length > 0 ? `${newPassword.length} chars` : ""}</span>
              </div>
            </div>
          </div>

          {/* Confirm */}
          <div className="relative">
            <label className="text-xs font-medium text-gray-600">Confirm new password</label>
            <input
              aria-label="Confirm new password"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Repeat new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              className="absolute right-2 top-8 text-gray-500"
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={handlePasswordChange}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 transition"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : null}
            <span>{loading ? "Saving..." : "Save password"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
