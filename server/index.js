const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

// ─── CẤU HÌNH CHUYỂN KHOẢN (dùng cho QR VietQR) ────────────────
const BANK_BIN = "MB";
const BANK_ACCOUNT = "0867434863";
const BANK_HOLDER = "PHAM QUANG VINH";
const MOMO_NUMBER = "0867434863"; // Số điện thoại MoMo nhận tiền
const MOMO_NAME = "PHAM QUANG VINH";
const BANK_LABEL = "MB Bank";

// ─── MAILER ───────────────────────────────────────────────────
const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
});

function sendVerificationEmail(toEmail, name, token) {
  const link = `${process.env.BASE_URL}/api/verify-email?token=${token}`;
  return mailer.sendMail({
    from: `"GameProxy" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Xác thực tài khoản GameProxy",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1d4ed8;">🎮 GameProxy</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <p>Tài khoản của bạn đã được tạo. Nhấn nút bên dưới để xác thực:</p>
        <a href="${link}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#3b82f6;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">
          ✅ Xác thực tài khoản
        </a>
        <p style="color:#64748b;font-size:0.85rem;">Link có hiệu lực trong 24 giờ.</p>
      </div>`,
  });
}

function sendResetPasswordEmail(toEmail, name, token) {
  const link = `${process.env.CLIENT_URL}/reset-password/${token}`;
  return mailer.sendMail({
    from: `"GameProxy" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Khôi phục mật khẩu GameProxy",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;">
        <h2>🔐 Khôi phục mật khẩu</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">Đặt lại mật khẩu</a>
        <p style="margin-top:20px;color:#64748b;font-size:0.85rem;">Link có hiệu lực trong 15 phút.</p>
      </div>`,
  });
}

function sendOrderStatusEmail(toEmail, name, order, statusLabel) {
  return mailer.sendMail({
    from: `"GameProxy" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `Đơn hàng #${order.orderId} — ${statusLabel}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;">
        <h2>🎮 GameProxy</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <p>Đơn hàng <strong>${order.itemName}</strong> của bạn vừa được cập nhật trạng thái: <strong>${statusLabel}</strong>.</p>
        ${order.deliveryNote ? `<p style="background:#f1f5f9;padding:12px;border-radius:8px;">${order.deliveryNote}</p>` : ""}
        <p style="margin-top:20px;color:#64748b;font-size:0.85rem;">Đăng nhập GameProxy để xem chi tiết đơn hàng.</p>
      </div>`,
  }).catch(() => {});
}

// ─── JSON FILE HELPERS ────────────────────────────────────────
const USERS_FILE      = path.join(__dirname, "users.json");
const TICKETS_FILE    = path.join(__dirname, "tickets.json");
const BROADCASTS_FILE = path.join(__dirname, "broadcasts.json");
const CATALOG_FILE    = path.join(__dirname, "catalog.json");
const ORDERS_FILE     = path.join(__dirname, "orders.json");

function readJSON(file, fallback = []) {
  if (!fs.existsSync(file)) return fallback;
  try { return JSON.parse(fs.readFileSync(file, "utf-8")); }
  catch { return fallback; }
}
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

function loadUsers()      { return readJSON(USERS_FILE, []); }
function saveUsers(u)     { writeJSON(USERS_FILE, u); }
function loadTickets()    { return readJSON(TICKETS_FILE, []); }
function saveTickets(t)   { writeJSON(TICKETS_FILE, t); }
function loadBroadcasts() { return readJSON(BROADCASTS_FILE, []); }
function saveBroadcasts(b){ writeJSON(BROADCASTS_FILE, b); }
function loadCatalog()    { return readJSON(CATALOG_FILE, []); }
function saveCatalog(c)   { writeJSON(CATALOG_FILE, c); }
function loadOrders()     { return readJSON(ORDERS_FILE, []); }
function saveOrders(o)    { writeJSON(ORDERS_FILE, o); }

function generateTransactionCode() {
  const digits = String(Math.floor(Math.random() * 900000) + 100000); // 6 số
  const letters = Array.from({ length: 2 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join("");
  return `${digits}${letters}`;
}

// Nội dung CK: TênGame_MãNgẫu_NgàyTháng/Năm
function generateTransferContent(itemName) {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const code = Array.from({ length: 6 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join("");
  return `${itemName}_${code}_${day}/${month}/${year}`;
}

// Gợi ý phụ phí 5.000 - 10.000đ tùy giá trị đơn (admin có thể chỉnh tay khi báo giá)
function suggestFee(price) {
  if (price <= 200000) return 5000;
  if (price <= 500000) return 7000;
  return 10000;
}

const ORDER_STATUS_LABEL = {
  requested:         "Chờ báo giá",
  awaiting_payment:  "Chờ thanh toán",
  payment_submitted: "Chờ xác nhận thanh toán",
  confirmed:         "Đã thanh toán — chờ xử lý",
  processing:        "Đang mua hộ",
  delivered:         "Đã giao thành công",
  rejected:          "Đã từ chối / hủy",
};

// ─── MIDDLEWARES ──────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Chưa đăng nhập" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const users = loadUsers();
    const dbUser = users.find(u => u.id === decoded.id);
    if (!dbUser) return res.status(401).json({ message: "Người dùng không tồn tại" });
    if (dbUser.status === "suspended")
      return res.status(403).json({ message: "Tài khoản đã bị đình chỉ." });
    if (dbUser.status === "locked")
      return res.status(403).json({ message: "Tài khoản đã bị khóa vĩnh viễn." });

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Chỉ Admin mới có quyền truy cập" });
  next();
}

function htmlPage(title, body, success) {
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>${title}</title>
<style>
  body{font-family:Arial,sans-serif;background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .card{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:40px;max-width:420px;text-align:center;color:#e2e8f0}
  h1{font-size:1.8rem;margin-bottom:12px;color:${success ? "#22c55e" : "#ef4444"}}
  p{color:#94a3b8;line-height:1.6}
  a{display:inline-block;margin-top:20px;padding:12px 28px;background:#3b82f6;color:white;border-radius:8px;text-decoration:none;font-weight:bold}
</style></head>
<body><div class="card"><h1>${title}</h1><p>${body}</p>
${success ? `<a href="${process.env.CLIENT_URL || "http://localhost:5173"}/login">Đăng nhập ngay →</a>` : ""}
</div></body></html>`;
}

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════
app.post("/api/register", async (req, res) => {
  const name  = (req.body.name  || "").trim();
  const email = (req.body.email || "").trim().toLowerCase();
  const { password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu" });

  const users = loadUsers();
  if (users.find((u) => (u.email || "").toLowerCase() === email))
    return res.status(400).json({ message: "Email đã tồn tại" });

  const hashed = await bcrypt.hash(password, 10);
  const verifyToken = crypto.randomBytes(32).toString("hex");
  users.push({
    id: Date.now(), name, email, password: hashed,
    role: "user", status: "active",
    verified: false, verifyToken,
    verifyExpires: Date.now() + 24 * 60 * 60 * 1000,
    resetToken: null, resetExpires: null,
  });
  saveUsers(users);

  try {
    await sendVerificationEmail(email, name, verifyToken);
    res.json({ message: "Đăng ký thành công! Kiểm tra email để xác thực tài khoản." });
  } catch (e) {
    console.error("Lỗi gửi email xác thực:", e.message);
    res.status(500).json({ message: "Tài khoản đã tạo nhưng không gửi được email xác thực. Liên hệ admin." });
  }
});

app.post("/api/login", async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const { password } = req.body;
  const users = loadUsers();
  const user = users.find((u) => (u.email || "").toLowerCase() === email);
  if (!user) return res.status(400).json({ message: "Email không tồn tại" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Mật khẩu không đúng" });

  if (!user.verified)
    return res.status(403).json({ message: "Tài khoản chưa được xác thực. Kiểm tra email của bạn." });
  if (user.status === "suspended")
    return res.status(403).json({ message: "Tài khoản của bạn đã bị đình chỉ." });
  if (user.status === "locked")
    return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa vĩnh viễn." });

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.json({
    message: "Đăng nhập thành công",
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

app.post("/api/change-password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy người dùng" });
  const isMatch = await bcrypt.compare(currentPassword, users[idx].password);
  if (!isMatch) return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
  users[idx].password = await bcrypt.hash(newPassword, 10);
  saveUsers(users);
  res.json({ message: "Đổi mật khẩu thành công" });
});

app.get("/api/verify-email", (req, res) => {
  const { token } = req.query;
  const users = loadUsers();
  const idx = users.findIndex(u => u.verifyToken === token);
  if (idx === -1) return res.status(400).send(htmlPage("Link không hợp lệ", "Link xác thực không tồn tại hoặc đã được sử dụng.", false));
  if (users[idx].verifyExpires && users[idx].verifyExpires < Date.now())
    return res.status(400).send(htmlPage("Link đã hết hạn", "Vui lòng yêu cầu gửi lại email xác thực.", false));

  users[idx].verified = true;
  users[idx].verifyToken = null;
  users[idx].verifyExpires = null;
  saveUsers(users);
  res.send(htmlPage("Xác thực thành công!", "Tài khoản của bạn đã được kích hoạt.", true));
});

app.post("/api/resend-verification", async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const users = loadUsers();
  const idx = users.findIndex(u => (u.email || "").toLowerCase() === email);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy tài khoản" });
  if (users[idx].verified) return res.status(400).json({ message: "Tài khoản đã được xác thực" });

  const verifyToken = crypto.randomBytes(32).toString("hex");
  users[idx].verifyToken = verifyToken;
  users[idx].verifyExpires = Date.now() + 24 * 60 * 60 * 1000;
  saveUsers(users);

  try {
    await sendVerificationEmail(users[idx].email, users[idx].name, verifyToken);
    res.json({ message: "Đã gửi lại email xác thực" });
  } catch {
    res.status(500).json({ message: "Không gửi được email, thử lại sau" });
  }
});

app.post("/api/forgot-password", async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const users = loadUsers();
  const idx = users.findIndex(u => (u.email || "").toLowerCase() === email);
  if (idx === -1) return res.json({ message: "Nếu email tồn tại, hướng dẫn khôi phục đã được gửi." });

  const resetToken = crypto.randomBytes(32).toString("hex");
  users[idx].resetToken = resetToken;
  users[idx].resetExpires = Date.now() + 15 * 60 * 1000;
  saveUsers(users);

  try { await sendResetPasswordEmail(users[idx].email, users[idx].name, resetToken); } catch {}
  res.json({ message: "Nếu email tồn tại, hướng dẫn khôi phục đã được gửi." });
});

app.post("/api/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  const users = loadUsers();
  const idx = users.findIndex(u => u.resetToken === token);
  if (idx === -1) return res.status(400).json({ message: "Link không hợp lệ" });
  if (users[idx].resetExpires && users[idx].resetExpires < Date.now())
    return res.status(400).json({ message: "Link đã hết hạn, vui lòng yêu cầu lại" });

  users[idx].password = await bcrypt.hash(newPassword, 10);
  users[idx].resetToken = null;
  users[idx].resetExpires = null;
  saveUsers(users);
  res.json({ message: "Đặt lại mật khẩu thành công" });
});

// ════════════════════════════════════════════════════════════
// CATALOG (kho sản phẩm phổ biến — giá đã gồm phụ phí)
// ════════════════════════════════════════════════════════════
app.get("/api/catalog", authMiddleware, (req, res) => {
  const catalog = loadCatalog();
  if (req.user.role === "admin") return res.json(catalog);
  res.json(catalog.filter(c => c.active));
});

app.post("/api/catalog", authMiddleware, adminMiddleware, (req, res) => {
  const { name, platform, image, description, originalPrice } = req.body;
  if (!name || !platform || originalPrice == null)
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ tên, nền tảng và giá gốc" });

  const fee = Number(req.body.fee ?? suggestFee(Number(originalPrice)));
  const catalog = loadCatalog();
  const item = {
    id: Date.now(),
    name: name.trim(),
    platform,
    image: image || "🎮",
    description: (description || "").trim(),
    originalPrice: Number(originalPrice),
    fee,
    totalPrice: Number(originalPrice) + fee,
    active: true,
    createdAt: new Date().toISOString(),
  };
  catalog.unshift(item);
  saveCatalog(catalog);
  res.json({ message: "Đã thêm sản phẩm vào kho", item });
});

app.put("/api/catalog/:id", authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const catalog = loadCatalog();
  const idx = catalog.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

  const { name, platform, image, description, originalPrice, fee, active } = req.body;
  if (name != null) catalog[idx].name = name.trim();
  if (platform != null) catalog[idx].platform = platform;
  if (image != null) catalog[idx].image = image;
  if (description != null) catalog[idx].description = description.trim();
  if (originalPrice != null) catalog[idx].originalPrice = Number(originalPrice);
  if (fee != null) catalog[idx].fee = Number(fee);
  if (active != null) catalog[idx].active = !!active;
  catalog[idx].totalPrice = catalog[idx].originalPrice + catalog[idx].fee;

  saveCatalog(catalog);
  res.json({ message: "Đã cập nhật sản phẩm", item: catalog[idx] });
});

app.delete("/api/catalog/:id", authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const catalog = loadCatalog();
  if (!catalog.find(c => c.id === id)) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
  saveCatalog(catalog.filter(c => c.id !== id));
  res.json({ message: "Đã xóa sản phẩm khỏi kho" });
});

// ════════════════════════════════════════════════════════════
// ORDERS (đơn mua hộ)
// ════════════════════════════════════════════════════════════

// Tạo đơn hàng mới — từ catalog (giá có sẵn) hoặc yêu cầu tùy chỉnh (chờ báo giá)
app.post("/api/orders", authMiddleware, (req, res) => {
  const { mode, catalogId, itemName, platform, link, note, paymentMethod, customerPrice } = req.body;
  const users = loadUsers();
  const me = users.find(u => u.id === req.user.id);
  const orders = loadOrders();

  if (mode === "catalog") {
    const catalog = loadCatalog();
    const product = catalog.find(c => c.id === catalogId && c.active);
    if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại hoặc đã ngừng bán" });
    if (!["vietqr", "momo"].includes(paymentMethod))
    return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ" });

    const order = {
      orderId: Date.now(),
      userId: me.id, userName: me.name, userEmail: me.email,
      mode: "catalog",
      catalogId: product.id,
      itemName: product.name,
      platform: product.platform,
      link: link || null,
      note: note || null,
      originalPrice: product.originalPrice,
      fee: product.fee,
      totalPrice: product.totalPrice,
      paymentMethod,
      transactionCode: generateTransactionCode(),
      transferContent: generateTransferContent(product.name),
      status: "awaiting_payment",
      deliveryNote: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    orders.unshift(order);
    saveOrders(orders);
    return res.json({ message: "Đã tạo đơn hàng, vui lòng hoàn tất thanh toán", order });
  }

    if (mode === "custom") {
    if (!itemName || !platform)
      return res.status(400).json({ message: "Vui lòng nhập tên sản phẩm/dịch vụ và nền tảng" });
    if (!customerPrice || Number(customerPrice) <= 0)
      return res.status(400).json({ message: "Vui lòng nhập giá sản phẩm bạn muốn mua" });

    const order = {
      orderId: Date.now(),
      userId: me.id, userName: me.name, userEmail: me.email,
      mode: "custom",
      catalogId: null,
      itemName: itemName.trim(),
      platform,
      link: (() => {
      const raw = (link || "").trim();
      if (!raw) return null;
        try {
      const parsed = new URL(raw);
        if (!["http:", "https:"].includes(parsed.protocol)) return null;
      return raw;
      } catch { return null; }
      })(),
      
      note: (note || "").trim() || null,
      customerPrice: Number(customerPrice),
      originalPrice: null,
      fee: null,
      totalPrice: null,
      paymentMethod: paymentMethod || "vietqr",
      transactionCode: null,
      status: "requested",
      deliveryNote: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    orders.unshift(order);
    saveOrders(orders);
    return res.json({ message: "Đã gửi yêu cầu, admin sẽ báo giá sớm nhất có thể", order });
  }

  res.status(400).json({ message: "mode không hợp lệ (catalog | custom)" });
});

// Khách hàng tự hủy đơn (chỉ khi chưa thanh toán, giới hạn 3 lần/ngày)
app.put("/api/orders/:id/cancel", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const orders = loadOrders();
  const idx = orders.findIndex(o => o.orderId === id && o.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  if (!["requested", "awaiting_payment"].includes(orders[idx].status))
    return res.status(400).json({ message: "Chỉ được hủy đơn khi chưa thanh toán" });

  // Đếm số lần hủy hôm nay
  const today = new Date().toISOString().slice(0, 10);
  const cancelledToday = orders.filter(
    o => o.userId === req.user.id
      && o.cancelledByUser === true
      && o.cancelledAt && o.cancelledAt.slice(0, 10) === today
  ).length;
  if (cancelledToday >= 3)
    return res.status(429).json({ message: "Bạn đã hủy 3 đơn hôm nay. Vui lòng liên hệ admin nếu cần hỗ trợ.", remaining: 0 });

  orders[idx].status = "rejected";
  orders[idx].cancelledByUser = true;
  orders[idx].cancelledAt = new Date().toISOString();
  orders[idx].deliveryNote = "Khách hàng tự hủy đơn";
  orders[idx].updatedAt = new Date().toISOString();
  saveOrders(orders);

  const remaining = 3 - cancelledToday - 1;
  res.json({ message: "Đã hủy đơn hàng", order: orders[idx], remaining });
});


// Lấy số lần hủy còn lại trong ngày
app.get("/api/orders/cancel-quota", authMiddleware, (req, res) => {
  const orders = loadOrders();
  const today = new Date().toISOString().slice(0, 10);
  const cancelledToday = orders.filter(
    o => o.userId === req.user.id
      && o.cancelledByUser === true
      && o.cancelledAt && o.cancelledAt.slice(0, 10) === today
  ).length;
  res.json({ used: cancelledToday, remaining: Math.max(0, 3 - cancelledToday) });
});

// Đơn hàng của tôi
app.get("/api/orders", authMiddleware, (req, res) => {
  const orders = loadOrders().filter(o => o.userId === req.user.id)
    .sort((a, b) => b.orderId - a.orderId);
  res.json(orders);
});

app.get("/api/orders/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const order = loadOrders().find(o => o.orderId === id);
  if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  if (order.userId !== req.user.id && req.user.role !== "admin")
    return res.status(403).json({ message: "Không có quyền xem đơn hàng này" });
  res.json(order);
});

// Người dùng báo "đã chuyển khoản" — chuyển sang chờ admin xác nhận
app.put("/api/orders/:id/mark-paid", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const orders = loadOrders();
  const idx = orders.findIndex(o => o.orderId === id && o.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  if (orders[idx].status !== "awaiting_payment")
    return res.status(400).json({ message: "Đơn hàng không ở trạng thái chờ thanh toán" });
  if (!["vietqr", "momo"].includes(orders[idx].paymentMethod))
  return res.status(400).json({ message: "Đơn này không dùng chuyển khoản thủ công" });

  orders[idx].status = "payment_submitted";
  orders[idx].updatedAt = new Date().toISOString();
  saveOrders(orders);
  res.json({ message: "Đã ghi nhận, chờ admin xác nhận giao dịch", order: orders[idx] });
});

// ─── ADMIN: quản lý đơn hàng ───────────────────────────────────
app.get("/api/admin/orders", authMiddleware, adminMiddleware, (req, res) => {
  const { status } = req.query;
  let orders = loadOrders().sort((a, b) => b.orderId - a.orderId);
  if (status) orders = orders.filter(o => o.status === status);
  res.json(orders);
});

// Báo giá cho yêu cầu tùy chỉnh
app.put("/api/admin/orders/:id/quote", authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const { originalPrice, fee } = req.body;
  if (originalPrice == null) return res.status(400).json({ message: "Vui lòng nhập giá gốc" });

  const orders = loadOrders();
  const idx = orders.findIndex(o => o.orderId === id);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  if (orders[idx].status !== "requested")
    return res.status(400).json({ message: "Đơn hàng này không ở trạng thái chờ báo giá" });

  const finalFee = Number(fee ?? 10000);
  orders[idx].originalPrice = Number(originalPrice);
  orders[idx].fee = finalFee;
  orders[idx].totalPrice = Number(originalPrice) + finalFee;
  orders[idx].transactionCode = generateTransactionCode();
  orders[idx].transferContent = generateTransferContent(orders[idx].itemName);
  orders[idx].status = "awaiting_payment";
  orders[idx].updatedAt = new Date().toISOString();
  saveOrders(orders);

  const users = loadUsers();
  const buyer = users.find(u => u.id === orders[idx].userId);
  if (buyer) sendOrderStatusEmail(buyer.email, buyer.name, orders[idx], "Đã có báo giá — vui lòng thanh toán");

  res.json({ message: "Đã gửi báo giá cho khách hàng", order: orders[idx] });
});

// Xác nhận đã nhận chuyển khoản
app.put("/api/admin/orders/:id/confirm-payment", authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const orders = loadOrders();
  const idx = orders.findIndex(o => o.orderId === id);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  if (!["awaiting_payment", "payment_submitted"].includes(orders[idx].status))
    return res.status(400).json({ message: "Đơn hàng không ở trạng thái chờ xác nhận thanh toán" });

  orders[idx].status = "confirmed";
  orders[idx].confirmedAt = new Date().toISOString();
  orders[idx].confirmedBy = req.user.name;
  orders[idx].updatedAt = new Date().toISOString();
  saveOrders(orders);

  const users = loadUsers();
  const buyer = users.find(u => u.id === orders[idx].userId);
  if (buyer) sendOrderStatusEmail(buyer.email, buyer.name, orders[idx], "Đã xác nhận thanh toán");

  res.json({ message: "Đã xác nhận thanh toán", order: orders[idx] });
});

// Chuyển sang trạng thái đang xử lý (đang đi mua hộ)
app.put("/api/admin/orders/:id/processing", authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const orders = loadOrders();
  const idx = orders.findIndex(o => o.orderId === id);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  if (orders[idx].status !== "confirmed")
    return res.status(400).json({ message: "Đơn hàng cần được xác nhận thanh toán trước" });

  orders[idx].status = "processing";
  orders[idx].updatedAt = new Date().toISOString();
  saveOrders(orders);
  res.json({ message: "Đã chuyển sang trạng thái đang xử lý", order: orders[idx] });
});

// Đánh dấu đã giao hàng thành công
app.put("/api/admin/orders/:id/deliver", authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const { deliveryNote } = req.body;
  const orders = loadOrders();
  const idx = orders.findIndex(o => o.orderId === id);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  if (!["confirmed", "processing"].includes(orders[idx].status))
    return res.status(400).json({ message: "Đơn hàng cần được xác nhận thanh toán trước khi giao" });

  orders[idx].status = "delivered";
  orders[idx].deliveryNote = (deliveryNote || "").trim() || null;
  orders[idx].deliveredAt = new Date().toISOString();
  orders[idx].updatedAt = new Date().toISOString();
  saveOrders(orders);

  const users = loadUsers();
  const buyer = users.find(u => u.id === orders[idx].userId);
  if (buyer) sendOrderStatusEmail(buyer.email, buyer.name, orders[idx], "Đã giao thành công");

  res.json({ message: "Đã đánh dấu giao hàng thành công", order: orders[idx] });
});

// Từ chối / hủy đơn hàng (sai thông tin, hết hàng, khách yêu cầu hủy...)
app.put("/api/admin/orders/:id/reject", authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const { reason } = req.body;
  const orders = loadOrders();
  const idx = orders.findIndex(o => o.orderId === id);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  if (["delivered", "rejected"].includes(orders[idx].status))
    return res.status(400).json({ message: "Đơn hàng đã kết thúc, không thể hủy" });

  orders[idx].status = "rejected";
  orders[idx].deliveryNote = (reason || "").trim() || null;
  orders[idx].updatedAt = new Date().toISOString();
  saveOrders(orders);

  const users = loadUsers();
  const buyer = users.find(u => u.id === orders[idx].userId);
  if (buyer) sendOrderStatusEmail(buyer.email, buyer.name, orders[idx], "Đã hủy/từ chối");

  res.json({ message: "Đã từ chối/hủy đơn hàng", order: orders[idx] });
});

// Thông tin ngân hàng + nhãn trạng thái dùng chung cho client
app.get("/api/payment-info", authMiddleware, (req, res) => {
  res.json({ bankLabel: BANK_LABEL, bankBin: BANK_BIN, bankAccount: BANK_ACCOUNT, bankHolder: BANK_HOLDER, momoNumber: MOMO_NUMBER, momoName: MOMO_NAME, statusLabels: ORDER_STATUS_LABEL });
});

// ════════════════════════════════════════════════════════════
// TICKETS (hỗ trợ khách hàng)
// ════════════════════════════════════════════════════════════
app.post("/api/tickets", authMiddleware, (req, res) => {
  const { title, description, priority } = req.body;
  if (!title || !description || !priority)
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
  if (!["LOW", "MEDIUM", "HIGH"].includes(priority))
    return res.status(400).json({ message: "Mức độ ưu tiên không hợp lệ" });

  const tickets = loadTickets();
  const newTicket = {
    ticketId: Date.now(),
    creatorId: req.user.id,
    creatorName: req.user.name,
    title: title.trim(),
    description: description.trim(),
    priority,
    orderId: req.body.orderId || null,
    status: "OPEN",
    adminId: null,
    adminName: null,
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tickets.unshift(newTicket);
  saveTickets(tickets);
  res.json({ message: "Đã gửi yêu cầu hỗ trợ", ticket: newTicket });
});

app.get("/api/tickets", authMiddleware, (req, res) => {
  const tickets = loadTickets();
  if (req.user.role === "admin") return res.json(tickets);
  res.json(tickets.filter(t => t.creatorId === req.user.id));
});

app.get("/api/tickets/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const ticket = loadTickets().find(t => t.ticketId === id);
  if (!ticket) return res.status(404).json({ message: "Không tìm thấy" });
  if (req.user.role !== "admin" && ticket.creatorId !== req.user.id)
    return res.status(403).json({ message: "Không có quyền xem" });
  res.json(ticket);
});

app.put("/api/tickets/:id/claim", authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const tickets = loadTickets();
  const idx = tickets.findIndex(t => t.ticketId === id);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy" });
  if (tickets[idx].status !== "OPEN") return res.status(400).json({ message: "Đã được nhận xử lý hoặc đã đóng" });

  tickets[idx].status = "IN_PROGRESS";
  tickets[idx].adminId = req.user.id;
  tickets[idx].adminName = req.user.name;
  tickets[idx].updatedAt = new Date().toISOString();
  saveTickets(tickets);
  res.json({ message: "Bạn đã nhận xử lý", ticket: tickets[idx] });
});

app.put("/api/tickets/:id/resolve", authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const tickets = loadTickets();
  const idx = tickets.findIndex(t => t.ticketId === id);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy" });

  tickets[idx].status = "RESOLVED";
  tickets[idx].updatedAt = new Date().toISOString();
  saveTickets(tickets);
  res.json({ message: "Đã đánh dấu hoàn thành", ticket: tickets[idx] });
});

app.put("/api/tickets/:id/reopen", authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const tickets = loadTickets();
  const idx = tickets.findIndex(t => t.ticketId === id);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy" });

  tickets[idx].status = "OPEN";
  tickets[idx].adminId = null;
  tickets[idx].adminName = null;
  tickets[idx].updatedAt = new Date().toISOString();
  saveTickets(tickets);
  res.json({ message: "Đã mở lại", ticket: tickets[idx] });
});

app.post("/api/tickets/:id/comments", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ message: "Nội dung trống" });

  const tickets = loadTickets();
  const idx = tickets.findIndex(t => t.ticketId === id);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy" });
  if (req.user.role !== "admin" && tickets[idx].creatorId !== req.user.id)
    return res.status(403).json({ message: "Không có quyền bình luận" });

  tickets[idx].comments.push({
    commentId: Date.now(), userId: req.user.id, userName: req.user.name,
    userRole: req.user.role, text: text.trim(), createdAt: new Date().toISOString(),
  });
  tickets[idx].updatedAt = new Date().toISOString();
  saveTickets(tickets);
  res.json({ message: "Đã thêm bình luận", ticket: tickets[idx] });
});

// ════════════════════════════════════════════════════════════
// BROADCASTS (thông báo hệ thống)
// ════════════════════════════════════════════════════════════
app.post("/api/broadcasts", authMiddleware, adminMiddleware, (req, res) => {
  const { title, message, type } = req.body;
  if (!title || !message) return res.status(400).json({ message: "Vui lòng nhập đầy đủ tiêu đề và nội dung" });

  const broadcasts = loadBroadcasts();
  const newBroadcast = {
    broadcastId: Date.now(), authorId: req.user.id, authorName: req.user.name, authorRole: req.user.role,
    title: title.trim(), message: message.trim(),
    type: ["info", "maintenance", "incident"].includes(type) ? type : "info",
    createdAt: new Date().toISOString(),
  };
  broadcasts.unshift(newBroadcast);
  saveBroadcasts(broadcasts);
  res.json({ message: "Đã gửi thông báo", broadcast: newBroadcast });
});

app.get("/api/broadcasts", authMiddleware, (req, res) => {
  res.json(loadBroadcasts().sort((a, b) => b.broadcastId - a.broadcastId));
});

app.get("/api/broadcasts/since/:timestamp", authMiddleware, (req, res) => {
  const since = parseInt(req.params.timestamp) || 0;
  res.json(loadBroadcasts().filter(b => b.broadcastId > since).sort((a, b) => b.broadcastId - a.broadcastId));
});

app.delete("/api/broadcasts/:id", authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const broadcasts = loadBroadcasts();
  if (!broadcasts.find(b => b.broadcastId === id)) return res.status(404).json({ message: "Không tìm thấy" });
  saveBroadcasts(broadcasts.filter(b => b.broadcastId !== id));
  res.json({ message: "Đã xóa thông báo" });
});

// ════════════════════════════════════════════════════════════
// DASHBOARD THỐNG KÊ
// ════════════════════════════════════════════════════════════
app.get("/api/admin/dashboard", authMiddleware, adminMiddleware, (req, res) => {
  const orders = loadOrders();
  const users = loadUsers();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.fee || 0), 0);
  const todayOrders = orders.filter(o => new Date(o.createdAt).getTime() >= todayStart);
  const weekOrders = orders.filter(o => new Date(o.createdAt).getTime() >= weekStart);
  const todayRevenue = todayOrders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.fee || 0), 0);
  const weekRevenue = weekOrders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.fee || 0), 0);
  const cancelRate = orders.length ? ((orders.filter(o => o.status === "rejected").length / orders.length) * 100).toFixed(1) : 0;

  const byStatus = {};
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] || 0) + 1;
  const byPlatform = {};
  for (const o of orders) byPlatform[o.platform] = (byPlatform[o.platform] || 0) + 1;

  res.json({
    totalOrders: orders.length,
    totalUsers: users.filter(u => u.role !== "admin").length,
    totalRevenue, todayOrders: todayOrders.length, weekOrders: weekOrders.length,
    todayRevenue, weekRevenue, cancelRate,
    byStatus, byPlatform,
  });
});

// Admin cleanup — theo trạng thái hoặc theo ngày
app.delete("/api/admin/cleanup", authMiddleware, adminMiddleware, (req, res) => {
  const { type = "orders" } = req.query;

  try {
    if (type === "orders") {
      const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
      const all = JSON.parse(raw);
      const kept = all.filter(o => !["delivered", "rejected"].includes(o.status));
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(kept, null, 2));
      console.log("[CLEANUP ORDERS]", all.length, "→", kept.length);
      return res.json({ message: `Xóa ${all.length - kept.length} đơn đã kết thúc`, deleted: all.length - kept.length });
    }
    if (type === "broadcasts") {
      const raw = fs.readFileSync(BROADCASTS_FILE, "utf-8");
      const all = JSON.parse(raw);
      fs.writeFileSync(BROADCASTS_FILE, JSON.stringify([], null, 2));
      console.log("[CLEANUP BROADCASTS]", all.length, "→ 0");
      return res.json({ message: `Xóa ${all.length} thông báo`, deleted: all.length });
    }
    if (type === "tickets") {
      const raw = fs.readFileSync(TICKETS_FILE, "utf-8");
      const all = JSON.parse(raw);
      const kept = all.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS");
      fs.writeFileSync(TICKETS_FILE, JSON.stringify(kept, null, 2));
      console.log("[CLEANUP TICKETS]", all.length, "→", kept.length);
      return res.json({ message: `Xóa ${all.length - kept.length} ticket đã xong`, deleted: all.length - kept.length });
    }
  } catch (err) {
    console.error("[CLEANUP ERROR]", err);
    return res.status(500).json({ message: "Lỗi: " + err.message });
  }
  res.status(400).json({ message: "type không hợp lệ" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🎮 GameProxy server chạy tại http://localhost:${PORT}`));
