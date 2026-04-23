import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const AI_URL = process.env.REACT_APP_AI_URL || "http://127.0.0.1:5007";

const SUGGESTIONS = [
  "What can I make with tomatoes and pasta?",
  "Quick 15-minute dinner ideas 🍳",
  "Healthy high-protein breakfast?",
  "Recipe for chicken biryani 🍛",
];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(
    () => localStorage.getItem("zaykaa_ai_theme") === "dark"
  );
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("zaykaa_ai_msgs");
    if (saved) return JSON.parse(saved);
    return [
      {
        role: "model",
        content:
          "Hi! I'm **Zaykaa Chef AI** 🍳\n\nTell me what ingredients you have, or ask me for a specific recipe — I'll help you cook something delicious!",
        ts: Date.now(),
      },
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const [sessionId, setSessionId] = useState(
    () => localStorage.getItem("zaykaa_ai_sid") || ""
  );
  const endRef = useRef(null);
  const textareaRef = useRef(null);
  const [showFavs, setShowFavs] = useState(false);
  const [favs, setFavs] = useState(() =>
    JSON.parse(localStorage.getItem("zaykaa_favs") || "[]")
  );

  // Persist messages & theme
  useEffect(() => {
    localStorage.setItem("zaykaa_ai_msgs", JSON.stringify(messages));
  }, [messages]);
  useEffect(() => {
    localStorage.setItem("zaykaa_ai_theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 100) + "px";
    }
  }, [input]);

  const t = dark ? darkTheme : lightTheme;

  const send = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${AI_URL}/api/ai/chat`,
        { message: text, session_id: sessionId },
        { withCredentials: true }
      );
      const { reply, session_id } = res.data;
      if (session_id && session_id !== sessionId) {
        setSessionId(session_id);
        localStorage.setItem("zaykaa_ai_sid", session_id);
      }
      setMessages((m) => [
        ...m,
        { role: "model", content: reply, ts: Date.now() },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "model",
          content:
            "Hmm, my kitchen is quiet right now 😅 — please try again in a moment.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await axios.post(
        `${AI_URL}/api/ai/clear`,
        { session_id: sessionId },
        { withCredentials: true }
      );
    } catch {}
    setMessages([
      {
        role: "model",
        content: "Fresh start! 🥘 What can I help you cook today?",
        ts: Date.now(),
      },
    ]);
  };

  const copyMessage = (content, idx) => {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(-1), 1500);
  };

  const isSaved = (content) => favs.some((f) => f.content === content);

  const toggleSave = (content) => {
    let updated;
    if (isSaved(content)) {
        // Already saved → remove it (unlike)
        updated = favs.filter((f) => f.content !== content);
    } else {
        // Not saved → add it
        updated = [...favs, { content, savedAt: Date.now() }];
    }
    setFavs(updated);
    localStorage.setItem("zaykaa_favs", JSON.stringify(updated));
  };

  const deleteFav = (idx) => {
    const updated = favs.filter((_, i) => i !== idx);
    setFavs(updated);
    localStorage.setItem("zaykaa_favs", JSON.stringify(updated));
  };

  const fmtTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const showSuggestions = messages.length <= 1;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={styles.bubble}
          aria-label="Open chat"
        >
          💬
        </button>
      )}

      {open && (
        <div style={{ ...styles.window, background: t.bg, color: t.text }}>
          <div style={styles.header}>
            <div>
              <div style={{ fontWeight: 700 }}>Zaykaa Chef AI 👩‍🍳</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>
                Ingredients & recipes assistant
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setShowFavs(true)}
                style={styles.headerBtn}
                title="Saved recipes"
                >
                ❤️
                </button>
              <button
                onClick={() => setDark(!dark)}
                style={styles.headerBtn}
                title={dark ? "Light mode" : "Dark mode"}
              >
                {dark ? "☀️" : "🌙"}
              </button>
              <button
                onClick={clearChat}
                style={styles.headerBtn}
                title="Clear chat"
              >
                ↻
              </button>
              <button
                onClick={() => setOpen(false)}
                style={styles.headerBtn}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          <div style={{ ...styles.messages, background: t.msgBg }}>
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={i}
                  style={{
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    maxWidth: "88%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    className="msg-bubble"
                    style={{
                      ...styles.msg,
                      background: isUser
                        ? "#ff6b35"
                        : dark
                        ? "#2a2d3a"
                        : "#f1f2f4",
                      color: isUser ? "#fff" : dark ? "#e8e8ea" : "#222",
                      borderBottomRightRadius: isUser ? 4 : 16,
                      borderBottomLeftRadius: isUser ? 16 : 4,
                      whiteSpace: isUser ? "pre-wrap" : "normal",
                    }}
                  >
                    {isUser ? (
                      m.content
                    ) : (
                      <div className={dark ? "bot-md bot-md-dark" : "bot-md"}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      marginTop: 3,
                      fontSize: 10,
                      opacity: 0.6,
                    }}
                  >
                    <span>{fmtTime(m.ts)}</span>
                    {!isUser && i > 0 && (
                      <>
                        <button
                          onClick={() => copyMessage(m.content, i)}
                          style={styles.msgAction}
                          title="Copy"
                        >
                          {copiedIdx === i ? "✓ Copied" : "📋 Copy"}
                        </button>
                        <button
                        onClick={() => toggleSave(m.content)}
                        style={{
                            ...styles.msgAction,
                            color: isSaved(m.content) ? "#e74c3c" : "inherit",
                            opacity: isSaved(m.content) ? 1 : 0.7,
                            fontWeight: isSaved(m.content) ? 600 : 400,
                        }}
                        title={isSaved(m.content) ? "Remove from favorites" : "Save recipe"}
                        >
                        {isSaved(m.content) ? "❤️ Saved" : "🤍 Save"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div
                style={{
                  ...styles.msg,
                  background: dark ? "#2a2d3a" : "#f1f2f4",
                  alignSelf: "flex-start",
                }}
              >
                <span style={styles.dot}></span>
                <span
                  style={{ ...styles.dot, animationDelay: "0.2s" }}
                ></span>
                <span
                  style={{ ...styles.dot, animationDelay: "0.4s" }}
                ></span>
              </div>
            )}

            {showSuggestions && !loading && (
              <div style={styles.suggestWrap}>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s)}
                    style={{
                      ...styles.suggestChip,
                      background: dark ? "#2a2d3a" : "#fff",
                      color: dark ? "#e8e8ea" : "#444",
                      borderColor: dark ? "#3a3d4a" : "#ddd",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={endRef} />
            {showFavs && (
                <div
                    style={{
                    ...styles.favsPanel,
                    background: t.bg,
                    color: t.text,
                    }}
                >
                    <div style={styles.favsHeader}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                        ❤️ Saved Recipes ({favs.length})
                    </div>
                    <button
                        onClick={() => setShowFavs(false)}
                        style={styles.headerBtn}
                        title="Close"
                    >
                        ✕
                    </button>
                    </div>

                    <div style={styles.favsList}>
                    {favs.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 24, opacity: 0.6 }}>
                        No saved recipes yet.
                        <br />
                        Click ❤️ Save on any recipe to add it here!
                        </div>
                    ) : (
                        favs
                        .slice()
                        .reverse()
                        .map((f, ridx) => {
                            const idx = favs.length - 1 - ridx;
                            const preview = f.content.split("\n").find((l) => l.trim()) || "Recipe";
                            return (
                            <details
                                key={idx}
                                style={{
                                ...styles.favItem,
                                background: dark ? "#2a2d3a" : "#f7f7f9",
                                borderColor: dark ? "#3a3d4a" : "#eee",
                                }}
                            >
                                <summary style={styles.favSummary}>
                                <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>
                                    {preview.replace(/[#*]/g, "").slice(0, 50)}
                                    {preview.length > 50 ? "…" : ""}
                                </span>
                                <span style={{ fontSize: 10, opacity: 0.6 }}>
                                    {new Date(f.savedAt).toLocaleDateString()}
                                </span>
                                </summary>
                                <div className={dark ? "bot-md bot-md-dark" : "bot-md"}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {f.content}
                                </ReactMarkdown>
                                </div>
                                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                <button
                                    onClick={() => {
                                    navigator.clipboard.writeText(f.content);
                                    alert("📋 Copied to clipboard!");
                                    }}
                                    style={styles.favBtn}
                                >
                                    📋 Copy
                                </button>
                                <button
                                    onClick={() => {
                                    if (window.confirm("Delete this recipe?")) deleteFav(idx);
                                    }}
                                    style={{ ...styles.favBtn, color: "#e74c3c" }}
                                >
                                    🗑️ Delete
                                </button>
                                </div>
                            </details>
                            );
                        })
                    )}
                    </div>
                </div>
                )}
          </div>

          <div
            style={{
              ...styles.inputRow,
              background: t.bg,
              borderTop: `1px solid ${dark ? "#2a2d3a" : "#eee"}`,
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask about ingredients or a recipe... (Shift+Enter for newline)"
              rows={1}
              style={{
                ...styles.input,
                background: dark ? "#1f2230" : "#fff",
                color: dark ? "#e8e8ea" : "#222",
                borderColor: dark ? "#3a3d4a" : "#ddd",
              }}
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{
                ...styles.sendBtn,
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,80%,100%{opacity:.2} 40%{opacity:1} }

        .bot-md { font-size: 14px; line-height: 1.55; }
        .bot-md h1, .bot-md h2, .bot-md h3 {
          margin: 10px 0 6px; font-weight: 700; color: #c2410c;
        }
        .bot-md h1 { font-size: 17px; }
        .bot-md h2 { font-size: 16px; }
        .bot-md h3 { font-size: 14.5px; }
        .bot-md p { margin: 6px 0; }
        .bot-md strong { font-weight: 700; }
        .bot-md ul, .bot-md ol { margin: 6px 0; padding-left: 22px; }
        .bot-md li { margin: 3px 0; }
        .bot-md hr { border:none; border-top:1px solid #e5e5e5; margin:10px 0; }
        .bot-md code {
          background:#eee; padding:1px 6px; border-radius:4px; font-size:13px;
        }
        .bot-md-dark h1, .bot-md-dark h2, .bot-md-dark h3 { color: #ff9a6b; }
        .bot-md-dark strong { color: #fff; }
        .bot-md-dark code { background:#3a3d4a; color:#e8e8ea; }
        .bot-md-dark hr { border-top-color:#3a3d4a; }

        textarea::-webkit-scrollbar { width: 8px; }
        textarea::-webkit-scrollbar-thumb { background:#bbb; border-radius:3px; }
        .msg-bubble button { transition: transform 0.15s, color 0.2s; }
        .msg-bubble button:active { transform: scale(1.25); }
      `}</style>
    </>
  );
}

const lightTheme = { bg: "#fff", text: "#222", msgBg: "#fafafa" };
const darkTheme = { bg: "#15171f", text: "#e8e8ea", msgBg: "#1a1d26" };

const styles = {
  bubble: {
    position: "fixed",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "#ff6b35",
    color: "#fff",
    fontSize: 28,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(255,107,53,0.5)",
    zIndex: 9999,
  },
  window: {
    position: "fixed",
    bottom: 24,
    right: 24,
    width: 400,
    maxWidth: "calc(100vw - 32px)",
    height: 580,
    maxHeight: "calc(100vh - 48px)",
    borderRadius: 16,
    boxShadow: "0 16px 48px rgba(0,0,0,0.35)",
    display: "flex",
    flexDirection: "column",
    zIndex: 9999,
    overflow: "hidden",
    fontFamily: "system-ui, -apple-system, sans-serif",
    transition: "background 0.25s",
  },
  header: {
    background: "linear-gradient(135deg,#ff6b35,#f7931e)",
    color: "#fff",
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerBtn: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "#fff",
    width: 30,
    height: 30,
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: 13,
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    transition: "background 0.25s",
  },
  msg: {
    padding: "10px 14px",
    borderRadius: 16,
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  msgAction: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 10,
    color: "inherit",
    opacity: 0.7,
    padding: "2px 4px",
  },
  suggestWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  suggestChip: {
    fontSize: 12,
    padding: "6px 12px",
    borderRadius: 16,
    border: "1px solid",
    cursor: "pointer",
    transition: "transform 0.15s",
  },
  inputRow: {
    display: "flex",
    gap: 8,
    padding: 12,
    alignItems: "flex-end",
    transition: "background 0.25s, border 0.25s",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    border: "1px solid",
    borderRadius: 18,
    outline: "none",
    fontSize: 14,
    resize: "none",
    fontFamily: "inherit",
    lineHeight: 1.4,
    maxHeight: 100,
    transition: "background 0.25s, color 0.25s, border 0.25s",
  },
  sendBtn: {
    padding: "10px 16px",
    background: "#ff6b35",
    color: "#fff",
    border: "none",
    borderRadius: 24,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 16,
    height: 40,
    transition: "opacity 0.15s",
  },
  dot: {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#888",
    margin: "0 2px",
    animation: "blink 1.4s infinite",
  },
  favsPanel: {
    position: "absolute",
    inset: 0,
    top: 62, // below the header
    display: "flex",
    flexDirection: "column",
    zIndex: 2,
    transition: "background 0.25s",
  },
  favsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid rgba(128,128,128,0.2)",
  },
  favsList: {
    flex: 1,
    overflowY: "auto",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  favItem: {
    border: "1px solid",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
  },
  favSummary: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    listStyle: "none",
    userSelect: "none",
  },
  favBtn: {
    background: "transparent",
    border: "1px solid currentColor",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 11,
    cursor: "pointer",
    color: "inherit",
    opacity: 0.8,
  },
};