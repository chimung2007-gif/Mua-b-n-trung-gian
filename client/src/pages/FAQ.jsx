import { useState } from "react";
import Sidebar from "../components/Sidebar";

const FAQS = [
  { q: "GameProxy là gì?", a: "GameProxy là dịch vụ mua hộ game, dịch vụ số với phụ phí chỉ từ 5.000đ - 10.000đ mỗi đơn. Bạn gửi yêu cầu, admin mua hộ và giao tài khoản/key cho bạn." },
  { q: "Thanh toán bằng cách nào?", a: "Hiện tại hỗ trợ chuyển khoản ngân hàng hoặc ví MoMo. Sau khi quét mã QR, bấm 'Đã thanh toán' để admin xác nhận." },
  { q: "Tôi gửi yêu cầu tùy chỉnh thì bao lâu có báo giá?", a: "Admin sẽ xem xét và báo giá trong thời gian ngắn nhất (thường dưới 30 phút trong giờ làm việc). Trang đơn hàng sẽ tự cập nhật khi có báo giá." },
  { q: "Phụ phí là gì?", a: "Phụ phí là chi phí dịch vụ mua hộ, từ 5.000đ - 10.000đ tùy giá trị đơn hàng. Phí này được cộng thêm vào giá gốc sản phẩm." },
  { q: "Tôi có thể hủy đơn hàng không?", a: "Liên hệ admin qua ticket hỗ trợ để yêu cầu hủy đơn. Đơn đã thanh toán không thể hủy." },
  { q: "Nếu admin không giao hàng thì sao?", a: "Bạn có thể gửi ticket hỗ trợ. Admin sẽ phản hồi và giải quyết trong thời gian sớm nhất." },
  { q: "Làm sao để liên hệ admin?", a: "Vào mục Hỗ trợ (🎫) ở sidebar để gửi ticket. Admin sẽ nhận và phản hồi trong thời gian sớm nhất." },
];

function FAQ({ onLogout }) {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div className="dashboard-layout">
      <Sidebar onLogout={onLogout} />
      <div className="dashboard-main">
        <header className="dashboard-navbar">
          <h1 className="navbar-title">❓ Câu hỏi thường gặp</h1>
        </header>
        <main className="dashboard-content">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 700 }}>
            {FAQS.map((f, i) => (
              <div key={i} className="auth-card" style={{ maxWidth: "100%", cursor: "pointer", gap: 0 }} onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "0.95rem", margin: 0 }}>{f.q}</h3>
                  <span style={{ color: "var(--text-muted)", fontSize: "1.2rem" }}>{openIdx === i ? "−" : "+"}</span>
                </div>
                {openIdx === i && (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.7, marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                    {f.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default FAQ;