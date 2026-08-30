import { useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api";

function ChangePassword({ token }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("Mật khẩu mới không khớp");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    try {
      const res = await api.post(
        "/change-password",
        { currentPassword: form.currentPassword, newPassword: form.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Đổi mật khẩu thất bại");
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <header className="dashboard-navbar">
          <h1 className="navbar-title">🔒 Đổi mật khẩu</h1>
        </header>

        <main className="dashboard-content">
          <form className="auth-card" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
            <h2>🔒 Đổi mật khẩu</h2>

            {message && <p className="auth-success">{message}</p>}
            {error && <p className="auth-error">{error}</p>}

            <div className="form-group">
              <label>Mật khẩu hiện tại</label>
              <div className="password-wrapper">
                <input
                  name="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  placeholder="Nhập mật khẩu hiện tại"
                  value={form.currentPassword}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="show-password-btn" onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Mật khẩu mới</label>
              <div className="password-wrapper">
                <input
                  name="newPassword"
                  type={showNew ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  value={form.newPassword}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="show-password-btn" onClick={() => setShowNew(!showNew)}>
                  {showNew ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Xác nhận mật khẩu mới</label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button className="auth-button" type="submit">Xác nhận đổi mật khẩu</button>
          </form>
        </main>
      </div>
    </div>
  );
}

export default ChangePassword;