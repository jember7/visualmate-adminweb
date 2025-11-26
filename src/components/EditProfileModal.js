// EditProfileModal.jsx
import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

function EditProfileModal({ profile, onClose, setProfile }) {
  const { currentUser } = useAuth();
  const [fullName, setFullName] = useState(profile.fullName || "");
  const [address, setAddress] = useState(profile.address || "");
  const [contactNumber, setContactNumber] = useState(profile.contactNumber || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!currentUser) {
      setError("You must be signed in to update profile.");
      return;
    }

    // basic validation
    if (!fullName.trim()) {
      setError("Full name cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      const updatedData = {
        fullName: fullName.trim(),
        address: address.trim(),
        contactNumber: contactNumber.trim(),
      };

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, updatedData);

      // Update local parent state instantly
      setProfile({
        ...profile,
        ...updatedData,
      });

      onClose();
      // you can replace alert with your toast/notification system
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center text-white text-lg font-semibold">
              ✎
            </div>
            <div>
              <h2 id="edit-profile-title" className="text-white text-lg font-semibold">
                Edit Profile
              </h2>
              <p className="text-sm text-white/80">Update your personal details</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-white/90 hover:text-white p-2 rounded-md"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Jane Doe"
                required
              />
              <p className="mt-1 text-xs text-gray-400">This name will be shown across the app.</p>
            </div>

            {/* Address */}
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="123 Main St, City"
              />
            </div>

            {/* Contact Number */}
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="+63 912 345 6789"
              />
              <p className="mt-1 text-xs text-gray-400">Include country code if applicable.</p>
            </div>

            {/* Buttons */}
            <div className="sm:col-span-2 flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow hover:brightness-105 transition disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;
