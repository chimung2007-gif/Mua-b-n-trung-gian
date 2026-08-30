import { useState } from "react";
import { useLocation } from "react-router-dom";

const GUIDES = {
  "/store": {
    title: "🎮 Hướng dẫn — Cửa hàng",
    sections: [
      {
        heading: "Mua sản phẩm có sẵn",
        content: "Chọn 1 sản phẩm trong kho (Steam Wallet, Netflix, Spotify...), bấm Chuyển khoản hoặc Online để tạo đơn và thanh toán ngay."
      },
      {
        heading: "Gửi yêu cầu tùy chỉnh",
        steps: [
          "Nhấn nút + Yêu cầu tùy chỉnh ở góc trên phải.",
          "Nhập tên game/dịch vụ, link (nếu có) và nền tảng.",
          "Admin sẽ báo giá (giá gốc + phụ phí 5.000-10.000đ) trong thời gian ngắn.",
          "Bạn sẽ nhận thông báo và có thể thanh toán ngay khi có báo giá."
        ]
      }
    ]
  },
  "/my-orders": {
    title: "📦 Hướng dẫn — Đơn hàng của tôi",
    sections: [
      {
        heading: "Theo dõi đơn hàng",
        content: "Danh sách hiển thị toàn bộ đơn đã tạo kèm trạng thái: chờ báo giá, chờ thanh toán, đã thanh toán, đang xử lý, đã giao hoặc đã hủy."
      },
      {
        heading: "Xem chi tiết / thanh toán",
        content: "Bấm vào 1 dòng đơn hàng để xem chi tiết, mã QR chuyển khoản hoặc nút thanh toán online."
      }
    ]
  },
  "/admin/orders": {
    title: "🛠️ Hướng dẫn — Quản trị",
    sections: [
      {
        heading: "Xử lý đơn hàng",
        steps: [
          "Tab Đơn hàng: chọn 1 đơn để xem chi tiết.",
          "Nếu đơn đang 'Chờ báo giá' → nhập giá gốc + phụ phí rồi Gửi báo giá.",
          "Khi khách đã chuyển khoản → bấm Xác nhận đã nhận thanh toán.",
          "Bấm Bắt đầu xử lý khi đang đi mua hộ, sau đó Đánh dấu đã giao kèm ghi chú (tài khoản/key)."
        ]
      },
      {
        heading: "Quản lý kho sản phẩm",
        content: "Tab Kho sản phẩm cho phép thêm/sửa/ẩn/xóa các sản phẩm bán sẵn với giá gốc và phụ phí cố định."
      }
    ]
  },
  "/tickets": {
    title: "🎫 Hướng dẫn — Hỗ trợ",
    sections: [
      {
        heading: "Gửi yêu cầu hỗ trợ",
        content: "Nếu gặp vấn đề với đơn hàng, nhấn + Gửi yêu cầu hỗ trợ, có thể đính kèm mã đơn hàng liên quan để admin xử lý nhanh hơn."
      }
    ]
  },
  "/broadcasts": {
    title: "📢 Hướng dẫn — Thông báo",
    sections: [
      {
        heading: "Xem thông báo hệ thống",
        content: "Trang này hiển thị các thông báo quan trọng từ admin: bảo trì, khuyến mãi, sự cố..."
      }
    ]
  },
  "/change-password": {
    title: "🔒 Hướng dẫn — Đổi mật khẩu",
    sections: [
      {
        heading: "Quên mật khẩu?",
        content: "Nếu quên mật khẩu hiện tại, đăng xuất và dùng tính năng Quên mật khẩu ở trang đăng nhập để nhận link khôi phục qua email."
      }
    ]
  }
};

function GuideButton() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const guide = GUIDES[pathname];
  if (!guide) return null;

  return (
    <>
      {/* Nút hướng dẫn cố định góc dưới phải */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          zIndex: 1000,
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          color: "white",
          border: "none",
          borderRadius: "50px",
          padding: "12px 20px",
          fontSize: "0.9rem",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(59,130,246,0.5)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(59,130,246,0.7)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(59,130,246,0.5)"; }}
      >
        ❓ Hướng dẫn
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1001,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}
        >
          {/* Panel */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "560px",
              maxHeight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #334155",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#0f172a",
            }}>
              <h2 style={{ color: "#f1f5f9", fontSize: "1.1rem", margin: 0 }}>{guide.title}</h2>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.4rem", cursor: "pointer", lineHeight: 1 }}
              >×</button>
            </div>

            {/* Body */}
            <div style={{ overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {guide.sections.map((sec, i) => (
                <div key={i}>
                  <h3 style={{ color: "#3b82f6", fontSize: "0.95rem", marginBottom: "8px", fontWeight: 700 }}>
                    {sec.heading}
                  </h3>

                  {sec.content && (
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                      {sec.content}
                    </p>
                  )}

                  {sec.steps && (
                    <ol style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {sec.steps.map((step, j) => (
                        <li key={j} style={{ color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.6 }}>{step}</li>
                      ))}
                    </ol>
                  )}

                  {sec.example && (
                    <div style={{
                      background: "#0f172a",
                      border: "1px solid #1d4ed8",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      marginTop: "8px",
                    }}>
                      <span style={{ color: "#60a5fa", fontSize: "0.8rem", fontWeight: 700 }}>VÍ DỤ</span>
                      <p style={{ color: "#93c5fd", fontSize: "0.88rem", margin: "4px 0 0", lineHeight: 1.6 }}>{sec.example}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid #334155", textAlign: "right" }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "#334155", border: "none", borderRadius: "8px",
                  color: "#f1f5f9", padding: "8px 20px", cursor: "pointer", fontSize: "0.9rem"
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GuideButton;