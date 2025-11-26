import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import ManageUserModal from "./ManageUserModal";

function UserTable2({ searchTerm = "", roleFilter = "" }) {
  const { currentUser, userRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const usersPerPage = 10;

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data() || {};
          return {
            id: d.id,
            name: data.name || data.fullName || "N/A",
            email: data.email || "N/A",
            role: data.role || "N/A",
            address: data.address || "N/A",
            contactNumber: data.contactNumber || data.contact || "N/A",
            active: typeof data.active === "boolean" ? data.active : false, // ← ADD ACTIVE FIELD
            createdAt: data.createdAt
              ? data.createdAt.toDate
                ? data.createdAt.toDate()
                : new Date(data.createdAt)
              : null,
            raw: data,
          };
        });
        setUsers(list);
      },
      (err) => console.error("users onSnapshot error:", err)
    );

    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    const r = roleFilter.trim().toLowerCase();

    return users.filter((u) => {
      if (r && (u.role || "").toLowerCase() !== r) return false;
      if (!s) return true;

      const hay = `${u.name} ${u.email} ${u.address} ${u.contactNumber}`.toLowerCase();
      return hay.includes(s);
    });
  }, [users, searchTerm, roleFilter]);

  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  const currentUsers = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(filtered.length / usersPerPage));

  const openManageModal = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setModalOpen(false);
      alert("User deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Failed: " + err.message);
    }
  };

  const canManage = (targetUser) => {
    if (!currentUser || !userRole) return false;
    const my = userRole.toLowerCase();
    const their = (targetUser.role || "").toLowerCase();

    if (targetUser.id === currentUser.uid) return false;

    if (my === "superadmin") return true;
    if (my === "admin") return their === "carer" || their === "impaired";

    return false;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h3 className="text-xl font-semibold mb-4">Users</h3>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2">#</th>
            <th className="py-2">Full Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Role</th>
            <th className="py-2">Address</th>
            <th className="py-2">Contact</th>
            <th className="py-2 text-center">Status</th> {/* ADDED */}
            {(userRole?.toLowerCase() === "superadmin" || userRole?.toLowerCase() === "admin") && (
              <th className="py-2">Manage</th>
            )}
          </tr>
        </thead>

        <tbody>
          {currentUsers.length > 0 ? (
            currentUsers.map((user, idx) => {
              const showManage = canManage(user);

              return (
                <tr key={user.id} className="border-b hover:bg-gray-100">
                  <td className="py-2">{indexOfFirst + idx + 1}</td>
                  <td className="py-2">{user.name}</td>
                  <td className="py-2">{user.email}</td>
                  <td className="py-2">{user.role}</td>
                  <td className="py-2">{user.address}</td>
                  <td className="py-2">{user.contactNumber}</td>

                  {/* STATUS ICON COLUMN */}
                  <td className="py-2 text-center text-xl">
  <span title={user.active ? "Active" : "Inactive"}>
    {user.active ? "🟢" : "🔴"}
  </span>
</td>


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
            })
          ) : (
            <tr>
              <td colSpan={8} className="text-center py-4 text-gray-500">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600"
        >
          Prev
        </button>

        <p className="px-3 py-1">
          {currentPage} / {totalPages}
        </p>

        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600"
        >
          Next
        </button>
      </div>

      {modalOpen && selectedUser && (
        <ManageUserModal
          user={selectedUser}
          onClose={() => setModalOpen(false)}
          onDelete={() => handleDeleteUser(selectedUser.id)}
        />
      )}
    </div>
  );
}

export default UserTable2;
