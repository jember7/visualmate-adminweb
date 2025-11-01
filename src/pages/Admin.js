import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Header from "../components/Header";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

function Admin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // 1. Sign in with email + password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Fetch user profile
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        alert("User profile not found");
        return;
      }

      const userData = userSnap.data();

      // 3. Optional: check role (e.g., allow only admin/superadmin)
      if (!["admin", "superadmin"].includes(userData.role)) {
        alert("You do not have permission to log in");
        return;
      }

      // 4. Redirect
      navigate("/dashboard");

    } catch (err) {
      console.error("Login failed:", err.message);
      alert("Invalid email or password");
    }
  };

  return (
    <div className="app-container flex flex-col min-h-screen">
      <Header showAdmin={false} />

      <main className="flex-1 flex items-center justify-center bg-black">
        <div className="login-card">
          <h2 className="login-title">Admin Login</h2>

          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="input-field pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="eye-button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button type="submit" className="login-button">
              Login
            </button>
          </form>

          <p className="forgot-password">Forgot Password?</p>
        </div>
      </main>
    </div>
  );
}

export default Admin;
