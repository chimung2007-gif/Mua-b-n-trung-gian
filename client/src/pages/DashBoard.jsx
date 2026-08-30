import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api";

function Dashboard({ onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/admin/dashboard");
      setData(res.data);
    } catch {}
    setLoading(false);
  };

  const STAT_CARDS = [
    { label: "Tổng đơn hàng", value: data?.totalOrders || 0, color: "#3b82f6", icon: "📦" },
    { label: "Tổng người dùng", value: data?.totalUsers || 0, color: "#10b981", icon: "👥" },
    { label: "Tổng doanh thu", value: (data?.totalRevenue || 0).toLocaleString("vi-VN") + "đ", color: "#f59e0b", icon: "💰" },
    { label: "Tỷ lệ hủy", value: (data?.cancelRate || 0) + "%", color: "#ef4444", icon: "🚫" },
    { label: "Đơn hôm nay", value: data?.todayOrders || 0, color: "#8b5cf6", icon: "📅" },
    { label: "Doanh thu hôm nay", value: (data?.todayRevenue || 0).toLocaleString("vi-VN") + "đ", color: "#06b6d4", icon: "📈" },
    { label: "Đơn trong tuần", value: data?.weekOrders || 0, color: "#ec4899", icon: "📊" },
    { label: "Doanh thu tuần", value: (data?.weekRevenue || 0).toLocaleString("vi-VN") + "đ", color: "#14b8a6", icon: "💎" },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar onLogout={onLogout} />
      <div className="dashboard-main">
        <header className="dashboard-navbar">
          <h1 className="navbar-title">📊 Dashboard</h1>
        </header>
        <main className="dashboard-content">
          {loading ? (
            <p style={{ color: "var(--text-muted)" }}>Đang tải...</p>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
                {STAT_CARDS.map((s, i) => (
                  <div key={i} className="auth-card" style={{ gap: 6, borderLeft: `4px solid ${s.color}` }}>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>{s.icon} {s.label}</p>
                    <p style={{ fontSize: "1.6rem", fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div className="auth-card">
                  <h3>Đơn theo trạng thái</h3>
                  {data?.byStatus && Object.entries(data.byStatus).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>{k}</span>
                      <span style={{ fontWeight: 700 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="auth-card">
                  <h3>Đơn theo nền tảng</h3>
                  {data?.byPlatform && Object.entries(data.byPlatform).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>{k}</span>
                      <span style={{ fontWeight: 700 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;