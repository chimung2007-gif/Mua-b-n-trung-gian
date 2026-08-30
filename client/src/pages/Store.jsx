import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api";

const PLATFORMS = ["Steam"];

function Store({ onLogout }) {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCustom, setShowCustom] = useState(false);
  const [customForm, setCustomForm] = useState({ itemName: "", platform: "Steam", link: "", customerPrice: "", note: "", paymentMethod: "vietqr" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { fetchCatalog(); }, []);

 const [loadError, setLoadError] = useState("");

 const fetchCatalog = async () => {
  setLoadError("");
  try {
    const res = await api.get("/catalog");
    setCatalog(res.data);
  } catch (err) {
    setLoadError(err.response?.data?.message || "Không tải được danh sách sản phẩm. Kiểm tra kết nối server.");
    console.error("Lỗi tải catalog:", err);
  }
  setLoading(false);
};

  const buyCatalogItem = async (item, paymentMethod) => {
    setError(""); setMessage("");
    try {
      const res = await api.post("/orders", { mode: "catalog", catalogId: item.id, paymentMethod });
      navigate(`/checkout/${res.data.order.orderId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi tạo đơn hàng");
    }
  };

  const submitCustom = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    try {
      const res = await api.post("/orders", { mode: "custom", ...customForm });
      setMessage(res.data.message);
      setShowCustom(false);
      setCustomForm({ itemName: "", platform: "Steam", link: "", customerPrice: "", note: "", paymentMethod: "vietqr" });
      setTimeout(() => navigate("/my-orders"), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi gửi yêu cầu");
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar onLogout={onLogout} />
      <div className="dashboard-main">
        <header className="dashboard-navbar">
          <h1 className="navbar-title">🎮 Cửa hàng mua hộ</h1>
          <button className="auth-button" style={{ width: "auto", padding: "8px 18px" }} onClick={() => setShowCustom(true)}>
            + Yêu cầu tùy chỉnh
          </button>
        </header>

        <main className="dashboard-content">
          <div className="welcome-card">
            <h2>Mua hộ game & dịch vụ số 🎮</h2>
            <p>Chọn sản phẩm có sẵn bên dưới hoặc gửi yêu cầu mua trung gian. Phụ thu 10.000đ mỗi đơn. Thanh toán qua VietQR hoặc MoMo.</p>
          </div>

          {message && <p className="auth-success">{message}</p>}
          {error && <p className="auth-error">{error}</p>}

          {showCustom && (
  <form className="auth-card" onSubmit={submitCustom} style={{ maxWidth: "100%" }}>
    <h3>📝 Yêu cầu mua trung gian</h3>
    <p className="auth-subtitle" style={{ marginTop: "-6px" }}>
      Nhập tên sản phẩm, dán link và ghi giá bạn muốn mua. Admin sẽ duyệt và cộng thêm phụ thu 10.000đ, sau đó bạn quét mã VietQR hoặc MoMo để thanh toán.
    </p>

    <div className="form-grid">
      <div className="form-group">
        <label>Nền tảng *</label>
        <select className="form-select" value={customForm.platform}
          onChange={(e) => setCustomForm({ ...customForm, platform: e.target.value })}>
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Phương thức thanh toán *</label>
        <select className="form-select" value={customForm.paymentMethod}
          onChange={(e) => setCustomForm({ ...customForm, paymentMethod: e.target.value })}>
          <option value="vietqr">📱 VietQR (chuyển khoản ngân hàng)</option>
          <option value="momo">📱 MoMo</option>
        </select>
      </div>
    </div>

    <div className="form-group">
      <label>Tên sản phẩm / dịch vụ *</label>
      <input
        placeholder="VD: Elden Ring, gói Netflix 1 năm..."
        value={customForm.itemName}
        onChange={(e) => setCustomForm({ ...customForm, itemName: e.target.value })}
        required
      />
    </div>

    <div className="form-group">
      <label>Link sản phẩm</label>
      <input
        placeholder="VD: https://store.steampowered.com/app/... (chỉ chấp nhận link http/https)"
        value={customForm.link}
        onChange={(e) => setCustomForm({ ...customForm, link: e.target.value })}
      />
    </div>

    <div className="form-group">
      <label>Giá sản phẩm (đ) *</label>
      <input
        type="number"
        placeholder="VD: 250000"
        value={customForm.customerPrice}
        onChange={(e) => setCustomForm({ ...customForm, customerPrice: e.target.value })}
        required min="1000"
      />
    </div>

    <div className="form-group">
      <label>Ghi chú thêm</label>
      <textarea
        placeholder="VD: mua vào dịp sale, cần gấp trong hôm nay..."
        value={customForm.note}
        onChange={(e) => setCustomForm({ ...customForm, note: e.target.value })}
        style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)", padding: "11px 14px",
          color: "var(--text-primary)", fontFamily: "inherit", fontSize: "0.93rem",
          resize: "vertical", minHeight: "80px", outline: "none", width: "100%",
        }}
      />
    </div>

    <div style={{ display: "flex", gap: "12px" }}>
      <button className="auth-button" type="submit" style={{ width: "auto", padding: "10px 24px" }}>📨 Gửi yêu cầu</button>
      <button type="button" className="btn-secondary" onClick={() => setShowCustom(false)}>Hủy</button>
    </div>
  </form>
)}

          {loading ? (
            <p style={{ color: "var(--text-muted)" }}>Đang tải sản phẩm...</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
              {catalog.map(item => (
                <div key={item.id} className="auth-card" style={{ maxWidth: "100%", gap: "10px" }}>
                  <div style={{ fontSize: "2rem" }}>{item.image}</div>
                  <h3 style={{ fontSize: "1.05rem" }}>{item.name}</h3>
                  <span style={{
                    fontSize: "0.72rem", fontWeight: 700, padding: "2px 10px", width: "fit-content",
                    borderRadius: "99px", background: "var(--accent-dim)", color: "var(--accent-bright)",
                  }}>
                    {item.platform}
                  </span>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{item.description}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--accent-bright)" }}>
                      {item.totalPrice.toLocaleString("vi-VN")}đ
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      (gốc {item.originalPrice.toLocaleString("vi-VN")}đ + phí {item.fee.toLocaleString("vi-VN")}đ)
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="auth-button" style={{ flex: 1, padding: "8px" }} onClick={() => buyCatalogItem(item, "vietqr")}> 📱 Mua qua VietQR</button>
  <button className="btn-secondary" style={{ flex: 1, padding: "8px" }} onClick={() => buyCatalogItem(item, "momo")}>📱 Mua qua MoMo</button>
                  </div>
                </div>
              ))}
              {catalog.length === 0 && <p style={{ color: "var(--text-muted)" }}>Chưa có sản phẩm nào trong kho.</p>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Store;
