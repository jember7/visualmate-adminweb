import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { FaEdit, FaTrash } from "react-icons/fa";

function Feedback() {
  const [faqs, setFaqs] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const faqsPerPage = 5;

  // Load FAQs from Firestore (ordered by createdAt desc)
  useEffect(() => {
    const q = query(collection(db, "faqs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setFaqs(data);
    });

    return () => unsubscribe();
  }, []);

  // Add or Update FAQ
  const handleSaveFaq = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    try {
      if (editingId) {
        // Update
        await updateDoc(doc(db, "faqs", editingId), {
          question: newQuestion,
          answer: newAnswer,
        });
        alert("✅ FAQ updated successfully!");
      } else {
        // Add
        await addDoc(collection(db, "faqs"), {
          question: newQuestion,
          answer: newAnswer,
          createdAt: serverTimestamp(),
        });
        alert("✅ FAQ added successfully!");
      }

      setNewQuestion("");
      setNewAnswer("");
      setEditingId(null);
    } catch (error) {
      console.error("Error saving FAQ:", error);
      alert("❌ Failed to save FAQ");
    }
  };

  // Edit
  const handleEdit = (faq) => {
    setNewQuestion(faq.question);
    setNewAnswer(faq.answer);
    setEditingId(faq.id);
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      await deleteDoc(doc(db, "faqs", id));
      alert("✅ FAQ deleted successfully!");
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      alert("❌ Failed to delete FAQ");
    }
  };

  // Pagination logic
  const indexOfLastFaq = currentPage * faqsPerPage;
  const indexOfFirstFaq = indexOfLastFaq - faqsPerPage;
  const currentFaqs = faqs.slice(indexOfFirstFaq, indexOfLastFaq);
  const totalPages = Math.ceil(faqs.length / faqsPerPage);

  return (
    <div className="flex flex-col min-h-screen">
      <Header showAdmin={true} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 bg-gray-100">
          {/* Feedback Section */}
          <h2 className="text-3xl font-bold mb-6">Feedback & FAQs</h2>
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h3 className="text-xl font-semibold mb-4">Feedback</h3>
            <p className="text-gray-500">🚧 This section is under development.</p>
          </div>

          {/* FAQs Section */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold mb-4">
              FAQs <span className="text-gray-500 text-sm">({faqs.length})</span>
            </h3>

            {/* Add/Edit Form */}
            <form onSubmit={handleSaveFaq} className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Enter question"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 w-full"
                required
              />
              <textarea
                placeholder="Enter answer"
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 w-full"
                rows={3}
                required
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                {editingId ? "Update FAQ" : "Add FAQ"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setNewQuestion("");
                    setNewAnswer("");
                  }}
                  className="ml-2 px-4 py-2 border rounded-md hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              )}
            </form>

            {/* FAQ List */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left w-12">#</th>
                  <th className="py-2 text-left">Question</th>
                  <th className="py-2 text-left">Answer</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentFaqs.map((faq, idx) => (
                  <tr key={faq.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{indexOfFirstFaq + idx + 1}</td>
                    <td className="py-2">{faq.question}</td>
                    <td className="py-2">{faq.answer}</td>
                    <td className="py-2 text-center space-x-2">
                      <button
                        onClick={() => handleEdit(faq)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
                {faqs.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-gray-500">
                      No FAQs available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {faqs.length > faqsPerPage && (
              <div className="flex justify-end items-center gap-3 mt-4">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                  disabled={currentPage === 1}
                >
                  Prev
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Feedback;
