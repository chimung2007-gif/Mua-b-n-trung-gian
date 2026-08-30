import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

// ─── Loading Screen ───────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "var(--bg-base)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "32px",
      zIndex: 9999,
      animation: "fadeIn 0.2s ease",
    }}>
      {/* Grid pattern */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", zIndex: 1 }}>
        <div style={{
          width: "36px", height: "36px",
          background: "var(--accent)",
          borderRadius: "10px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.2rem",
          boxShadow: "0 0 20px var(--accent-glow)",
        }}>🎮</div>
        <span style={{
          fontSize: "1.3rem", fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
          fontFamily: "'DM Sans', sans-serif",
        }}>GameProxy</span>
      </div>

      {/* Dots */}
      <div style={{ display: "flex", gap: "10px", zIndex: 1 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: "10px", height: "10px",
            borderRadius: "50%",
            background: i === 1 ? "var(--accent)" : "var(--accent-bright)",
            animation: "dotBounce 0.6s ease infinite",
            animationDelay: `${i * 0.15}s`,
            boxShadow: i === 1 ? "0 0 10px var(--accent-glow)" : "none",
          }} />
        ))}
      </div>

      {/* Text */}
      <p style={{
        color: "var(--text-muted)",
        fontSize: "0.82rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        zIndex: 1,
        fontFamily: "'DM Sans', sans-serif",
        animation: "fadeIn 0.3s ease 0.2s both",
      }}>Đang tải hệ thống...</p>

      <style>{`
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0);    opacity: 0.4; }
          50%       { transform: translateY(-12px); opacity: 1;   }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────
function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [loading, setLoading] = useState(false); // màn hình chờ

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResendMessage("");
    setCanResendVerification(false);

    try {
      const res = await api.post("/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onLoginSuccess(res.data.token);

      // Hiện màn hình chờ 0.75s rồi chuyển trang
      setLoading(true);
      const dest = res.data.user.role === "admin" ? "/admin/orders" : "/store";
      setTimeout(() => navigate(dest), 750);

    } catch (err) {
      const message = err.response?.data?.message || "Đăng nhập thất bại";
      setError(message);
      setCanResendVerification(err.response?.status === 403);
    }
  };

  const resendVerificationEmail = async () => {
    setError("");
    setResendMessage("");
    if (!form.email.trim()) { setError("Vui lòng nhập email để gửi xác thực"); return; }
    try {
      const res = await api.post("/resend-verification", { email: form.email });
      setResendMessage(res.data.message || "Đã gửi email xác thực. Vui lòng kiểm tra hộp thư.");
      setCanResendVerification(false);
    } catch (err) {
      setError(err.response?.data?.message || "Không gửi được email xác thực");
    }
  };

  // Hiện màn hình chờ
  if (loading) return <LoadingScreen />;

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Đăng nhập</h2>
        <p className="auth-subtitle">Chào mừng bạn quay trở lại.</p>

        {error && <p className="auth-error">{error}</p>}

        {canResendVerification && (
          <button
            type="button"
            className="auth-button"
            onClick={resendVerificationEmail}
            style={{ marginBottom: "4px" }}
          >
            Gửi lại email xác thực
          </button>
        )}

        {resendMessage && <p className="auth-success">{resendMessage}</p>}

        <div className="form-group">
          <label>Email</label>
          <input
            name="email"
            type="email"
            placeholder="Nhập email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Mật khẩu</label>
          <div className="password-wrapper">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button type="button" className="show-password-btn" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
          </div>
        </div>

        <button className="auth-button" type="submit">Đăng nhập</button>

        <div style={{ textAlign: "right", marginTop: "-8px" }}>
          <Link to="/forgot-password" style={{ color: "var(--accent-bright)", fontSize: "0.88rem" }}>
            Quên mật khẩu?
          </Link>
        </div>

        <p className="auth-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </form>
    </main>
  );
}

export default Login;