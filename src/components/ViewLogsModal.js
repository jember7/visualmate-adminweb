import React, { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";

function ViewLogsModal({ adminId, adminName, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(
          collection(db, "history", adminId, "conversations"),
          orderBy("timestamp", "desc") // Newest first
        );

        const snap = await getDocs(q);
        const results = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLogs(results);
      } catch (err) {
        console.error("Error loading logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [adminId]);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(logs.length / logsPerPage));
  const indexOfLast = currentPage * logsPerPage;
  const indexOfFirst = indexOfLast - logsPerPage;
  const currentLogs = logs.slice(indexOfFirst, indexOfLast);

  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl relative p-8">

        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
          onClick={onClose}
        >
          <FaTimes size={20} />
        </button>

        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Conversation Logs — {adminName}
        </h2>

        {/* Loading State */}
        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No logs found.</p>
        ) : (
          <>
            {/* Logs List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {currentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-5 bg-gray-50 rounded-xl shadow border border-gray-200 hover:bg-gray-100 transition"
                >
                  <p className="text-sm font-semibold text-gray-700">Prompt:</p>
                  <p className="text-gray-900 mb-3">{log.prompt}</p>

                  <p className="text-sm font-semibold text-gray-700">
                    AI Response:
                  </p>
                  <p className="text-gray-900 mb-3">{log.response}</p>

                  <p className="text-xs text-gray-500 text-right">
                    {log.timestamp?.toDate
                      ? log.timestamp.toDate().toLocaleString()
                      : "Unknown time"}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow hover:bg-gray-300 disabled:opacity-40"
              >
                <FaChevronLeft /> Prev
              </button>

              <span className="text-gray-700 font-semibold">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow hover:bg-gray-300 disabled:opacity-40"
              >
                Next <FaChevronRight />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ViewLogsModal;
