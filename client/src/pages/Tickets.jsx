import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api";

const PRIORITY_STYLE = {
  LOW:    { label: "🟢 Thấp",      badge: "badge-online" },
  MEDIUM: { label: "🟡 Trung bình", badge: "badge-type" },
  HIGH:   { label: "🔴 Cao",       badge: "badge-offline" },
};

const STATUS_STYLE = {
  OPEN:        { label: "Mở",         color: "#ef4444" },
  IN_PROGRESS: { label: "Đang xử lý", color: "#f59e0b" },
  RESOLVED:    { label: "Đã xử lý",   color: "#10b981" },
};

function Tickets({ onLogout }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdminUp = user.role === "admin";

  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", orderId: "" });
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get("/tickets");
      setTickets(res.data);
    } catch {}
    setLoading(false);
  };

  const refreshSelected = async (id) => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setSelected(res.data);
    } catch {}
  };

  const submitTicket = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    try {
      const res = await api.post("/tickets", form);
      setMessage(res.data.message);
      setForm({ title: "", description: "", priority: "MEDIUM", orderId: "" });
      setShowForm(false);
      fetchTickets();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi gửi báo cáo");
    }
  };

  const claimTicket = async (id) => {
    setError(""); setMessage("");
    try {
      const res = await api.put(`/tickets/${id}/claim`);
      setMessage(res.data.message);
      fetchTickets();
      if (selected?.ticketId === id) refreshSelected(id);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi nhận xử lý");
    }
  };

  const resolveTicket = async (id) => {
    setError(""); setMessage("");
    try {
      const res = await api.put(`/tickets/${id}/resolve`);
      setMessage(res.data.message);
      fetchTickets();
      if (selected?.ticketId === id) refreshSelected(id);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi cập nhật");
    }
  };

  const reopenTicket = async (id) => {
    setError(""); setMessage("");
    try {
      const res = await api.put(`/tickets/${id}/reopen`);
      setMessage(res.data.message);
      fetchTickets();
      if (selected?.ticketId === id) refreshSelected(id);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi mở lại ticket");
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await api.post(`/tickets/${selected.ticketId}/comments`, { text: comment });
      setComment("");
      refreshSelected(selected.ticketId);
      fetchTickets();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi thêm bình luận");
    }
  };

  const openTicket = async (t) => {
    setError("");
    await refreshSelected(t.ticketId);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar onLogout={onLogout} />
      <div className="dashboard-main">
        <header className="dashboard-navbar">
          <h1 className="navbar-title">🎫 Hỗ trợ khách hàng</h1>
          <button className="auth-button" style={{ width: "auto", padding: "8px 18px" }} onClick={() => setShowForm(true)}>
            + Gửi yêu cầu hỗ trợ
          </button>
        </header>

        <main className="dashboard-content">
          {message && <p className="auth-success">{message}</p>}
          {error   && <p className="auth-error">{error}</p>}

          {showForm && (
            <form className="auth-card" onSubmit={submitTicket} style={{ maxWidth: "100%" }}>
              <h3>📋 Yêu cầu hỗ trợ mới</h3>

              <div className="form-group">
                <label htmlFor="title">Tiêu đề *</label>
                <input
                  id="title" name="title"
                  placeholder="VD: Chưa nhận được tài khoản Netflix"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="priority">Mức độ ưu tiên *</label>
                  <select id="priority" name="priority" className="form-select" aria-label="Mức độ ưu tiên"
                    value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="LOW">🟢 Thấp — Ít ảnh hưởng</option>
                    <option value="MEDIUM">🟡 Trung bình — Ảnh hưởng một phần</option>
                    <option value="HIGH">🔴 Cao — Ảnh hưởng nghiêm trọng</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="orderId">Mã đơn hàng liên quan (nếu có)</label>
                  <input
                    id="orderId" name="orderId"
                    placeholder="VD: 1751234567890"
                    value={form.orderId}
                    onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Mô tả chi tiết *</label>
                <textarea
                  id="description" name="description"
                  placeholder="Mô tả chi tiết tình trạng lỗi, thời điểm phát hiện..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                <button className="auth-button" type="submit" style={{ width: "auto", padding: "10px 24px" }}>📨 Gửi báo cáo</button>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
              </div>
            </form>
          )}

          <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: "20px" }}>
            {/* Danh sách */}
            <div className="table-wrapper">
              {loading ? (
                <p style={{ padding: "20px", color: "var(--text-muted)" }}>Đang tải...</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tiêu đề</th><th>Đơn liên quan</th><th>Mức độ</th><th>Trạng thái</th>
                      <th>Người báo</th><th>Admin xử lý</th><th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>Chưa có yêu cầu hỗ trợ nào</td></tr>
                    ) : tickets.map(t => (
                      <tr key={t.ticketId} onClick={() => openTicket(t)} style={{ cursor: "pointer", background: selected?.ticketId === t.ticketId ? "rgba(59,130,246,0.05)" : "" }}>
                        <td><strong>{t.title}</strong></td>
                        <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{t.orderId ? `#${t.orderId}` : "—"}</td>
                        <td><span className={`badge ${PRIORITY_STYLE[t.priority]?.badge}`}>{PRIORITY_STYLE[t.priority]?.label}</span></td>
                        <td><span style={{ color: STATUS_STYLE[t.status]?.color, fontWeight: 600, fontSize: "0.82rem" }}>{STATUS_STYLE[t.status]?.label}</span></td>
                        <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{t.creatorName}</td>
                        <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{t.adminName || "—"}</td>
                        <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(t.createdAt).toLocaleString("vi-VN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Chi tiết */}
            {selected && (
              <div className="auth-card" style={{ maxWidth: "100%", height: "fit-content" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h3 style={{ flex: 1, marginRight: "8px" }}>{selected.title}</h3>
                  <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>×</button>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span className={`badge ${PRIORITY_STYLE[selected.priority]?.badge}`}>{PRIORITY_STYLE[selected.priority]?.label}</span>
                  <span style={{ color: STATUS_STYLE[selected.status]?.color, fontSize: "0.82rem", fontWeight: 600 }}>{STATUS_STYLE[selected.status]?.label}</span>
                </div>

                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{selected.description}</p>

                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {selected.orderId && <span>📦 Đơn hàng liên quan: <strong style={{ color: "var(--text-secondary)" }}>#{selected.orderId}</strong></span>}
                  <span>Báo cáo bởi: <strong style={{ color: "var(--text-secondary)" }}>{selected.creatorName}</strong> · {new Date(selected.createdAt).toLocaleString("vi-VN")}</span>
                  {selected.adminName && <span>Đang xử lý bởi: <strong style={{ color: "var(--accent-bright)" }}>{selected.adminName}</strong></span>}
                </div>

                {/* Actions cho Admin */}
                {isAdminUp && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {selected.status === "OPEN" && (
                      <button className="btn-edit" onClick={() => claimTicket(selected.ticketId)}>🙋 Nhận xử lý</button>
                    )}
                    {selected.status === "IN_PROGRESS" && (
                      <button className="btn-edit" onClick={() => resolveTicket(selected.ticketId)}>✅ Đánh dấu hoàn thành</button>
                    )}
                    {selected.status === "RESOLVED" && (
                      <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "0.82rem" }} onClick={() => reopenTicket(selected.ticketId)}>🔄 Mở lại ticket</button>
                    )}
                  </div>
                )}

                {/* Comments */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Thảo luận ({selected.comments?.length || 0})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "220px", overflowY: "auto" }}>
                    {selected.comments?.map(c => (
                      <div key={c.commentId} style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", padding: "8px 12px", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-bright)" }}>
                            {c.userName} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({c.userRole})</span>
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{new Date(c.createdAt).toLocaleString("vi-VN")}</span>
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{c.text}</p>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={addComment} style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    <input
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Thêm bình luận..."
                      style={{
                        flex: 1, background: "var(--bg-surface)", border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)", padding: "8px 12px", color: "var(--text-primary)",
                        fontFamily: "inherit", fontSize: "0.85rem", outline: "none",
                      }}
                    />
                    <button className="auth-button" type="submit" style={{ width: "auto", padding: "8px 14px", fontSize: "0.82rem" }}>Gửi</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Tickets;