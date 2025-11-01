import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

function EditProfileModal({ profile, onClose, setProfile }) {
  const { currentUser } = useAuth(); // Use currentUser.uid directly
  const [fullName, setFullName] = useState(profile.fullName);
  const [address, setAddress] = useState(profile.address);
  const [contactNumber, setContactNumber] = useState(profile.contactNumber);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!currentUser) {
      alert("User not logged in!");
      return;
    }

    setLoading(true);

    try {
      const updatedData = {
        fullName,
        address,
        contactNumber,
      };

      // Update Firestore using currentUser.uid
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, updatedData);

      // Update local state instantly
      setProfile({
        ...profile,
        ...updatedData,
      });

      onClose();
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-2xl p-6 w-96 relative shadow-lg">
        {/* Close button */}
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold mb-6 text-center">Edit Profile</h2>

        {/* Full Name */}
        <label className="block text-gray-700 font-medium mb-1">Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="border p-2 rounded w-full mb-4"
          placeholder="Enter full name"
        />



        {/* Address */}
        <label className="block text-gray-700 font-medium mb-1">Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border p-2 rounded w-full mb-4"
          placeholder="Enter address"
        />

        {/* Contact Number */}
        <label className="block text-gray-700 font-medium mb-1">Contact Number</label>
        <input
          type="text"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          className="border p-2 rounded w-full mb-6"
          placeholder="Enter contact number"
        />

        {/* Save button */}
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

export default EditProfileModal;
