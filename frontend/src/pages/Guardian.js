// src/pages/Guardian.js
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import logo from "../logo.png";

// API base (frontend .env -> REACT_APP_API_URL)
const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Guardian() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // { role: 'user'|'assistant', text }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------- Typing animation helper ----------------
  function typeOutAssistantMessage(fullText, speed = 15, useWords = false) {
    const unitArray = useWords ? fullText.split(" ") : fullText.split("");
    let i = 0;

    // add placeholder assistant bubble
    setMessages((m) => [...m, { role: "assistant", text: "" }]);

    const interval = setInterval(() => {
      i += 1;
      const current = unitArray.slice(0, i);
      const display = useWords ? current.join(" ") : current.join("");

      setMessages((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((msg, j) => j === copy.length - 1 && msg.role === "assistant");
        if (idx !== -1) {
          copy[idx] = { ...copy[idx], text: display };
        }
        return copy;
      });

      if (i >= unitArray.length) clearInterval(interval);
    }, speed);
  }

  // ---------------- Send Message ----------------
  async function sendMessage(e) {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = { role: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/guardian/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [userMsg] }),
      });

      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch (_) {
        /* not JSON */
      }

      if (!res.ok) {
        const serverMsg =
          (data && (data.error || data.message)) ||
          text ||
          `Server returned ${res.status}`;
        console.error("Server error:", res.status, serverMsg);
        setError(serverMsg);
        setMessages((m) => [
          ...m,
          { role: "assistant", text: "Sorry — I couldn't process that right now." },
        ]);
        return;
      }

      const assistantText =
        (data && data.reply) ||
        (typeof text === "string" ? text : "Sorry — no reply from server.");

      // Animate reply (char-by-char). Change useWords=true for word-by-word
      typeOutAssistantMessage(assistantText, 15, false);
    } catch (err) {
      console.error("Fetch/network error:", err);
      setError(String(err.message || err));
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Sorry — I couldn't process that right now." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // ---------------- Keyboard handler ----------------
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white p-6">
      {/* Header */}
      <div className="w-full relative max-w-6xl flex items-start mb-6">
        <img src={logo} alt="Genetic GuardianAI Logo" className="h-28 w-28 object-contain" />
        <div className="ml-6">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Genetic <span className="text-blue-400">GuardianAI</span>
          </h1>
          <p className="mt-1 text-gray-300 max-w-2xl">
            AI platform that predicts hereditary disease risks and gives personalised guidance.
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="absolute right-0 top-2 px-3 py-2 rounded-md bg-gray-800/60 hover:bg-gray-800 text-sm"
        >
          Back
        </button>
      </div>

      {/* Banner */}
      <div className="max-w-2xl w-full bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-4 mb-4">
        <strong>Tip:</strong> Ask anything about health — symptoms, preventive tips, or what to do next.
        <div className="text-sm text-gray-400 mt-1">
          This chat provides informational guidance, not a medical diagnosis.
        </div>
      </div>

      {/* Chat container */}
      <div className="max-w-2xl w-full flex-1 flex flex-col border border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex-1 p-4 overflow-auto" style={{ minHeight: 240 }}>
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-12">
              Type a question below. Example: "I have a sore throat and fever — what should I do?"
            </div>
          )}

          <div className="space-y-4">
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`${
                      isUser ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-100"
                    } max-w-[80%] px-4 py-3 rounded-2xl`}
                  >
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{m.text}</div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={sendMessage}
          className="p-4 border-t border-gray-800 bg-gradient-to-t from-black/40 to-transparent"
        >
          {error && <div className="text-sm text-red-400 mb-2">{error}</div>}

          <div className="flex gap-3 items-start">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about the health..."
              rows={2}
              className="flex-1 resize-none rounded-lg px-4 py-3 bg-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 font-semibold"
            >
              {loading ? "Thinking..." : "Send"}
            </button>
          </div>

          <div className="text-xs text-gray-500 mt-2">
            Press Enter to send — Shift+Enter for a newline. Responses are informational only.
          </div>
        </form>
      </div>

      <div className="mt-6 text-sm text-gray-500 max-w-2xl text-center">
        Note: This chat uses your backend `/api/guardian/chat`. Ensure that endpoint is implemented and the server is running.
      </div>
    </div>
  );
}
