// ManageUserModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import ViewLogsModal from "./ViewLogsModal";

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
            {user?.fullName || user?.name || "User"}
          </h3>

          <div className="text-center text-gray-500 mb-4 space-y-1">
            <div>Name: {user?.fullName || user?.name || "N/A"}</div>
            <div>Email: {user?.email || "N/A"}</div>
            <div>Address: {user?.address || "N/A"}</div>
            <div>Contact: {user?.contactNumber || user?.contact || "N/A"}</div>
          </div>

          <div className="flex flex-col gap-3">
            {/* Show Reactivate only when account is inactive (localActive === false) */}
            {localActive === false && (
              <button
                onClick={() => updateActiveField(true)}
                disabled={loading}
                className="bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Reactivate Account"}
              </button>
            )}

            {/* Show Deactivate only when account is active (localActive === true) */}
            {localActive === true && (
              <button
                onClick={() => {
                  if (!window.confirm("Are you sure you want to deactivate this account?")) return;
                  updateActiveField(false);
                }}
                disabled={loading}
                className="bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Deactivate Account"}
              </button>
            )}

            <button
              onClick={() => setLogsOpen(true)}
              className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              View Logs
            </button>

            {/* TEMP: create admin users doc for currently signed-in caller if missing.
                Remove this block after you create the admin doc. */}
            {needsAdminDoc && (
              <button
                onClick={createAdminDoc}
                disabled={loading}
                className="bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                title="Click once to create users/{your-uid} document with role: superadmin"
              >
                {loading ? "Creating..." : "Create My Admin Doc (TEMP)"}
              </button>
            )}
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
