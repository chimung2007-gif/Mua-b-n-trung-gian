import { useEffect, useState, useRef } from "react";
import api from "../api";

function BroadcastBanner() {
  const [queue, setQueue] = useState([]);
  const lastIdRef = useRef(parseInt(localStorage.getItem("lastBroadcastSeen") || "0"));

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await api.get(`/broadcasts/since/${lastIdRef.current}`);
        if (res.data.length > 0) {
          setQueue(prev => [...res.data, ...prev]);
          lastIdRef.current = Math.max(...res.data.map(b => b.broadcastId), lastIdRef.current);
          localStorage.setItem("lastBroadcastSeen", lastIdRef.current);
        }
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 10000); // poll mỗi 10 giây
    return () => clearInterval(interval);
  }, []);

  const dismiss = (id) => {
    setQueue(prev => prev.filter(b => b.broadcastId !== id));
  };

  const TYPE_STYLE = {
    info:        { icon: "ℹ️", border: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
    maintenance: { icon: "🛠️", border: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    incident:    { icon: "🚨", border: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  };

  if (queue.length === 0) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: "var(--sidebar-width)", right: 0,
      zIndex: 999, display: "flex", flexDirection: "column", gap: "2px",
    }}>
      {queue.map(b => {
        const style = TYPE_STYLE[b.type] || TYPE_STYLE.info;
        return (
          <div key={b.broadcastId} style={{
            background: style.bg,
            borderBottom: `2px solid ${style.border}`,
            padding: "12px 24px",
            display: "flex", alignItems: "flex-start", gap: "12px",
            backdropFilter: "blur(8px)",
            animation: "slideDown 0.3s ease",
          }}>
            <span style={{ fontSize: "1.1rem" }}>{style.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{b.title}</strong>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  · {b.authorName} ({b.authorRole})
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>{b.message}</p>
            </div>
            <button
              onClick={() => dismiss(b.broadcastId)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer", lineHeight: 1 }}
            >×</button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default BroadcastBanner;