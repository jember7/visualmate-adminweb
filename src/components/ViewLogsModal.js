import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

function ViewLogsModal({ adminId, adminName, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Assuming you store user ID inside each log document (like userId: "uid")
        const q = query(
          collection(db, "history"),
          where("userId", "==", adminId),
          orderBy("timestamp", "desc")
        );

        const snapshot = await getDocs(q);
        const logData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLogs(logData);
      } catch (error) {
        console.error("Error fetching logs:", error);
        alert("❌ Failed to load logs");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [adminId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[500px] max-h-[80vh] overflow-y-auto relative">
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center">
          {adminName}'s Activity Logs
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-500">No logs found.</p>
        ) : (
          <ul className="space-y-4">
            {logs.map((log) => (
              <li
                key={log.id}
                className="border border-gray-200 p-4 rounded-lg shadow-sm"
              >
                <p>
                  <span className="font-semibold text-gray-700">🗣 Prompt:</span>{" "}
                  {log.prompt}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">💬 Response:</span>{" "}
                  {log.response}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  🕒{" "}
                  {log.timestamp?.toDate
                    ? log.timestamp.toDate().toLocaleString()
                    : "No timestamp"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ViewLogsModal;
