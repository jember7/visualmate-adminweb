import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import ManageUserModal from "./ManageUserModal";

function UserTable2({ searchTerm, roleFilter }) {
  const { currentUser, userRole } = useAuth();
  const [usersData, setUsersData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const usersPerPage = 10;

  useEffect(() => {
    const usersCol = collection(db, "users");
    const q = query(usersCol, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersData(users);
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Apply filtering
  const filteredUsers = usersData.filter((user) => {
    let matchesSearch = true;
    let matchesRole = true;

    // Search by name, email, address, or contact
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      matchesSearch =
        user.fullName?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.address?.toLowerCase().includes(search) ||
        user.contactNumber?.toLowerCase().includes(search);
    }

    // Filter by role
    if (roleFilter) {
      matchesRole = user.role?.toLowerCase() === roleFilter.toLowerCase();
    }

    return matchesSearch && matchesRole;
  });

  // Pagination
  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const openManageModal = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteDoc(doc(db, "users", userId));
      setModalOpen(false);
      alert("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user: " + error.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h3 className="text-xl font-semibold mb-4">Users</h3>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2">ID</th>
            <th className="py-2">Full Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Address</th>
            <th className="py-2">Contact</th>
            <th className="py-2">Role</th>
            {(userRole === "superadmin" || userRole === "admin") && (
              <th className="py-2">Manage</th>
            )}
          </tr>
        </thead>
        <tbody>
          {currentUsers.map((user, idx) => {
            let showManage = false;

            if (user.id !== currentUser.uid) {
              if (userRole === "superadmin") {
                showManage = true; // superadmin can manage everyone except self
              } else if (userRole === "admin") {
                // admin can only manage carers and impaired
                if (user.role === "Carer" || user.role === "Impaired") {
                  showManage = true;
                }
              }
            }

            return (
              <tr key={user.id} className="border-b hover:bg-gray-100">
                <td className="py-2">{indexOfFirst + idx + 1}</td>
                <td className="py-2">{user.fullName}</td>
                <td className="py-2">{user.email}</td>
                <td className="py-2">{user.address}</td>
                <td className="py-2">{user.contactNumber}</td>
                <td className="py-2">{user.role}</td>
                {showManage && (
                  <td className="py-2">
                    <button
                      onClick={() => openManageModal(user)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Manage
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Prev
        </button>
        <p className="px-3 py-1">
          {currentPage} / {totalPages}
        </p>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Next
        </button>
      </div>

      {/* Manage Modal */}
      {modalOpen && selectedUser && (
        <ManageUserModal
          user={selectedUser}
          onClose={() => setModalOpen(false)}
          onDelete={handleDeleteUser}
        />
      )}
    </div>
  );
}

export default UserTable2;
