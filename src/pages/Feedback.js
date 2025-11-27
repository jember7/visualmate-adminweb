// Feedback.jsx
import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
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
import { db } from "../firebase";
import { FaEdit, FaTrash, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

/**
 * Feedback page:
 * - horizontal feedback cards (truncated)
 * - clicking a card opens a modal showing the full content
 * - FAQs table below (keeps your previous behaviour)
 */

function Feedback() {
  // === feedback state ===
  const [feedbacks, setFeedbacks] = useState([]);
  const [fbLoading, setFbLoading] = useState(true);
  const [selected, setSelected] = useState(null); // the feedback currently expanded in modal

  // cards per page for pagination (for horizontal pages)
  const cardsPerPage = 4;
  const [fbPage, setFbPage] = useState(1);

  // === faq state ===
  const [faqs, setFaqs] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const faqsPerPage = 5;

  // load feedbacks ordered by timestamp desc
  useEffect(() => {
    setFbLoading(true);
    const q = query(collection(db, "feedback"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setFeedbacks(list);
        setFbLoading(false);
        setFbPage(1);
      },
      (err) => {
        console.error("Failed to load feedbacks:", err);
        setFbLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // load faqs
  useEffect(() => {
    const q = query(collection(db, "faqs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFaqs(arr);
    });
    return () => unsub();
  }, []);

  // FAQ actions
  const handleSaveFaq = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    try {
      if (editingId) {
        await updateDoc(doc(db, "faqs", editingId), { question: newQuestion, answer: newAnswer });
        alert("✅ FAQ updated");
      } else {
        await addDoc(collection(db, "faqs"), { question: newQuestion, answer: newAnswer, createdAt: serverTimestamp() });
        alert("✅ FAQ added");
      }
      setNewQuestion("");
      setNewAnswer("");
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save FAQ");
    }
  };

  const handleEdit = (faq) => {
    setNewQuestion(faq.question);
    setNewAnswer(faq.answer);
    setEditingId(faq.id);
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this FAQ?")) return;
    try {
      await deleteDoc(doc(db, "faqs", id));
      alert("✅ FAQ deleted");
    } catch (err) {
      console.error(err);
      alert("Failed to delete FAQ");
    }
  };

  // pagination helpers for feedback cards
  const totalFbPages = Math.max(1, Math.ceil(feedbacks.length / cardsPerPage));
  const fbStartIndex = (fbPage - 1) * cardsPerPage;
  const fbCurrentPageItems = feedbacks.slice(fbStartIndex, fbStartIndex + cardsPerPage);
  const prevFbPage = () => setFbPage((p) => Math.max(1, p - 1));
  const nextFbPage = () => setFbPage((p) => Math.min(totalFbPages, p + 1));

  // FAQ pagination
  const indexOfLastFaq = currentPage * faqsPerPage;
  const indexOfFirstFaq = indexOfLastFaq - faqsPerPage;
  const currentFaqs = faqs.slice(indexOfFirstFaq, indexOfLastFaq);
  const totalFaqPages = Math.max(1, Math.ceil(faqs.length / faqsPerPage));

  // small UI helpers
  const formatDate = (ts) => {
    if (!ts) return "Unknown";
    try {
      if (ts?.toDate) return ts.toDate().toLocaleString();
      if (typeof ts === "number") return new Date(ts).toLocaleString();
      return new Date(ts).toLocaleString();
    } catch {
      return "Unknown";
    }
  };

  const renderStars = (rating) => {
    const r = Math.max(0, Math.min(5, Number(rating || 0)));
    return (
      <div className="text-lg" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`inline-block mr-1 ${i < r ? "text-yellow-500" : "text-gray-300"}`}>★</span>
        ))}
      </div>
    );
  };

  // open modal for a card
  const openModal = (fb) => setSelected(fb);
  const closeModal = () => setSelected(null);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header showAdmin={true} />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          <h2 className="text-3xl font-bold mb-6">Feedback & FAQs</h2>

          {/* Feedback cards */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">User Feedback</h3>

              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">Showing {feedbacks.length} feedback</div>
                <div className="inline-flex items-center gap-2">
                  <button onClick={prevFbPage} disabled={fbPage === 1} className="p-2 rounded-md bg-white shadow hover:bg-gray-50 disabled:opacity-50" aria-label="Previous">
                    <FaChevronLeft />
                  </button>
                  <div className="text-sm text-gray-600 px-2">{fbPage} / {totalFbPages}</div>
                  <button onClick={nextFbPage} disabled={fbPage === totalFbPages} className="p-2 rounded-md bg-white shadow hover:bg-gray-50 disabled:opacity-50" aria-label="Next">
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="flex gap-4 pb-2 overflow-x-auto scroll-smooth">
                {fbLoading
                  ? Array.from({ length: cardsPerPage }).map((_, i) => (
                      <div key={i} className="min-w-[300px] w-[300px] bg-white rounded-xl p-5 shadow-md border border-gray-100 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                        <div className="h-24 bg-gray-200 rounded mb-4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-1/4" />
                      </div>
                    ))
                  : fbCurrentPageItems.map((fb) => (
                      <article
                        key={fb.id}
                        className="min-w-[300px] w-[300px] bg-white rounded-xl p-5 shadow-md border border-gray-100 flex flex-col justify-between cursor-pointer"
                        onClick={() => openModal(fb)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openModal(fb); }}
                        title="Click to expand"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm text-gray-500 truncate">{fb.name || fb.email || "Anonymous"}</div>
                            <div className="text-xs text-gray-400">{formatDate(fb.timestamp)}</div>
                          </div>

                          {/* Truncated message: clamp to approx 3 lines using css */}
                          <p
                            className="text-gray-800 mb-4"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "normal",
                            }}
                            aria-hidden={false}
                          >
                            {fb.message}
                          </p>

                          {/* a subtle "read more" hint */}
                          <div className="text-xs text-blue-600">Click to read full message</div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div>{renderStars(fb.rating)}</div>
                          <div className="text-sm text-gray-500">UID: {fb.uid?.slice?.(0, 8) || "—"}</div>
                        </div>
                      </article>
                    ))}

                {!fbLoading && feedbacks.length === 0 && (
                  <div className="min-w-[300px] w-[300px] bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <div className="text-center text-gray-500">No feedback yet.</div>
                  </div>
                )}
              </div>

              <div className="mt-2 text-xs text-gray-500">Use horizontal scroll or page controls to navigate feedback.</div>
            </div>
          </section>

          {/* Modal - expanded card */}
          {selected && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-auto max-h-[90vh]">
                <div className="flex items-start justify-between p-6 border-b">
                  <div>
                    <h3 className="text-xl font-semibold">{selected.name || "Anonymous"}</h3>
                    <p className="text-xs text-gray-500 mt-1">{selected.email || "No email"} • {formatDate(selected.timestamp)}</p>
                  </div>

                  <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 p-2 rounded" aria-label="Close">
                    <FaTimes />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 uppercase">Message</h4>
                    <p className="mt-2 text-gray-800 whitespace-pre-wrap">{selected.message}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 uppercase">Rating</h4>
                    <p className="mt-2 text-gray-800">{selected.rating ?? "—"}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 uppercase">Meta</h4>
                    <p className="mt-2 text-gray-700 text-sm">UID: {selected.uid || "—"}</p>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={closeModal} className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200">Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FAQ section (kept) */}
          <section className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">FAQs <span className="text-gray-500 text-sm">({faqs.length})</span></h3>
              <div className="text-sm text-gray-500">Manage frequently asked questions</div>
            </div>

            <form onSubmit={handleSaveFaq} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              <input type="text" placeholder="Enter question" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} className="col-span-1 md:col-span-1 border border-gray-300 rounded-md px-4 py-2 w-full" required />
              <textarea placeholder="Enter answer" value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} className="col-span-1 md:col-span-1 border border-gray-300 rounded-md px-4 py-2 w-full" rows={1} required />
              <div className="col-span-1 md:col-span-1 flex items-center gap-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">{editingId ? "Update FAQ" : "Add FAQ"}</button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setNewQuestion(""); setNewAnswer(""); }} className="ml-2 px-4 py-2 border rounded-md hover:bg-gray-100 transition">Cancel</button>
                )}
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left w-12">#</th>
                    <th className="py-3 px-4 text-left">Question</th>
                    <th className="py-3 px-4 text-left">Answer</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentFaqs.map((faq, idx) => (
                    <tr key={faq.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{indexOfFirstFaq + idx + 1}</td>
                      <td className="py-3 px-4">{faq.question}</td>
                      <td className="py-3 px-4">{faq.answer}</td>
                      <td className="py-3 px-4 text-center space-x-3">
                        <button onClick={() => handleEdit(faq)} className="text-blue-500 hover:text-blue-700" title="Edit"><FaEdit /></button>
                        <button onClick={() => handleDelete(faq.id)} className="text-red-500 hover:text-red-700" title="Delete"><FaTrash /></button>
                      </td>
                    </tr>
                  ))}

                  {faqs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">No FAQs available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* FAQ pagination */}
            {faqs.length > faqsPerPage && (
              <div className="flex justify-end items-center gap-3 mt-4">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400" disabled={currentPage === 1}>Prev</button>
                <span>Page {currentPage} of {totalFaqPages}</span>
                <button onClick={() => setCurrentPage((p) => Math.min(totalFaqPages, p + 1))} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400" disabled={currentPage === totalFaqPages}>Next</button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default Feedback;
