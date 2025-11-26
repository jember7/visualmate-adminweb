import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import AnalyticsCard from "../components/AnalyticsCard";
import UserTable from "../components/UserTable";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import "../index.css";

function Dashboard() {
  const [analyticsData, setAnalyticsData] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const usersSnapshot = await getDocs(collection(db, "users"));

      let carers = 0;
      let impaired = 0;
      let total = 0;
      let newUsers = 0;

      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        const role = data.role?.toLowerCase();

        if (role === "admin" || role === "superadmin") return;

        total++;
        if (role === "carer") carers++;
        if (role === "impaired") impaired++;
        if (data.createdAt?.toMillis() > oneWeekAgo) newUsers++;
      });

      setAnalyticsData([
        { title: "Carers", value: carers },
        { title: "Impaired", value: impaired },
        { title: "New Users (Last 7 Days)", value: newUsers },
        { title: "Total Users", value: total },
      ]);
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="dashboard-container flex flex-col min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* HEADER */}
      <Header showAdmin={true} />

      <div className="flex flex-1">
        {/* SIDEBAR */}
        <Sidebar />

        {/* MAIN CONTENT */}
        <main className="flex-1 p-10 overflow-y-auto">
          {/* Title */}
          <h2 className="text-4xl font-extrabold mb-8 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent drop-shadow">
            Dashboard Overview
          </h2>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {analyticsData.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-2xl hover:scale-[1.02] transition transform duration-300"
              >
                <AnalyticsCard title={item.title} value={item.value} />
              </div>
            ))}
          </div>

          {/* User Table Section */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">
              User Records
            </h3>
            <UserTable />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
