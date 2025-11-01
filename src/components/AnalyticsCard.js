import React from "react";

function AnalyticsCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg flex-1">
      <p className="text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}

export default AnalyticsCard;
