import React from "react";
import {
  FaUserNurse,
  FaUserAlt,
  FaUserPlus,
  FaUsers,
} from "react-icons/fa";

function AnalyticsCard({ title, value }) {
  const icons = {
    Carers: <FaUserNurse size={32} />,
    Impaired: <FaUserAlt size={32} />,
    "New Users (7 days)": <FaUserPlus size={32} />,
    "Total Users": <FaUsers size={32} />,
  };

  return (
    <div className="
      p-6 
      rounded-2xl 
      bg-gradient-to-br from-white/60 to-white/20 
      backdrop-blur-xl 
      shadow-lg 
      border border-white/30
      hover:scale-[1.03] 
      transition 
      cursor-pointer
      flex 
      flex-col 
      items-start
      gap-3
    ">
      <div className="text-blue-600">
        {icons[title] || <FaUsers size={32} />}
      </div>

      <h3 className="text-gray-700 text-lg font-semibold tracking-wide">
        {title}
      </h3>

      <p className="text-4xl font-extrabold text-gray-900 drop-shadow-sm">
        {value}
      </p>
    </div>
  );
}

export default AnalyticsCard;
