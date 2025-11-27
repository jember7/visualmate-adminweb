// UserTable2.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import ManageUserModal from "./ManageUserModal";
import { FiTrash2, FiUserCheck } from "react-icons/fi";

/**
 * Props:
 *  - searchTerm (string)
 *  - roleFilter (string)
 */
function escapeRegex(string = "") {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatches(text = "", query = "") {
  if (!query) return text;
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(escapeRegex);
  if (tokens.length === 0) return text;

  const pattern = new RegExp(`(${tokens.join("|")})`, "gi");
  const parts = String(text).split(pattern);
  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

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
            active: typeof data.active === "boolean" ? data.active : false,
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

  // Enhanced search: tokenize the query into words and match all tokens anywhere in row text
  const filtered = useMemo(() => {
    const s = (searchTerm || "").trim().toLowerCase();
    const tokens = s ? s.split(/\s+/).filter(Boolean) : [];
    const r = (roleFilter || "").trim().toLowerCase();

    return users.filter((u) => {
      // role filter
      if (r && (u.role || "").toLowerCase() !== r) return false;

      // if no search tokens, keep
      if (tokens.length === 0) return true;

      // build haystack
      const hay = `${u.name} ${u.email} ${u.role} ${u.address} ${u.contactNumber}`.toLowerCase();

      // require ALL tokens to be present (AND search). Change to some-of for OR behavior.
      return tokens.every((t) => hay.includes(t));
    });
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    // reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, roleFilter, users.length]);

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
    const my = String(userRole).toLowerCase();
    const their = (targetUser.role || "").toLowerCase();

    if (targetUser.id === currentUser.uid) return false;

    if (my === "superadmin") return true;
    if (my === "admin") return their === "carer" || their === "impaired";

    return false;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
      {/* header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Users</h3>
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-700">{filtered.length}</span> result{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear search button (visible only when there's a search term) */}
          {searchTerm && (
            <button
              onClick={() => {
                // emit a custom event so parent can clear; fallback: nothing if parent doesn't listen
                const evt = new CustomEvent("clear-user-search");
                window.dispatchEvent(evt);
              }}
              className="text-sm px-3 py-1 border rounded-md text-gray-600 hover:bg-gray-50"
              title="Clear search"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-sm text-gray-500 border-b">
              <th className="py-3 px-2 w-12">#</th>
              <th className="py-3 px-3">Full Name</th>
              <th className="py-3 px-3">Email</th>
              <th className="py-3 px-3">Role</th>
              <th className="py-3 px-3 hidden lg:table-cell">Address</th>
              <th className="py-3 px-3">Contact</th>
              <th className="py-3 px-3 text-center">Account Status</th>
              {(userRole?.toLowerCase() === "superadmin" || userRole?.toLowerCase() === "admin") && (
                <th className="py-3 px-3 text-right">Manage</th>
              )}
            </tr>
          </thead>

          <tbody>
            {currentUsers.length > 0 ? (
              currentUsers.map((user, idx) => {
                const showManage = canManage(user);
                const rowIndex = indexOfFirst + idx + 1;

                return (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-600">{rowIndex}</td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-gray-800">{highlightMatches(user.name, searchTerm)}</div>
                      <div className="text-xs text-gray-500">{user.createdAt ? user.createdAt.toLocaleString() : ""}</div>
                    </td>

                    <td className="py-3 px-3 text-sm text-gray-700">{highlightMatches(user.email, searchTerm)}</td>

                    <td className="py-3 px-3 text-sm text-gray-700">{highlightMatches(user.role, searchTerm)}</td>

                    <td className="py-3 px-3 text-sm text-gray-700 hidden lg:table-cell">
                      {highlightMatches(user.address, searchTerm)}
                    </td>

                    <td className="py-3 px-3 text-sm text-gray-700">{highlightMatches(user.contactNumber, searchTerm)}</td>

                    <td className="py-3 px-3 text-center">
                      {user.active ? (
                        <span title="Active" className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          <span className="h-2 w-2 rounded-full bg-green-600 inline-block" /> Active
                        </span>
                      ) : (
                        <span title="Inactive" className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                          <span className="h-2 w-2 rounded-full bg-red-600 inline-block" /> Inactive
                        </span>
                      )}
                    </td>

                    {showManage && (
                      <td className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openManageModal(user)}
                            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm"
                          >
                            <FiUserCheck />
                            Manage
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  {searchTerm ? (
                    <div>
                      <div className="text-lg font-medium">No users match “{searchTerm}”</div>
                      <div className="text-sm mt-2">Try a different search term or clear filters.</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-lg font-medium">No users found</div>
                      <div className="text-sm mt-2">There are currently no user accounts.</div>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {Math.min(filtered.length, indexOfFirst + 1)}–{Math.min(filtered.length, indexOfLast)} of {filtered.length}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md bg-white border text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Prev
          </button>

          <div className="px-3 py-1 text-sm bg-white border rounded-md">
            {currentPage} / {totalPages}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md bg-white border text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
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
