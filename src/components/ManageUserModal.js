import React, { useState } from "react";
import { auth, db } from "../firebase";
import { updateDoc, doc } from "firebase/firestore";
import ViewLogsModal from "./ViewLogsModal";

function ManageUserModal({ user, onClose, onDeactivate, onReactivate, currentAdminRole }) {
  const [loading, setLoading] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);

  // 🔹 Reactivate account
  const handleReactivateAccount = async () => {
    try {
      setLoading(true);
      await updateDoc(doc(db, "users", user.id), { active: true });
      alert("✅ Account reactivated successfully!");
      if (onReactivate) onReactivate(user.id);
      onClose();
    } catch (error) {
      console.error("Error reactivating account:", error);
      alert("❌ Failed to reactivate account");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Deactivate account
  const handleDeactivateAccount = async () => {
    try {
      if (!window.confirm("Are you sure you want to deactivate this account?")) return;

      setLoading(true);
      await updateDoc(doc(db, "users", user.id), { active: false });
      alert("🚫 Account deactivated successfully!");
      if (onDeactivate) onDeactivate(user.id);
      onClose();
    } catch (error) {
      console.error("Error deactivating account:", error);
      alert("❌ Failed to deactivate account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-96 relative">
          <button
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            onClick={onClose}
          >
            ✕
          </button>

          <h3 className="text-xl font-semibold text-center mb-2">
            {user.fullName}
          </h3>
          <p className="text-center text-gray-500 mb-1">Name: {user.fullName}</p>
          <p className="text-center text-gray-500 mb-1">Email: {user.email}</p>
          <p className="text-center text-gray-500 mb-1">Address: {user.address}</p>
          <p className="text-center text-gray-500 mb-4">Contact: {user.contactNumber}</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleReactivateAccount}
              disabled={loading}
              className="bg-green-500 text-white py-2 rounded hover:bg-green-600 transition disabled:opacity-50"
            >
              {loading ? "Processing..." : "Reactivate Account"}
            </button>

            <button
              onClick={handleDeactivateAccount}
              disabled={loading}
              className="bg-red-500 text-white py-2 rounded hover:bg-red-600 transition disabled:opacity-50"
            >
              {loading ? "Processing..." : "Deactivate Account"}
            </button>

            <button
              onClick={() => setLogsOpen(true)}
              className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
            >
              View Logs
            </button>
          </div>
        </div>
      </div>

      {logsOpen && (
        <ViewLogsModal
          adminId={user.id}
          adminName={user.fullName}
          onClose={() => setLogsOpen(false)}
        />
      )}
    </>
  );
}

export default ManageUserModal;
