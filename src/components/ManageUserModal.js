// ManageUserModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import ViewLogsModal from "./ViewLogsModal";
import { FaCheckCircle, FaTimesCircle, FaUserShield, FaHistory } from "react-icons/fa";

/**
 * ManageUserModal
 *
 * Props:
 *  - user: should contain Firestore doc id (recommended as user.docId),
 *          otherwise user.id or user.uid will be used as fallback.
 *          May or may not include an `active` boolean.
 *  - onClose: () => void
 *  - onDeactivate: (id, collection) => void
 *  - onReactivate: (id, collection) => void
 */
function ManageUserModal({ user, onClose, onDeactivate, onReactivate }) {
  const [loading, setLoading] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [needsAdminDoc, setNeedsAdminDoc] = useState(false);
  const [localActive, setLocalActive] = useState(
    typeof user?.active === "boolean" ? user.active : null
  );

  const auth = getAuth();

  const showError = (err) => {
    console.error("Firestore update error:", err);
    alert(`Failed: ${err?.code || "error"} — ${err?.message || err}`);
  };

  // callerUid as a stable value
  const callerUid = auth.currentUser?.uid || null;

  // memoized target doc id (stable unless user prop changes)
  const targetDocId = useMemo(() => {
    return user?.docId || user?.id || user?.uid || null;
  }, [user?.docId, user?.id, user?.uid]);

  // Sync localActive when the parent user prop changes
  useEffect(() => {
    if (typeof user?.active === "boolean") {
      setLocalActive(user.active);
    } else {
      // reset to null so the fetch-effect below will run
      setLocalActive((prev) => (prev === null ? prev : null));
    }
  }, [user?.active, user?.docId, user?.id, user?.uid]);

  // If localActive is null (unknown), fetch active boolean from Firestore for the target user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (localActive !== null && localActive !== undefined) return; // already known
      const docId = targetDocId;
      if (!docId) {
        // No doc id available yet; don't fetch
        return;
      }

      try {
        const userRef = doc(db, "users", docId);
        const snap = await getDoc(userRef);
        if (cancelled) return;
        if (snap.exists()) {
          const fetched = snap.data()?.active;
          setLocalActive(typeof fetched === "boolean" ? fetched : false);
        } else {
          // if user doc doesn't exist, default to false (inactive)
          setLocalActive(false);
        }
      } catch (err) {
        console.error("Failed to fetch user.active from Firestore:", err);
        if (!cancelled) setLocalActive(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // run whenever the target user changes
  }, [targetDocId, localActive]);

  // Check whether the currently signed-in caller has users/{callerUid} doc
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cu = callerUid;
        if (!cu) {
          setNeedsAdminDoc(false);
          return;
        }
        const callerRef = doc(db, "users", cu);
        const snap = await getDoc(callerRef);
        if (!cancelled) setNeedsAdminDoc(!snap.exists());
      } catch (err) {
        console.error("Error checking admin doc:", err);
        setNeedsAdminDoc(false);
      }
    })();
    return () => { cancelled = true; };
  }, [callerUid]);

  // TEMP: Create admin users/{callerUid} doc (temporary helper)
  const createAdminDoc = async () => {
    const cu = callerUid;
    if (!cu) {
      alert("No signed-in user found.");
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, "users", cu), {
        uid: cu,
        email: auth.currentUser?.email || null,
        role: "superadmin",
        active: true,
        createdAt: new Date().toISOString(),
      });
      alert("✅ Admin Firestore doc created! You are now SUPERADMIN.");
      setNeedsAdminDoc(false);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  // Update only the 'active' field on the target user's document and update UI immediately
  const updateActiveField = async (value) => {
    const docId = targetDocId;
    if (!docId) {
      alert("Target user document id missing. Ensure parent passes user.docId (recommended).");
      return;
    }

    setLoading(true);
    const payload = { active: !!value };
    const userRef = doc(db, "users", docId);

    try {
      // refresh token so rules see up-to-date custom claims if any
      if (auth.currentUser) await auth.currentUser.getIdToken(true);

      const idTokenResult = await auth.currentUser?.getIdTokenResult();
      console.log("Caller UID:", callerUid, "Token claims:", idTokenResult?.claims);

      const snap = await getDoc(userRef);
      console.log("Target users doc exists?:", snap.exists(), "targetDocId:", docId, "docData:", snap.exists() ? snap.data() : null);

      if (!snap.exists()) {
        alert(`No users/${docId} document found!`);
        setLoading(false);
        return;
      }

      // Only update active field; rules enforce allowed keys
      await updateDoc(userRef, payload);

      // update UI instantly
      setLocalActive(payload.active);

      if (value) {
        alert("✅ Account reactivated successfully!");
        onReactivate?.(docId, "users");
      } else {
        alert("🚫 Account deactivated successfully!");
        onDeactivate?.(docId, "users");
      }

      onClose?.();
    } catch (err) {
      console.error("Update failed:", err);
      if (err?.code === "permission-denied" || err?.message?.includes("Missing or insufficient permissions")) {
        alert("Permission denied: your account is not allowed to update this user. Ensure you have a users/{yourUid} doc with role: 'superadmin' or that your token has an admin claim.");
      } else {
        showError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // small helper UI elements
  const RoleBadge = ({ role }) => {
    if (!role) return null;
    const formatted = String(role).charAt(0).toUpperCase() + String(role).slice(1);
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
        <FaUserShield className="text-sm" />
        {formatted}
      </span>
    );
  };

  const StatusPill = ({ active }) => (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
        active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}
      aria-label={active ? "Active account" : "Inactive account"}
    >
      {active ? <FaCheckCircle className="text-green-600" /> : <FaTimesCircle className="text-red-600" />}
      {active ? "Active" : "Inactive"}
    </span>
  );

  // only show logs for impaired users
  const showLogsForThisUser = (userRole) => {
    return String(userRole || "").toLowerCase() === "impaired";
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900">
                  {user?.fullName || user?.name || "User"}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <RoleBadge role={user?.role} />
                  <StatusPill active={localActive === true} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="text-gray-500 hover:text-gray-700 rounded p-2"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
              <div>
                <p className="text-xs text-gray-500 uppercase">Name</p>
                <p className="mt-1 font-medium text-gray-900">{user?.fullName || user?.name || "N/A"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase">Email</p>
                <p className="mt-1 font-medium text-gray-900">{user?.email || "N/A"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase">Address</p>
                <p className="mt-1 text-gray-800">{user?.address || "N/A"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase">Contact</p>
                <p className="mt-1 text-gray-800">{user?.contactNumber || user?.contact || "N/A"}</p>
              </div>
            </div>

            <div className="mt-6 border-t pt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Show View Logs only for impaired users */}
                {showLogsForThisUser(user?.role) && (
                  <button
                    onClick={() => setLogsOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                  >
                    <FaHistory /> View Logs
                  </button>
                )}

                {needsAdminDoc && (
                  <button
                    onClick={createAdminDoc}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
                    title="Create users/{your-uid} (temporary)"
                  >
                    {loading ? "Creating..." : "Create Admin Doc"}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Reactivate button only when account is inactive */}
                {localActive === false && (
                  <button
                    onClick={() => updateActiveField(true)}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition shadow"
                  >
                    {loading ? "Processing..." : "Reactivate Account"}
                  </button>
                )}

                {/* Deactivate button only when account is active */}
                {localActive === true && (
                  <button
                    onClick={() => {
                      if (!window.confirm("Are you sure you want to deactivate this account?")) return;
                      updateActiveField(false);
                    }}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition shadow"
                  >
                    {loading ? "Processing..." : "Deactivate Account"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {logsOpen && (
        <ViewLogsModal
          adminId={targetDocId}
          adminName={user?.fullName || user?.name}
          onClose={() => setLogsOpen(false)}
        />
      )}
    </>
  );
}

export default ManageUserModal;
