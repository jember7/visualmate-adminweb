import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

/**
 * UserTable — improved UI
 * - preserves your onSnapshot real-time behavior
 * - adds status badge, createdAt formatting, responsive columns
 */
function UserTable() {
  const [usersData, setUsersData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    const usersCol = collection(db, "users");
    const q = query(usersCol, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const users = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || data.fullName || "N/A",
            email: data.email || "N/A",
            role: data.role || "N/A",
            address: data.address || "N/A",
            contactNumber: data.contactNumber || data.contact || "N/A",
            active: typeof data.active === "boolean" ? data.active : false,
            createdAt: data.createdAt || null,
          };
        });

        setUsersData(users);
      },
      (err) => {
        console.error("users onSnapshot error:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  const formatDate = (ts) => {
    if (!ts) return "-";
    // Firestore Timestamp objects have toDate()
    let d;
    try {
      d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
    } catch {
      d = new Date(ts);
    }
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  // pagination calculations
  const totalPages = Math.max(1, Math.ceil(usersData.length / usersPerPage));
  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  const currentUsers = usersData.slice(indexOfFirst, indexOfLast);

  // small search (client-side) — optional UI available if you want to add a search input later
  const [search, setSearch] = useState("");
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return currentUsers;
    return currentUsers.filter((u) => {
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q)
      );
    });
  }, [search, currentUsers]);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-semibold text-gray-800">Users</h3>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search name, email, role..."
            className="hidden sm:inline-block bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <div className="text-sm text-gray-500">
            <span className="font-medium">{usersData.length}</span> total
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="min-w-full table-auto">
          <thead className="bg-white/80 backdrop-blur sticky top-0 z-10">
            <tr className="text-left text-sm text-gray-600">
              <th className="px-4 py-3 w-12">#</th>
              <th className="px-4 py-3">Full Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 hidden sm:table-cell">Role</th>
              <th className="px-4 py-3 hidden md:table-cell">Address</th>
              <th className="px-4 py-3 hidden md:table-cell">Contact</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 hidden lg:table-cell">Created</th>
            </tr>
          </thead>

          <tbody className="bg-white">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, idx) => {
                const rowIndex = indexOfFirst + idx + 1;
                return (
                  <tr
                    key={user.id}
                    className={`transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600">{rowIndex}</td>

                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-800">{user.name}</div>
                      <div className="text-xs text-gray-400 md:hidden">{user.role}</div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>

                    <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                              background: user.role?.toLowerCase() === "carer" ? "rgba(99,102,241,0.08)" :
                                         user.role?.toLowerCase() === "impaired" ? "rgba(16,185,129,0.08)" :
                                         "rgba(107,114,128,0.06)",
                              color: user.role?.toLowerCase() === "carer" ? "#6366F1" :
                                     user.role?.toLowerCase() === "impaired" ? "#10B981" :
                                     "#6B7280"
                            }}>
                        {user.role}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{user.address}</td>

                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{user.contactNumber}</td>

                    <td className="px-4 py-3 text-center">
                      <span
                        title={user.active ? "Active" : "Inactive"}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                          user.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}
                      >
                        <span className="text-lg">{user.active ? "🟢" : "🔴"}</span>
                        <span className="hidden sm:inline">{user.active ? "Active" : "Inactive"}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium">{Math.min(usersData.length, indexOfFirst + 1)}</span> –
          <span className="font-medium"> {Math.min(usersData.length, indexOfLast)}</span> of{" "}
          <span className="font-medium">{usersData.length}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md bg-white border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Prev
          </button>
          <div className="px-3 py-1 text-sm text-gray-700 border rounded-md bg-white">
            {currentPage} / {totalPages}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md bg-white border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserTable;
