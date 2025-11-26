// Admin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import Header from "../components/Header";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

function Admin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // Make auth persistence explicit
      await setPersistence(auth, browserLocalPersistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      console.log("Signed in (login):", uid, userCredential.user.email);

      // fetch user profile from Firestore
      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        // no profile -> sign out and show error
        await signOut(auth);
        setErrorMsg("User profile not found. Contact support.");
        setLoading(false);
        return;
      }

      const userData = userSnap.data();

      // Check role
      const role = (userData.role || "").toString().toLowerCase();
      if (!["admin", "superadmin"].includes(role)) {
        await signOut(auth);
        setErrorMsg("You do not have permission to log in.");
        setLoading(false);
        return;
      }

      // Check active flag: must be true
      if (userData.active !== true) {
        await signOut(auth);
        setErrorMsg("This account is inactive. Contact your administrator.");
        setLoading(false);
        return;
      }

      // All good
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      // show friendlier messages for known errors
      const code = err?.code || "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-email") {
        setErrorMsg("Invalid email or password.");
      } else {
        setErrorMsg(err?.message || "Login failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container flex flex-col min-h-screen">
      <Header showAdmin={false} />

      {/* Dark shaded background */}
      <main className="flex-1 flex items-center justify-center"
            style={{
              background: "linear-gradient(180deg, rgba(4,6,8,0.9) 0%, rgba(15,15,15,0.95) 50%, rgba(2,6,10,1) 100%)"
            }}>

        <div className="w-full max-w-md mx-4">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl"
               style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))", border: "1px solid rgba(255,255,255,0.04)" }}>
            {/* subtle header area inside card */}
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

                <button
                  type="button"
                  className="text-sm text-gray-300 hover:text-white"
                  onClick={() => alert("Password reset flow not implemented.")}
                >
                  Forgot password?
                </button>
              </div>
            </form>

            {/* footer small note */}
            <div className="px-8 py-4 text-center text-xs text-gray-500 border-t" style={{ borderColor: "rgba(255,255,255,0.02)" }}>
              Secure admin access • VisualMate
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Admin;
