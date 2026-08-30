import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api";

const STATUS_STYLE = {
  requested:         { label: "Chờ duyệt",                 color: "#f59e0b" },
  awaiting_payment:  { label: "Chờ thanh toán",            color: "#3b82f6" },
  payment_submitted: { label: "Chờ xác nhận tiền",         color: "#f59e0b" },
  confirmed:         { label: "Đã thanh toán",             color: "#10b981" },
  processing:        { label: "Đang mua hộ",               color: "#10b981" },
  delivered:         { label: "Đã giao thành công",        color: "#22c55e" },
  rejected:          { label: "Đã hủy/từ chối",            color: "#ef4444" },
};

function MyOrders({ onLogout }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  useEffect(() => { fetchOrders(); }, []);

  const [loadError, setLoadError] = useState("");

  const fetchOrders = async () => {
  setLoadError("");
  try {
    const res = await api.get("/orders");
    setOrders(res.data);
  } catch (err) {
    setLoadError(err.response?.data?.message || "Không tải được danh sách đơn hàng.");
  }
  setLoading(false);
};
  const visibleOrders = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;

  return (
    <div className="dashboard-layout">
      <Sidebar onLogout={onLogout} />
      <div className="dashboard-main">
        <header className="dashboard-navbar">
          <h1 className="navbar-title">📦 Đơn hàng của tôi</h1>
        </header>
        <main className="dashboard-content">
        <div style={{ marginBottom: 12 }}>
        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 240 }}>
        <option value="">Tất cả trạng thái</option>
        {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        </div>
        <div className="table-wrapper">
            {loading ? (
              <p style={{ padding: 20, color: "var(--text-muted)" }}>Đang tải...</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th><th>Nền tảng</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày tạo</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                        {loadError ? `⚠️ ${loadError}` : statusFilter ? "Không có đơn nào ở trạng thái này" : "Bạn chưa có đơn hàng nào"}
                      </td></tr>
                  ) : visibleOrders.map(o => (
                    <tr key={o.orderId} style={{ cursor: "pointer" }} onClick={() => navigate(`/checkout/${o.orderId}`)}>
                      <td><strong>{o.itemName}</strong></td>
                      <td>{o.platform}</td>
                      <td>{o.totalPrice != null ? `${o.totalPrice.toLocaleString("vi-VN")}đ` : "—"}</td>
                      <td><span style={{ color: STATUS_STYLE[o.status]?.color, fontWeight: 600, fontSize: "0.85rem" }}>{STATUS_STYLE[o.status]?.label}</span></td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                      <td><button className="btn-edit" style={{ fontSize: "0.78rem" }}>Xem →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default MyOrders;
