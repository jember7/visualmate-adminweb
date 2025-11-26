// context/AuthContext.js
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // guard to avoid setState after unmount / cancel in-flight async work
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const auth = getAuth();

    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // We avoid making the effect callback itself async (React warns about that),
      // so we call an IIFE for async work.
      (async () => {
        // Optionally set loading true each time auth changes
        if (isMounted.current) setLoading(true);

        if (!user) {
          // signed out
          if (!isMounted.current) return;
          setCurrentUser(null);
          setUserRole(null);
          setUserProfile(null);
          if (isMounted.current) setLoading(false);
          return;
        }

        try {
          // fetch profile; this can take time, so guard updates
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);

          if (!isMounted.current) return; // CANCEL if unmounted

          setCurrentUser(user);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUserRole(userData.role || null);
            setUserProfile({
              fullName: userData.fullName || "",
              username: userData.username || "",
              address: userData.address || "",
              contactNumber: userData.contactNumber || "",
            });
          } else {
            // no profile doc
            setUserRole(null);
            setUserProfile(null);
          }
          console.log("Auth state changed =>", user?.uid ?? null, user?.email ?? null);
        } catch (err) {
          console.error("Error fetching user profile:", err);
          // If permission-denied or network error, avoid leaving stale state
          if (!isMounted.current) return;
          // Keep auth user info but clear profile/role
          setCurrentUser(user);
          setUserRole(null);
          setUserProfile(null);
        } finally {
          if (isMounted.current) setLoading(false);
        }
      })();
    });

    // cleanup: unsubscribe auth listener and mark unmounted
    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userRole, userProfile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
