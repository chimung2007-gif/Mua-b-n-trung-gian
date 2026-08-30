import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Store from "./pages/Store";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import AdminOrders from "./pages/AdminOrders";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import GuideButton from "./components/GuideButton";
import Tickets from "./pages/Tickets";
import Broadcasts from "./pages/Broadcasts";
import BroadcastBanner from "./components/BroadcastBanner";
import Dashboard from "./pages/DashBoard";
import FAQ from "./pages/FAQ";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

  const Private = ({ children }) => (!token ? <Navigate to="/login" /> : children);
  const AdminOnly = ({ children }) => (token && isAdmin ? children : <Navigate to="/store" />);

  return (
    <>
      <Routes>
        <Route path="/" element={token ? <Navigate to={isAdmin ? "/admin/dashboard" : "/store"} /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login onLoginSuccess={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route path="/store"          element={<Private><Store onLogout={logout} /></Private>} />
        <Route path="/checkout/:orderId" element={<Private><Checkout onLogout={logout} /></Private>} />
        <Route path="/my-orders"      element={<Private><MyOrders onLogout={logout} /></Private>} />
        <Route path="/tickets"        element={<Private><Tickets onLogout={logout} /></Private>} />
        <Route path="/broadcasts"     element={<Private><Broadcasts onLogout={logout} /></Private>} />
        <Route path="/change-password" element={<Private><ChangePassword token={token} /></Private>} />
        <Route path="/admin/dashboard" element={<AdminOnly><Dashboard onLogout={logout} /></AdminOnly>} />
        <Route path="/faq"             element={<Private><FAQ onLogout={logout} /></Private>} />
        <Route path="/admin/orders" element={<AdminOnly><AdminOrders onLogout={logout} /></AdminOnly>} />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      {token && <BroadcastBanner />}
      <GuideButton />
    </>
  );
}

export default App;
