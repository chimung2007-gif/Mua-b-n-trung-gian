import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/store",        icon: "🎮", label: "Cửa hàng",        roles: ["user"] },
  { to: "/my-orders",    icon: "📦", label: "Đơn của tôi",      roles: ["user"] },
  { to: "/admin/orders", icon: "🛠️", label: "Quản trị",         roles: ["admin"] },
  { to: "/tickets",      icon: "🎫", label: "Hỗ trợ",           roles: ["user", "admin"] },
  { to: "/broadcasts",   icon: "📢", label: "Thông báo",        roles: ["user", "admin"] },
  { to: "/change-password", icon: "🔒", label: "Đổi mật khẩu",  roles: ["user", "admin"] },
  { to: "/admin/dashboard", icon: "📊", label: "Dashboard",   roles: ["admin"] },
  { to: "/faq",             icon: "❓", label: "FAQ",         roles: ["user", "admin"] },
];

const ROLE_BADGE = {
  admin: { label: "Admin", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  user:  { label: "Khách hàng", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
};

function Sidebar({ onLogout }) {
  const { pathname } = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role || "user";
  const badge = ROLE_BADGE[role] || ROLE_BADGE.user;

  const visibleLinks = links.filter((l) => l.roles.includes(role));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo"><span>🎮</span> GameProxy</div>

      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <div style={{
          width: "34px", height: "34px", borderRadius: "50%",
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-bright)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.9rem", fontWeight: 700, color: "var(--text-secondary)",
          flexShrink: 0,
        }}>
          {(user.name || "?")[0].toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.name || "—"}
          </p>
          <span style={{
            fontSize: "0.7rem", fontWeight: 700, padding: "1px 7px",
            borderRadius: "99px", background: badge.bg, color: badge.color,
          }}>
            {badge.label}
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {visibleLinks.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`sidebar-link ${pathname === l.to ? "active" : ""}`}
          >
            {l.icon} {l.label}
          </Link>
        ))}
      </nav>

      {onLogout && (
        <button className="sidebar-logout" onClick={onLogout}>🚪 Đăng xuất</button>
      )}
    </aside>
  );
}

export default Sidebar;
