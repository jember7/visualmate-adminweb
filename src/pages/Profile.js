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
  const [openPasswordModal, setOpenPasswordModal] = useState(false); // ✅ Added state

  const fetchProfile = async () => {
    if (!currentUser) return;

    const docRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setProfile({ uid: docSnap.id, ...docSnap.data() });
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  if (!profile) return <p className="p-6">Loading...</p>;

  return (
    <div className="dashboard-container flex flex-col min-h-screen">
      <Header showAdmin={true} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50 flex items-center justify-center">
          <div className="w-full max-w-3xl">
            <h2 className="text-4xl font-bold mb-10 text-center text-gray-800">
              Profile Details
            </h2>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center text-center">
             
              {/* Details */}
              <h3 className="text-3xl font-semibold text-gray-800 mb-2">
                {profile.fullName}
              </h3>
              <p className="text-lg text-gray-700 mb-2">
                <span className="font-semibold">Email:</span> {profile.email}
              </p>
              <p className="text-lg text-gray-700 mb-2">
                <span className="font-semibold">Address:</span> {profile.address}
              </p>
              <p className="text-lg text-gray-700">
                <span className="font-semibold">Contact:</span>{" "}
                {profile.contactNumber}
              </p>

              {/* Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition text-lg"
                  onClick={() => setModalOpen(true)}
                >
                  Edit Profile
                </button>

                <button
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg"
                  onClick={() => setOpenPasswordModal(true)}
                >
                  Change Password
                </button>
              </div>
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
        </main>
      </div>
    </div>
  );
}

export default Profile;
