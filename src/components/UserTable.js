import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

function UserTable() {
  const [usersData, setUsersData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCol = collection(db, "users");
        const q = query(usersCol, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const users = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return data ? { id: doc.id, ...data } : null;
          })
          .filter((u) => u !== null); // 🔹 remove invalid/null docs

        setUsersData(users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  const currentUsers = usersData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(usersData.length / usersPerPage) || 1;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h3 className="text-xl font-semibold mb-4">Users</h3>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2">ID</th>
            <th className="py-2">Full Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Role</th>
            <th className="py-2">Address</th>
            <th className="py-2">Contact Number</th>
          </tr>
        </thead>
        <tbody>
          {currentUsers.length > 0 ? (
            currentUsers.map((user, idx) => (
              <tr key={user.id} className="border-b hover:bg-gray-100">
                <td className="py-2">{indexOfFirst + idx + 1}</td>
                <td className="py-2">{user.fullName || "N/A"}</td>
                <td className="py-2">{user.email || "N/A"}</td>
                <td className="py-2">{user.role || "N/A"}</td>
                <td className="py-2">{user.address || "N/A"}</td>
                <td className="py-2">{user.contactNumber || "N/A"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center py-4 text-gray-500">
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
    </div>
  );
}

export default UserTable;
