// AddAdminModal.jsx
import React, { useState } from "react";
import { db, firebaseConfig } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { FaUser, FaEnvelope, FaHome, FaPhone, FaUserShield } from "react-icons/fa";

// Secondary Firebase app to avoid logging out current user
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

function AddAdminModal({ isOpen, onClose, currentUserRole, refreshUsers }) {
  const { currentUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(false);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create user using secondary auth
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        "admin123"
      );
      const newUser = userCredential.user;

      // Save user info in Firestore WITH active: true
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        fullName,
        email,
        address,
        contactNumber,
        role,
        active: true, // <-- ADDED HERE
        createdAt: serverTimestamp(),
      });

      // Fetch current admin's name
      const currentAdminRef = doc(db, "users", currentUser.uid);
      const currentAdminSnap = await getDoc(currentAdminRef);
      const adminName = currentAdminSnap.exists()
        ? currentAdminSnap.data().fullName || currentAdminSnap.data().name
        : "Unknown";

      // Log admin action
      await addDoc(collection(db, "adminLogs"), {
        adminId: currentUser.uid,
        adminName,
        action: "Added Admin",
        targetUser: fullName,
        timestamp: serverTimestamp(),
      });

      alert(`✅ ${role} added successfully!`);

      // Reset
      setFullName("");
      setEmail("");
      setAddress("");
      setContactNumber("");
      setRole("admin");
      onClose();
      refreshUsers();

      // Sign out secondaryAuth
      await signOut(secondaryAuth);
    } catch (error) {
      console.error("Error adding admin:", error.message);
      alert("❌ Failed to add admin: " + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-gradient-to-br from-white/90 to-white/80 rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-indigo-600 to-emerald-500 text-white">
          <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg">
            <FaUserShield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Add Administrator</h3>
            <p className="text-sm opacity-90">Create a new admin or super admin account</p>
          </div>
          <div className="ml-auto text-xs bg-white/10 px-3 py-1 rounded-md text-white/90">
            Default password: <span className="font-medium ml-1">admin123</span>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleAddAdmin} className="px-6 py-6 grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full name */}
            <label className="block">
              <span className="text-xs text-gray-600">Full Name</span>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FaUser />
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </label>

            {/* Email */}
            <label className="block">
              <span className="text-xs text-gray-600">Email Address</span>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FaEnvelope />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </label>

            {/* Address */}
            <label className="block">
              <span className="text-xs text-gray-600">Address</span>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FaHome />
                </span>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Barangay, City"
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </label>

            {/* Contact */}
            <label className="block">
              <span className="text-xs text-gray-600">Contact Number</span>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FaPhone />
                </span>
                <input
                  type="text"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="09XXXXXXXXX"
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </label>
          </div>

          {/* Role selector */}
          <div className="flex items-center gap-4">
            <label className="flex-1">
              <span className="text-xs text-gray-600">Role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </label>

            {/* small helper */}
            <div className="text-sm text-gray-500">
              New admins are created with <strong>active</strong> status by default.
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow inline-flex items-center gap-2"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.6)" strokeWidth="3"></circle>
                  <path d="M4 12a8 8 0 018-8" stroke="white" strokeWidth="3" strokeLinecap="round"></path>
                </svg>
              ) : (
                <span>Create</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddAdminModal;
