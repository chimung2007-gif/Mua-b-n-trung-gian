import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 402 && err.response?.data?.requiresPayment) {
      // Có thể tùy biến thành modal đẹp hơn sau, tạm dùng alert + redirect gợi ý
      alert(err.response.data.message + "\n\nVui lòng gia hạn để tiếp tục.");
    }
    return Promise.reject(err);
  }
);

export default api;