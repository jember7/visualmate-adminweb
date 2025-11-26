import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import UserTable2 from "../components/UserTable2";
import AddAdminModal from "../components/AddAdminModal";
import { useAuth } from "../context/AuthContext";

function UserManagement() {
  const { userRole } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);

  // search + filter
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const refreshUsers = () => setRefreshFlag((p) => !p);

  // DEBUG: show the role in console so you can verify what the app receives
  useEffect(() => {
    console.log("UserManagement: userRole =", userRole);
  }, [userRole]);

  // tolerant check: case-insensitive + trim
  const isSuperAdmin = (role) => {
    if (!role) return false;
    return String(role).trim().toLowerCase() === "superadmin";
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header showAdmin={true} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 bg-gray-100">
          <h2 className="text-3xl font-bold mb-6">User Account List</h2>

          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 w-full md:w-1/2"
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 w-full md:w-1/4"
            >
              <option value="">All Roles</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="carer">Carer</option>
              <option value="impaired">Impaired</option>
            </select>

            {isSuperAdmin(userRole) && (
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                onClick={() => setIsModalOpen(true)}
              >
                Add Admin
              </button>
            )}
          </div>

          <UserTable2
            showManage={true}
            refreshFlag={refreshFlag}
            searchTerm={searchTerm}
            roleFilter={roleFilter}
          />

          <AddAdminModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            currentUserRole={userRole}
            refreshUsers={refreshUsers}
          />
        </main>
      </div>
    </div>
  );
}

export default UserManagement;
