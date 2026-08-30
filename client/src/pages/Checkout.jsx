import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../api";

const STATUS_FLOW = ["requested", "awaiting_payment", "payment_submitted", "confirmed", "processing", "delivered"];
const STATUS_LABEL = {
  requested: "Chờ duyệt",
  awaiting_payment: "Chờ thanh toán",
  payment_submitted: "Chờ xác nhận tiền",
  confirmed: "Đã thanh toán",
  processing: "Đang mua hộ",
  delivered: "Đã giao thành công",
  rejected: "Đã hủy/từ chối",
};
const STATUS_ICON = {
  requested: "📋", awaiting_payment: "💰", payment_submitted: "⏳",
  confirmed: "✅", processing: "⚙️", delivered: "🎉", rejected: "❌",
};

function Checkout({ onLogout }) {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [bank, setBank] = useState(null);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [statusChanged, setStatusChanged] = useState(false);
  const [cancelQuota, setCancelQuota] = useState({ remaining: 3 });
  const [copied, setCopied] = useState(false);
  const prevStatusRef = useRef(undefined);

  const BANK = bank?.bankAccount || "0867434863";
  const BIN = bank?.bankBin || "MB";
  const HOLDER = bank?.bankHolder || "PHAM QUANG VINH";
  const LABEL = bank?.bankLabel || "MB Bank";
  const MOMO_NUM = bank?.momoNumber || "0867434863";
  const MOMO_NAME = bank?.momoName || "PHAM QUANG VINH";

  const fetchOrder = useCallback(async (isInit = false) => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      const newOrder = res.data;
      if (!isInit && prevStatusRef.current && prevStatusRef.current !== newOrder.status) {
        setStatusChanged(true);
        setTimeout(() => setStatusChanged(false), 4000);
      }
      prevStatusRef.current = newOrder.status;
      setOrder(newOrder);
      setLastUpdate(new Date());
    } catch (err) {
      if (isInit) setError(err.response?.data?.message || "Không tìm thấy đơn hàng");
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder(true);
    api.get("/payment-info").then(res => setBank(res.data)).catch(() => {});
    api.get("/orders/cancel-quota").then(res => setCancelQuota(res.data)).catch(() => {});
    const interval = setInterval(() => fetchOrder(), 1000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  const markPaid = async () => {
    setError("");
    try {
      const res = await api.put(`/orders/${orderId}/mark-paid`);
      setOrder(res.data.order);
      setLastUpdate(new Date());
    } catch (err) { setError(err.response?.data?.message || "Lỗi cập nhật"); }
  };

  const cancelOrder = async () => {
    if (!confirm("Bạn chắc chắn muốn hủy đơn hàng này?")) return;
    setError("");
    try {
      const res = await api.put(`/orders/${orderId}/cancel`);
      setOrder(res.data.order);
      setCancelQuota(prev => ({ ...prev, remaining: res.data.remaining }));
      setLastUpdate(new Date());
    } catch (err) { setError(err.response?.data?.message || "Lỗi hủy đơn hàng"); }
  };

  const handleCopy = async () => {
    const text = order?.transferContent || order?.transactionCode || "";
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement("textarea"); ta.value = text;
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error && !order) {
    return (
      <div className="dashboard-layout">
        <Sidebar onLogout={onLogout} />
        <div className="dashboard-main"><main className="dashboard-content"><p className="auth-error">{error}</p></main></div>
      </div>
    );
  }
  if (!order) return null;

  const addInfo = order.transferContent || order.transactionCode || "";
  const qrUrl = `https://img.vietqr.io/image/${BIN}-${BANK}-compact2.png?amount=${order.totalPrice || ""}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(HOLDER)}`;
  const momoQrUrl = `https://img.vietqr.io/image/970436-${MOMO_NUM}-compact2.png?amount=${order.totalPrice || ""}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(MOMO_NAME)}`;

  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const isRejected = order.status === "rejected";

  return (
    <div className="dashboard-layout">
      <Sidebar onLogout={onLogout} />
      <div className="dashboard-main">
        <header className="dashboard-navbar">
          <h1 className="navbar-title">💳 Thanh toán đơn #{order.orderId}</h1>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <span className="live-dot" /> Live · {lastUpdate ? `cập nhật ${Math.round((Date.now() - lastUpdate.getTime()) / 1000)}s trước` : "..."}</span>
          </header>

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
          @keyframes slideIn { from{transform:translateY(-12px);opacity:0} to{transform:translateY(0);opacity:1} }
          @keyframes glow { 0%,100%{opacity:0.3} 50%{opacity:0.6} }
          .status-toast { animation: slideIn 0.3s ease-out; }
          .step-line { transition: background 0.4s; }
          .step-dot { transition: all 0.4s; }
          .live-dot { width:6px; height:6px; border-radius:50%; background:#22c55e; display:inline-block; animation:pulse 2s infinite; }
          .qr-glow { position:relative; display:inline-block; }
          .qr-glow::before { content:''; position:absolute; inset:-12px; border-radius:22px; background:linear-gradient(135deg,rgba(59,130,246,0.25),rgba(139,92,246,0.25)); filter:blur(20px); animation:glow 3s ease-in-out infinite; z-index:0; }
        `}</style>

        <main className="dashboard-content">
          {statusChanged && (
            <div className="status-toast" style={{ background: "var(--green)", color: "#fff", padding: "12px 20px", borderRadius: "var(--radius-md)", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 8 }}>
              {STATUS_ICON[order.status]} Trạng thái cập nhật: {STATUS_LABEL[order.status]}
            </div>
          )}

          <div className="auth-card" style={{ maxWidth: 520 }}>
            <h2>{order.itemName}</h2>
            <p className="auth-subtitle">{order.platform} · #{order.orderId}</p>
            {error && <p className="auth-error">{error}</p>}

            {/* ===== STEPPER ===== */}
            <div style={{ margin: "20px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                {STATUS_FLOW.map((s, i) => (
                  <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative" }}>
                    {i < STATUS_FLOW.length - 1 && (
                      <div className="step-line" style={{ position: "absolute", top: 10, left: "50%", width: "100%", height: 3, background: !isRejected && i < currentIdx ? "var(--accent-bright)" : "var(--border)", zIndex: 0 }} />
                    )}
                    <div className="step-dot" style={{ width: 20, height: 20, borderRadius: "50%", zIndex: 1, background: isRejected ? "#ef4444" : i <= currentIdx ? "var(--accent-bright)" : "var(--border)", border: "2px solid var(--bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", color: "#fff" }}>
                      {i <= currentIdx && !isRejected ? "✓" : ""}
                    </div>
                    <span style={{ fontSize: "0.6rem", color: i <= currentIdx && !isRejected ? "var(--accent-bright)" : "var(--text-muted)", marginTop: 4, textAlign: "center", lineHeight: 1.2, fontWeight: i === currentIdx ? 700 : 400 }}>
                      {STATUS_LABEL[s]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ===== REQUESTED ===== */}
            {order.status === "requested" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>📋</div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Đơn hàng đang chờ <strong>admin duyệt và báo giá</strong>.</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 4 }}>Trang tự cập nhật mỗi giây.</p>
                {order.link && <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", wordBreak: "break-all", marginTop: 12 }}>Link: {order.link}</p>}
                {order.customerPrice != null && (
                  <p style={{ marginTop: 12, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Giá bạn đề xuất: <strong style={{ color: "var(--accent-bright)" }}>{order.customerPrice.toLocaleString("vi-VN")}đ</strong>
                  </p>
                )}
                <button className="btn-secondary" style={{ marginTop: 16, color: "#ef4444", borderColor: "#ef4444" }} onClick={cancelOrder} disabled={cancelQuota.remaining <= 0}>
                  🚫 Hủy yêu cầu{cancelQuota.remaining < 3 ? ` (còn ${cancelQuota.remaining} lần hôm nay)` : ""}
                </button>
              </div>
            )}

            {/* ===== AWAITING PAYMENT — UPGRADED ===== */}
            {order.status === "awaiting_payment" && (
              <>
                {/* Price Breakdown */}
                <div className="price-breakdown">
                  <div className="price-row"><span>Giá gốc</span><span>{order.originalPrice?.toLocaleString("vi-VN")}đ</span></div>
                  <div className="price-row"><span>Phí dịch vụ</span><span>{order.fee?.toLocaleString("vi-VN")}đ</span></div>
                  <div className="price-row total"><span>Tổng thanh toán</span><span>{order.totalPrice?.toLocaleString("vi-VN")}đ</span></div>
                </div>

                {/* QR Code */}
                <div style={{ textAlign: "center", margin: "24px 0" }}>
                  <p className="section-label" style={{ textAlign: "center", marginBottom: 14 }}>Quét mã QR để thanh toán</p>
                  <div className="qr-glow">
                    <img
                      src={order.paymentMethod === "momo" ? momoQrUrl : qrUrl}
                      alt="QR"
                      style={{ width: 240, height: 240, borderRadius: 14, background: "white", padding: 12, position: "relative", zIndex: 1, display: "block", margin: "0 auto" }}
                    />
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 10 }}>
                    {order.paymentMethod === "momo" ? "MoMo" : LABEL} · Số tiền đã được gắn sẵn trong mã QR
                  </p>
                </div>

                {/* Transfer Content —核心 */}
                <div style={{ margin: "0 0 20px" }}>
                  <p className="section-label">Nội dung chuyển khoản <span style={{ color: "#ef4444" }}>(Bắt buộc)</span></p>
                  <div className="transfer-box">
                    <code>{addInfo}</code>
                    <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
                      {copied ? "✓ Đã copy" : "Copy"}
                    </button>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 6 }}>
                    Mã QR đã kèm sẵn nội dung này. Nếu chuyển thủ công, hãy dán chính xác nội dung trên vào phần ghi chú.
                  </p>
                </div>

                {/* Bank Info */}
                {order.paymentMethod === "vietqr" && (
                  <div className="bank-info-card">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>🏦</div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>{LABEL}</p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "2px 0 0", fontFamily: "'JetBrains Mono', monospace" }}>{BANK} · {HOLDER}</p>
                      </div>
                    </div>
                  </div>
                )}
                {order.paymentMethod === "momo" && (
                  <div className="bank-info-card" style={{ borderColor: "rgba(165,0,100,0.3)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(165,0,100,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>📱</div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0, color: "#A50064" }}>MoMo</p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "2px 0 0", fontFamily: "'JetBrains Mono', monospace" }}>{MOMO_NUM} · {MOMO_NAME}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Steps */}
                <div style={{ margin: "20px 0" }}>
                  <p className="section-label">Hướng dẫn</p>
                  <div className="step-guide">
                    <div className="step-item"><span className="step-number">1</span><span>Mở app ngân hàng / MoMo</span></div>
                    <div className="step-item"><span className="step-number">2</span><span>Quét mã QR ở trên (số tiền & nội dung đã gắn sẵn)</span></div>
                    <div className="step-item"><span className="step-number">3</span><span>Xác nhận chuyển khoản</span></div>
                    <div className="step-item"><span className="step-number">4</span><span>Bấm nút bên dưới để ghi nhận</span></div>
                  </div>
                </div>

                {/* Actions */}
                <button className="auth-button" style={{ width: "100%", padding: "14px 18px", fontSize: "0.95rem" }} onClick={markPaid}>
                  ✅ Đã chuyển khoản — Ghi nhận
                </button>
                <div style={{ textAlign: "center", marginTop: 10 }}>
                  <button className="btn-secondary" style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)", fontSize: "0.8rem", padding: "6px 16px" }} onClick={cancelOrder} disabled={cancelQuota.remaining <= 0}>
                    Hủy đơn{cancelQuota.remaining < 3 ? ` (còn ${cancelQuota.remaining} lần)` : ""}
                  </button>
                </div>
              </>
            )}

            {/* ===== PAYMENT SUBMITTED ===== */}
            {order.status === "payment_submitted" && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>⏳</div>
                <p style={{ color: "#f59e0b", fontWeight: 600 }}>Đã ghi nhận — chờ admin xác nhận chuyển khoản.</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 4 }}>Thường mất 1-5 phút. Trang tự cập nhật.</p>
                <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0 0 4px" }}>Nội dung bạn đã chuyển:</p>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.88rem", color: "var(--accent-bright)", margin: 0, wordBreak: "break-all" }}>{addInfo}</p>
                </div>
              </div>
            )}

            {/* ===== CONFIRMED ===== */}
            {order.status === "confirmed" && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>✅</div>
                <p style={{ color: "var(--green)", fontWeight: 600, fontSize: "1.05rem" }}>Đã xác nhận thanh toán!</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>Admin sẽ bắt đầu mua hộ ngay.</p>
              </div>
            )}

            {/* ===== PROCESSING ===== */}
            {order.status === "processing" && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>⚙️</div>
                <p style={{ color: "var(--green)", fontWeight: 600 }}>Admin đang mua hộ đơn hàng của bạn...</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>Vui lòng chờ, trang tự cập nhật.</p>
              </div>
            )}

            {/* ===== DELIVERED ===== */}
            {order.status === "delivered" && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>🎉</div>
                <p style={{ color: "var(--green)", fontWeight: 600, fontSize: "1.05rem" }}>Đơn hàng đã giao thành công!</p>
                {order.deliveryNote && (
                  <div style={{ background: "var(--bg-surface)", padding: 14, borderRadius: "var(--radius-sm)", marginTop: 12, textAlign: "left", fontSize: "0.9rem", border: "1px solid var(--border)" }}>{order.deliveryNote}</div>
                )}
              </div>
            )}

            {/* ===== REJECTED ===== */}
            {order.status === "rejected" && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>❌</div>
                <p className="auth-error">Đơn hàng đã bị hủy/từ chối.</p>
                {order.deliveryNote && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 8 }}>{order.deliveryNote}</p>}
              </div>
            )}

            <button type="button" className="btn-secondary" onClick={() => navigate("/my-orders")} style={{ marginTop: 16 }}>← Xem tất cả đơn hàng</button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Checkout;