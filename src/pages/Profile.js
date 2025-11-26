// Profile.jsx
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import EditProfileModal from "../components/EditProfileModal";
import ChangePasswordModal from "../components/ChangePasswordModal";

function Profile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [openPasswordModal, setOpenPasswordModal] = useState(false);

  const fetchProfile = async () => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile({ uid: docSnap.id, ...docSnap.data() });
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setProfile(null);
    }
  };

  useEffect(() => {
    fetchProfile();
    // we intentionally don't re-fire super frequently here
    // parent auth/context changes will re-run this effect
  }, [currentUser]);

  // Loading UI centered on-screen
  if (!profile)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div
            className="animate-spin rounded-full h-14 w-14 border-4 border-gray-200 border-t-indigo-600"
            aria-hidden="true"
          ></div>
          <p className="mt-4 text-gray-700 text-lg font-medium">Loading profile…</p>
          <p className="mt-1 text-gray-500 text-sm">Fetching your account details</p>
        </div>
      </div>
    );

  return (
    <div className="dashboard-container flex flex-col min-h-screen bg-gray-50">
      <Header showAdmin={true} />

      <div className="flex flex-1">
        <Sidebar />

        {/* MAIN CONTENT: reduce vertical padding so the card is nearer the header */}
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto w-full max-w-3xl">

            {/* Title and short description */}
            <div className="mb-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Your Profile
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                View and manage your account details. Keep your information up to date.
              </p>
            </div>

            {/* Profile Card — sits higher (small top margin) */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 -mt-1">
              <div className="grid grid-cols-1 gap-6">

                {/* Name */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Full name</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{profile.fullName}</p>
                </div>

                {/* Email */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                  <p className="mt-1 text-lg text-gray-800">{profile.email || "—"}</p>
                </div>

                {/* Address */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Address</p>
                  <p className="mt-1 text-lg text-gray-800">{profile.address || "—"}</p>
                </div>

                {/* Contact */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Contact number</p>
                  <p className="mt-1 text-lg text-gray-800">{profile.contactNumber || "—"}</p>
                </div>

                {/* Optional small metadata row (role / createdAt) */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      Role: <span className="ml-2 font-semibold">{profile.role || "User"}</span>
                    </span>

                    {profile.active !== undefined && (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          profile.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                        aria-live="polite"
                      >
                        {profile.active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </div>


                </div>

                {/* Buttons (centered on small screens, inline on larger) */}
                <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
                  <button
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                  >
                    {/* simple pencil SVG */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6 6L21 11l-6-6-6 6z" />
                    </svg>
                    Edit profile
                  </button>

                  <button
                    onClick={() => setOpenPasswordModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  >
                    {/* simple key SVG */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM3 21v-2a4 4 0 014-4h4" />
                    </svg>
                    Change password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {modalOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setModalOpen(false)}
          setProfile={setProfile}
        />
      )}

      {openPasswordModal && (
        <ChangePasswordModal
          open={openPasswordModal}
          onClose={() => setOpenPasswordModal(false)}
        />
      )}
    </div>
  );
}

export default Profile;
