import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/reset-password", { token, password });
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Link không hợp lệ hoặc đã hết hạn");
    }
    setLoading(false);
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>🔑 Đặt lại mật khẩu</h2>
        <p className="auth-subtitle">Nhập mật khẩu mới cho tài khoản của bạn.</p>

        {error   && <p className="auth-error">{error}</p>}
        {message && <p className="auth-success">{message}</p>}

        <div className="form-group">
          <label>Mật khẩu mới</label>
          <div className="password-wrapper">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Ít nhất 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className="show-password-btn" onClick={() => setShowPw(!showPw)}>
              {showPw ? "Ẩn" : "Hiện"}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Xác nhận mật khẩu</label>
          <input
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? "Đang xử lý..." : "Xác nhận đặt lại mật khẩu"}
        </button>
      </form>
    </main>
  );
}

export default ResetPassword;