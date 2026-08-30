import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api";

const TYPE_STYLE = {
  info:        { icon: "ℹ️", label: "Thông tin",   badge: "badge-type" },
  maintenance: { icon: "🛠️", label: "Bảo trì",     badge: "badge-type" },
  incident:    { icon: "🚨", label: "Sự cố",        badge: "badge-offline" },
};

function Broadcasts({ onLogout }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdminUp = user.role === "admin";

  const [broadcasts, setBroadcasts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "info" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBroadcasts(); }, []);

  const fetchBroadcasts = async () => {
    try {
      const res = await api.get("/broadcasts");
      setBroadcasts(res.data);
    } catch {}
    setLoading(false);
  };

  const submitBroadcast = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    try {
      const res = await api.post("/broadcasts", form);
      setMessage(res.data.message);
      setForm({ title: "", message: "", type: "info" });
      setShowForm(false);
      fetchBroadcasts();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi gửi thông báo");
    }
  };

  const deleteBroadcast = async (id) => {
    if (!confirm("Xóa thông báo này?")) return;
    try {
      await api.delete(`/broadcasts/${id}`);
      fetchBroadcasts();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi xóa thông báo");
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar onLogout={onLogout} />
      <div className="dashboard-main">
        <header className="dashboard-navbar">
          <h1 className="navbar-title">📢 Thông báo công ty</h1>
          {isAdminUp && (
            <button className="auth-button" style={{ width: "auto", padding: "8px 18px" }} onClick={() => setShowForm(true)}>
              + Gửi thông báo
            </button>
          )}
        </header>

        <main className="dashboard-content">
          {message && <p className="auth-success">{message}</p>}
          {error   && <p className="auth-error">{error}</p>}

          {showForm && (
            <form className="auth-card" onSubmit={submitBroadcast} style={{ maxWidth: "100%" }}>
              <h3>📨 Gửi thông báo mới</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Thông báo sẽ hiện ngay lập tức cho toàn bộ nhân sự trong công ty.
              </p>

              <div className="form-group">
                <label htmlFor="b-title">Tiêu đề *</label>
                <input
                  id="b-title" name="title"
                  placeholder="VD: Bảo trì hệ thống mạng tầng 3"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="b-type">Loại thông báo *</label>
                <select id="b-type" name="type" className="form-select" aria-label="Loại thông báo"
                  value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="info">ℹ️ Thông tin chung</option>
                  <option value="maintenance">🛠️ Bảo trì</option>
                  <option value="incident">🚨 Sự cố</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="b-message">Nội dung *</label>
                <textarea
                  id="b-message" name="message"
                  placeholder="Nội dung chi tiết thông báo..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  style={{
                    background: "var(--bg-surface)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)", padding: "11px 14px",
                    color: "var(--text-primary)", fontFamily: "inherit", fontSize: "0.93rem",
                    resize: "vertical", minHeight: "100px", outline: "none", width: "100%",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button className="auth-button" type="submit" style={{ width: "auto", padding: "10px 24px" }}>📨 Gửi ngay</button>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
              </div>
            </form>
          )}

          {loading ? (
            <p style={{ color: "var(--text-muted)" }}>Đang tải...</p>
          ) : broadcasts.length === 0 ? (
            <div className="placeholder-panel">📭 Chưa có thông báo nào</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {broadcasts.map(b => {
                const style = TYPE_STYLE[b.type] || TYPE_STYLE.info;
                return (
                  <div key={b.broadcastId} className="auth-card" style={{ maxWidth: "100%", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                          {style.icon} {b.title}
                        </h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                          <span className={`badge ${style.badge}`}>{style.label}</span>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            {b.authorName} ({b.authorRole}) · {new Date(b.createdAt).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      </div>
                      {isAdminUp && (
                        <button className="btn-delete" onClick={() => deleteBroadcast(b.broadcastId)}>🗑️</button>
                      )}
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{b.message}</p>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Broadcasts;