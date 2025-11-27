// Admin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import Header from "../components/Header";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

function Admin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // ensure persistence
      await setPersistence(auth, browserLocalPersistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // fetch user profile from Firestore
      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        // sign out to clean auth state and show message
        try { await signOut(auth); } catch (sErr) { console.warn("signOut after missing profile failed:", sErr); }
        setErrorMsg("User profile not found. Please contact support.");
        setLoading(false);
        return;
      }

      const userData = userSnap.data();

      // role check
      const role = (userData.role || "").toString().toLowerCase();
      if (!["admin", "superadmin"].includes(role)) {
        try { await signOut(auth); } catch (sErr) { console.warn("signOut after role rejected failed:", sErr); }
        setErrorMsg("You do not have permission to access the admin panel.");
        setLoading(false);
        return;
      }

      // active flag check
      // treat anything other than strict true as inactive
      // Check active flag
if (userData.active !== true) {
  setErrorMsg("This account has been deactivated. Please contact your supervisor or administrator.");
  setLoading(false);

  // sign out AFTER showing the error
  setTimeout(async () => {
    try { await signOut(auth); } catch {}
  }, 200);

  return;
}

      // success: navigate to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      // friendlier known messages
      const code = err?.code || "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-email") {
        setErrorMsg("Invalid email or password.");
      } else if (code === "auth/too-many-requests") {
        setErrorMsg("Too many attempts. Please try again later or reset your password.");
      } else {
        // fallback to server message if available
        setErrorMsg(err?.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // PASSWORD RESET FLOW
  const openResetModal = () => {
    setResetEmail(email || "");
    setResetMessage("");
    setResetModalOpen(true);
  };

  const handleSendReset = async () => {
    setResetMessage("");
    if (!resetEmail || !resetEmail.includes("@")) {
      setResetMessage("Please enter a valid email address.");
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("A password reset email was sent. Check your inbox.");
    } catch (err) {
      console.error("Password reset failed:", err);
      const code = err?.code || "";
      if (code === "auth/user-not-found") {
        setResetMessage("No account found with that email.");
      } else if (code === "auth/invalid-email") {
        setResetMessage("Invalid email address.");
      } else {
        setResetMessage(err?.message || "Failed to send reset email. Try again.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="app-container flex flex-col min-h-screen">
      <Header showAdmin={false} />

      <main
        className="flex-1 flex items-center justify-center"
        style={{
          background:
            "linear-gradient(180deg, rgba(4,6,8,0.9) 0%, rgba(15,15,15,0.95) 50%, rgba(2,6,10,1) 100%)",
        }}
      >
        <div className="w-full max-w-md mx-4">
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div className="px-8 py-6 border-b" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
              <h2 className="text-2xl text-white font-semibold">Admin Login</h2>
              <p className="text-sm text-gray-300 mt-1">Sign in with your administrator account</p>
            </div>

            <form onSubmit={handleLogin} className="px-8 py-6">
              {/* Email */}
              <label className="block mb-3">
                <div className="flex items-center text-xs text-gray-300 mb-2">Email</div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaEnvelope />
                  </span>
                  <input
                    type="email"
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent border border-gray-700 text-white placeholder-gray-400 rounded-lg px-10 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </label>

              {/* Password */}
              <label className="block mb-4">
                <div className="flex items-center text-xs text-gray-300 mb-2">Password</div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaLock />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-transparent border border-gray-700 text-white placeholder-gray-400 rounded-lg px-10 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </label>

              {/* Error message */}
              {errorMsg && (
                <div className="mb-4 text-sm text-red-400 bg-red-900/20 p-2 rounded">
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg px-5 py-3 shadow"
                >
                  {loading && (
                    <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"></circle>
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75"></path>
                    </svg>
                  )}
                  <span>{loading ? "Signing in..." : "Login"}</span>
                </button>

                <button type="button" className="text-sm text-gray-300 hover:text-white" onClick={() => {
                  openResetModal();
                }}>
                  Forgot password?
                </button>
              </div>
            </form>

            <div className="px-8 py-4 text-center text-xs text-gray-500 border-t" style={{ borderColor: "rgba(255,255,255,0.02)" }}>
              Secure admin access • VisualMate
            </div>
          </div>
        </div>
      </main>

      {/* Password reset modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Reset Password</h3>
            <p className="text-sm text-gray-600 mb-4">Enter the email address for the account and we'll send a reset link.</p>

            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full p-3 border rounded mb-3"
            />

            {resetMessage && <p className="text-sm mb-3" style={{ color: resetMessage.startsWith("A password") ? "#065f46" : "#b91c1c" }}>{resetMessage}</p>}

            <div className="flex justify-end gap-2">
              <button onClick={() => setResetModalOpen(false)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
              <button
                onClick={handleSendReset}
                disabled={resetLoading}
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {resetLoading ? "Sending..." : "Send reset email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
