import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import AnalyticsCard from "../components/AnalyticsCard";
import UserTable from "../components/UserTable";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

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

        // exclude admin accounts
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
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header showAdmin={true} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Dashboard Overview
          </h2>

          {/* Smaller Analytics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {analyticsData.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-md p-4 border border-gray-200 
                hover:shadow-lg transition duration-300"
              >
                <AnalyticsCard title={item.title} value={item.value} />
              </div>
            ))}
          </div>

          {/* User Table */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-2">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
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
