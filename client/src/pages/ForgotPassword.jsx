import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await api.post("/forgot-password", { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra");
    }
    setLoading(false);
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>🔐 Quên mật khẩu</h2>
        <p className="auth-subtitle">Nhập email để nhận link khôi phục mật khẩu.</p>

        {error   && <p className="auth-error">{error}</p>}
        {message && <p className="auth-success">{message}</p>}

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Nhập email đã đăng ký"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? "Đang gửi..." : "Gửi link khôi phục"}
        </button>

        <p className="auth-footer">
          <Link to="/login">← Quay lại đăng nhập</Link>
        </p>
      </form>
    </main>
  );
}

export default ForgotPassword;