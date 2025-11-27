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

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const refreshUsers = () => setRefreshFlag((p) => !p);

  const isSuperAdmin = (role) => {
    if (!role) return false;
    return String(role).trim().toLowerCase() === "superadmin";
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header showAdmin={true} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8">
          {/* Page Title */}
          <h2 className="text-4xl font-bold text-gray-800 mb-8 tracking-tight">
            User Management
          </h2>

          {/* Filter Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              
              {/* Search Input */}
             <div className="relative w-full md:w-1/2">
  <input
    type="text"
    placeholder="Search by name, email, role, address..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="border border-gray-300 rounded-lg px-4 py-2 w-full pl-10 shadow-sm focus:ring-2 focus:ring-blue-500"
  />
  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
    🔍
  </span>
</div>


              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full md:w-1/4 px-4 py-3 border rounded-xl bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="carer">Carer</option>
                <option value="impaired">Impaired</option>
              </select>

              {/* Add Admin Button */}
              {isSuperAdmin(userRole) && (
                <button
                  className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-blue-700 transition"
                  onClick={() => setIsModalOpen(true)}
                >
                  + Add Admin
                </button>
              )}
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
            <UserTable2
              showManage={true}
              refreshFlag={refreshFlag}
              searchTerm={searchTerm}
              roleFilter={roleFilter}
            />
          </div>

          {/* Add Admin Modal */}
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
