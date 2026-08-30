import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api";

const STATUS_STYLE = {
  requested:         { label: "Chờ báo giá",              color: "#f59e0b" },
  awaiting_payment:  { label: "Chờ thanh toán",            color: "#3b82f6" },
  payment_submitted: { label: "Chờ xác nhận thanh toán",   color: "#f59e0b" },
  confirmed:         { label: "Đã thanh toán",             color: "#10b981" },
  processing:        { label: "Đang xử lý",                color: "#10b981" },
  delivered:         { label: "Đã giao thành công",        color: "#22c55e" },
  rejected:          { label: "Đã hủy/từ chối",            color: "#ef4444" },
};

const PLATFORMS = ["Steam"];

function AdminOrders({ onLogout }) {
  const [tab, setTab] = useState("orders"); // orders | catalog
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ originalPrice: "", fee: "" });
  const [deliveryNote, setDeliveryNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [catalog, setCatalog] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", platform: "Steam", image: "🎮", description: "", originalPrice: "", fee: "" });

    useEffect(() => {
    const interval = setInterval(() => {
      if (tab === "orders" && document.visibilityState === "visible") {
        fetchOrders();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [tab]);
  useEffect(() => { fetchOrders(); }, [filter]);

    const fetchOrders = async () => {
    try {
      const res = await api.get("/admin/orders", { params: filter ? { status: filter } : {} });
      setOrders(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được danh sách đơn hàng.");
    }
  };

    const fetchCatalog = async () => {
    try {
      const res = await api.get("/catalog");
      setCatalog(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Không tải được kho sản phẩm.");
    }
  };

  const openOrder = (o) => { setSelected(o); setQuoteForm({ originalPrice: "", fee: "" }); setDeliveryNote(""); setRejectReason(""); setError(""); setMessage(""); };
  const filteredOrders = orders.filter(o => {
  if (!search.trim()) return true;
  const q = search.trim().toLowerCase();
  return (
    String(o.orderId).includes(q) ||
    (o.userName || "").toLowerCase().includes(q) ||
    (o.transactionCode || "").toLowerCase().includes(q) ||
    (o.transferContent || "").toLowerCase().includes(q)
  );
});
  const doAction = async (fn) => {
    setError(""); setMessage("");
    try {
      const res = await fn();
      setMessage(res.data.message);
      await fetchOrders();
      if (res.data.order) setSelected(res.data.order);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const submitQuote = (e) => {
    e.preventDefault();
    doAction(() => api.put(`/admin/orders/${selected.orderId}/quote`, {
      originalPrice: Number(quoteForm.originalPrice),
      fee: quoteForm.fee !== "" ? Number(quoteForm.fee) : undefined,
    }));
  };

  const confirmPayment = () => doAction(() => api.put(`/admin/orders/${selected.orderId}/confirm-payment`));
  const setProcessing  = () => doAction(() => api.put(`/admin/orders/${selected.orderId}/processing`));
  const deliverOrder   = () => doAction(() => api.put(`/admin/orders/${selected.orderId}/deliver`, { deliveryNote }));
  const rejectOrder    = () => doAction(() => api.put(`/admin/orders/${selected.orderId}/reject`, { reason: rejectReason }));

  const addCatalogItem = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    try {
      const res = await api.post("/catalog", {
        ...newItem,
        originalPrice: Number(newItem.originalPrice),
        fee: newItem.fee !== "" ? Number(newItem.fee) : undefined,
      });
      setMessage(res.data.message);
      setNewItem({ name: "", platform: "Steam", image: "🎮", description: "", originalPrice: "", fee: "" });
      fetchCatalog();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi thêm sản phẩm");
    }
  };

    const toggleActive = async (item) => {
    try {
      await api.put(`/catalog/${item.id}`, { active: !item.active });
      fetchCatalog();
    } catch (err) {
      setError(err.response?.data?.message || "Không cập nhật được sản phẩm.");
    }
  };

  const deleteItem = async (item) => {
    try {
      await api.delete(`/catalog/${item.id}`);
      fetchCatalog();
    } catch (err) {
      setError(err.response?.data?.message || "Không xóa được sản phẩm.");
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar onLogout={onLogout} />
      <div className="dashboard-main">
        <header className="dashboard-navbar">
          <h1 className="navbar-title">🛠️ Quản trị</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={tab === "orders" ? "auth-button" : "btn-secondary"} style={{ width: "auto", padding: "8px 16px" }} onClick={() => setTab("orders")}>📦 Đơn hàng</button>
            <button className={tab === "catalog" ? "auth-button" : "btn-secondary"} style={{ width: "auto", padding: "8px 16px" }} onClick={() => setTab("catalog")}>🗂️ Kho sản phẩm</button>
            <button className="btn-delete" style={{ width: "auto", padding: "8px 16px" }} onClick={async () => {
  const days = prompt("Xóa đơn hàng cũ hơn bao nhiêu ngày?", "30");
  if (!days) return;
  try {
    const res = await api.delete(`/admin/cleanup?days=${days}&type=orders`);
    alert(res.data.message);
    fetchOrders();
  } catch (err) { alert(err.response?.data?.message || "Lỗi"); }
}}>🗑️ Xóa đơn cũ</button>
<button className="btn-delete" style={{ width: "auto", padding: "8px 16px" }} onClick={async () => {
  if (!confirm("Xóa toàn bộ thông báo cũ hơn 30 ngày?")) return;
  try {
    const res = await api.delete("/admin/cleanup?days=30&type=broadcasts");
    alert(res.data.message);
  } catch (err) { alert(err.response?.data?.message || "Lỗi"); }
}}>🗑️ Xóa thông báo</button>
<button className="btn-delete" style={{ width: "auto", padding: "8px 16px" }} onClick={async () => {
  if (!confirm("Xóa toàn bộ ticket cũ hơn 30 ngày?")) return;
  try {
    const res = await api.delete("/admin/cleanup?days=30&type=tickets");
    alert(res.data.message);
  } catch (err) { alert(err.response?.data?.message || "Lỗi"); }
}}>🗑️ Xóa ticket</button>
          </div>
        </header>

        <main className="dashboard-content">
          {message && <p className="auth-success">{message}</p>}
          {error && <p className="auth-error">{error}</p>}

                    {tab === "orders" && (
            <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 20 }}>
              <div>
                <div className="stats-grid" style={{ marginBottom: 16 }}>
                  {[
                    { key: "requested", label: "Chờ báo giá", icon: "📝" },
                    { key: "payment_submitted", label: "Chờ xác nhận tiền", icon: "⏳" },
                    { key: "confirmed", label: "Đã thanh toán", icon: "✅" },
                    { key: "processing", label: "Đang xử lý", icon: "⚙️" },
                  ].map(s => (
                    <div key={s.key} className="stat-card" style={{ cursor: "pointer" }} onClick={() => setFilter(s.key)}>
                      <div className="stat-icon">{s.icon}</div>
                      <div className="stat-info">
                        <span className="stat-label">{s.label}</span>
                        <span className="stat-value">{orders.filter(o => o.status === s.key).length}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 12, display: "flex", gap: 10 }}>
                  <div className="search-bar">
                    <input
                      placeholder="Tìm theo mã đơn hoặc tên khách hàng..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button className="search-clear" onClick={() => setSearch("")} type="button">✕</button>
                    )}
                  </div>
                  <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 220, flexShrink: 0 }}>
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr><th>Sản phẩm</th><th>Khách hàng</th><th>Mã GD</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày tạo</th></tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                          {search.trim() ? "Không tìm thấy đơn hàng phù hợp" : "Không có đơn hàng nào"}
                        </td></tr>
                      ) : filteredOrders.map(o => (
                          <tr key={o.orderId} onClick={() => openOrder(o)} style={{ cursor: "pointer", background: selected?.orderId === o.orderId ? "rgba(59,130,246,0.05)" : "" }}>
                          <td><strong>{o.itemName}</strong> <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>#{o.orderId}</span></td>
                          <td style={{ fontSize: "0.85rem" }}>{o.userName}</td>
                          <td><code className="reconcile-code">{o.transferContent || o.transactionCode || "—"}</code></td>
                          <td>{o.totalPrice != null ? `${o.totalPrice.toLocaleString("vi-VN")}đ` : "—"}</td>
                          <td><span style={{ color: STATUS_STYLE[o.status]?.color, fontWeight: 600, fontSize: "0.82rem" }}>{STATUS_STYLE[o.status]?.label}</span></td>
                          <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selected && (
                <div className="auth-card" style={{ maxWidth: "100%", height: "fit-content" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <h3>{selected.itemName}</h3>
                    <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>×</button>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Khách hàng: <strong>{selected.userName}</strong> ({selected.userEmail})
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Nền tảng: {selected.platform}</p>
                  {selected.link && (
  <div style={{ background: "#451a03", border: "1px solid #f59e0b", borderRadius: 8, padding: "8px 12px", marginTop: 8 }}>
    <p style={{ color: "#fbbf24", fontSize: "0.78rem", margin: 0, fontWeight: 600 }}>
      ⚠️ Kiểm tra kỹ link trước khi mở. Chỉ mở trên trình duyệt có quét virus.
    </p>
    <p style={{ wordBreak: "break-all", fontSize: "0.82rem", margin: "4px 0 0", color: "var(--text-secondary)" }}>
      {selected.link}
    </p>
  </div>
)}
                  {selected.note && <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Ghi chú: {selected.note}</p>}
                                    {/* ── Panel đối soát ── */}
                  {selected.transferContent && (
                    <div style={{ margin: "10px 0", padding: "14px 16px", background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                        🔍 Đối soát chuyển khoản
                      </p>
                      <p style={{ margin: "0 0 4px", fontSize: "0.8rem", color: "var(--text-muted)" }}>Nội dung CK khách cần ghi:</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <code style={{ flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.88rem", color: "var(--accent-bright)", background: "var(--bg-base)", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", wordBreak: "break-all" }}>
                          {selected.transferContent}
                        </code>
                        <button
                          className="copy-btn"
                          style={{ padding: "8px 12px", fontSize: "0.78rem" }}
                          onClick={async () => {
                            try { await navigator.clipboard.writeText(selected.transferContent); } catch {}
                          }}
                        >Copy</button>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "6px 0 0" }}>
                        Tra trên app ngân hàng: tìm nội dung khớp <strong style={{ color: "var(--text-secondary)" }}>{selected.transferContent}</strong> với số tiền <strong style={{ color: "var(--text-secondary)" }}>{selected.totalPrice?.toLocaleString("vi-VN")}đ</strong>
                      </p>
                    </div>
                  )}
                  {selected.totalPrice != null && (
                    <p style={{ fontSize: "0.9rem" }}>
                      Giá gốc {selected.originalPrice?.toLocaleString("vi-VN")}đ + phí {selected.fee?.toLocaleString("vi-VN")}đ =
                      <strong style={{ color: "var(--accent-bright)" }}> {selected.totalPrice?.toLocaleString("vi-VN")}đ</strong>
                    </p>
                  )}
                  <p style={{ fontSize: "0.82rem" }}>
                    Trạng thái: <strong style={{ color: STATUS_STYLE[selected.status]?.color }}>{STATUS_STYLE[selected.status]?.label}</strong>
                  </p>

                  {selected.status === "requested" && (
                    <form onSubmit={submitQuote} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selected.customerPrice != null && (
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", background: "var(--bg-surface)", padding: "8px 12px", borderRadius: "var(--radius-sm)" }}>
                        💡 Giá khách đề xuất: <strong>{selected.customerPrice.toLocaleString("vi-VN")}đ</strong> — Bạn có thể dùng hoặc nhập giá gốc khác bên dưới.
                      </p>
                    )}
                    <div className="form-group">
                      <label>Giá gốc (đ) *</label>
                      <input type="number" required value={quoteForm.originalPrice} onChange={(e) => setQuoteForm({ ...quoteForm, originalPrice: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Phụ thu (đ, mặc định 10.000đ)</label>
                      <input type="number" placeholder="10000" value={quoteForm.fee} onChange={(e) => setQuoteForm({ ...quoteForm, fee: e.target.value })} />
                    </div>
                    <button className="auth-button" type="submit">📨 Gửi báo giá</button>
                  </form>
                )}

                  {["awaiting_payment", "payment_submitted"].includes(selected.status) && (
                    <button className="btn-edit" onClick={confirmPayment}>✅ Xác nhận đã nhận tiền (VietQR/MoMo)</button>
                  )}

                  {selected.status === "confirmed" && (
                    <button className="btn-edit" onClick={setProcessing}>⚙️ Bắt đầu xử lý (đang mua hộ)</button>
                  )}

                  {["confirmed", "processing"].includes(selected.status) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <textarea
                        placeholder="Ghi chú giao hàng (tài khoản, key, mã kích hoạt...)"
                        value={deliveryNote}
                        onChange={(e) => setDeliveryNote(e.target.value)}
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 10, color: "var(--text-primary)", minHeight: 70 }}
                      />
                      <button className="auth-button" onClick={deliverOrder}>📬 Đánh dấu đã giao</button>
                    </div>
                  )}

                  {!["delivered", "rejected"].includes(selected.status) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                      <input placeholder="Lý do hủy/từ chối" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                      <button className="btn-secondary" onClick={rejectOrder}>🚫 Hủy / Từ chối đơn</button>
                    </div>
                  )}

                  {selected.deliveryNote && selected.status === "delivered" && (
                    <p style={{ background: "var(--bg-surface)", padding: 10, borderRadius: "var(--radius-sm)" }}>{selected.deliveryNote}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === "catalog" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <form className="auth-card" onSubmit={addCatalogItem} style={{ maxWidth: "100%" }}>
                <h3>+ Thêm sản phẩm vào kho</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tên sản phẩm *</label>
                    <input required value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Nền tảng *</label>
                    <select className="form-select" value={newItem.platform} onChange={(e) => setNewItem({ ...newItem, platform: e.target.value })}>
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Giá gốc (đ) *</label>
                    <input type="number" required value={newItem.originalPrice} onChange={(e) => setNewItem({ ...newItem, originalPrice: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Phụ phí (đ, để trống để tự gợi ý 5.000-10.000)</label>
                    <input type="number" value={newItem.fee} onChange={(e) => setNewItem({ ...newItem, fee: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Emoji hiển thị</label>
                  <input value={newItem.image} onChange={(e) => setNewItem({ ...newItem, image: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Mô tả</label>
                  <input value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
                </div>
                <button className="auth-button" type="submit" style={{ width: "auto", padding: "10px 24px" }}>+ Thêm vào kho</button>
              </form>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Sản phẩm</th><th>Nền tảng</th><th>Giá gốc</th><th>Phí</th><th>Tổng</th><th>Trạng thái</th><th></th></tr></thead>
                  <tbody>
                    {catalog.map(item => (
                      <tr key={item.id}>
                        <td>{item.image} <strong>{item.name}</strong></td>
                        <td>{item.platform}</td>
                        <td>{item.originalPrice.toLocaleString("vi-VN")}đ</td>
                        <td>{item.fee.toLocaleString("vi-VN")}đ</td>
                        <td>{item.totalPrice.toLocaleString("vi-VN")}đ</td>
                        <td><span className={`badge ${item.active ? "badge-online" : "badge-offline"}`}>{item.active ? "Đang bán" : "Đã ẩn"}</span></td>
                        <td style={{ display: "flex", gap: 6 }}>
                          <button className="btn-edit" style={{ fontSize: "0.78rem" }} onClick={() => toggleActive(item)}>{item.active ? "Ẩn" : "Hiện"}</button>
                          <button className="btn-delete" style={{ fontSize: "0.78rem" }} onClick={() => deleteItem(item)}>Xóa</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminOrders;
