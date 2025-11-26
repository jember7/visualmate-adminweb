import React, { useState } from "react";
import { db, firebaseConfig } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { useAuth } from "../context/AuthContext";

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
        active: true,             // <-- ADDED HERE
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
      alert("❌ Failed to add admin: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Admin</h2>

        <form onSubmit={handleAddAdmin} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 w-full"
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 w-full"
            required
          />

          <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 w-full"
            required
          />

          <input
            type="text"
            placeholder="Contact Number"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 w-full"
            required
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 w-full"
          >
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>

          <p className="text-sm text-gray-600">
            Default password for new admin is <strong>admin123</strong>
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddAdminModal;
