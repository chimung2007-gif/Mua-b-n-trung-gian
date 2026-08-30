import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // chặn bấm nhiều lần
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await api.post("/register", form);
      setRegisteredEmail(form.email);
      setMessage(res.data.message);
      setError(""); // đảm bảo error bị xóa khi thành công
      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      setMessage(""); // đảm bảo message bị xóa khi lỗi
      setError(err.response?.data?.message || "Đăng ký thất bại");
    }
    setLoading(false);
  };

  const resendEmail = async () => {
    setError("");
    if (!registeredEmail) {
      setError("Không tìm thấy email vừa đăng ký để gửi xác thực");
      return;
    }
    try {
      const res = await api.post("/resend-verification", { email: registeredEmail });
      setMessage(res.data.message || "Đã gửi email xác thực. Vui lòng kiểm tra hộp thư.");
    } catch (err) {
      setError(err.response?.data?.message || "Không gửi được email xác thực");
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Đăng ký</h2>
        <p className="auth-subtitle">Tạo tài khoản để bắt đầu sử dụng.</p>

        {error && <p className="auth-error">{error}</p>}

        {message && (
          <div className="auth-success" style={{ textAlign: "center" }}>
            <p>{message}</p>
            <button
              type="button"
              className="auth-button"
              onClick={resendEmail}
              style={{ marginTop: "12px" }}
            >
              Nhấn để gửi xác thực
            </button>
          </div>
        )}

        {!message && (
          <>
            <div className="form-group">
              <label htmlFor="name">Họ tên</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Nhập họ tên"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Nhập email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Tạo mật khẩu"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            <button className="auth-button" type="submit" disabled={loading}>
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </>
        )}

        <p className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </main>
  );
}

export default Register;