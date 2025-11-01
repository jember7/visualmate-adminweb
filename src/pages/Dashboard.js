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

        // exclude admins from total
        if (role === "admin" || role === "superadmin") return;

        total++;
        if (role === "carer") carers++;
        if (role === "impaired") impaired++;

        // count new users (last 7 days)
        if (data.createdAt?.toMillis() > oneWeekAgo) {
          newUsers++;
        }
      });

      setAnalyticsData([
        { title: "Carers", value: carers },
        { title: "Impaired", value: impaired },
        { title: "New Users (7 days)", value: newUsers },
        { title: "Total Users", value: total },
      ]);
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="dashboard-container flex flex-col min-h-screen">
      {/* Header with admin info */}
      <Header showAdmin={true} />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 p-6 bg-gray-100">
          <h2 className="text-3xl font-bold mb-6">Dashboard</h2>

          {/* Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {analyticsData.map((item, idx) => (
              <AnalyticsCard key={idx} title={item.title} value={item.value} />
            ))}
          </div>

          {/* User Table */}
          <UserTable />
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
