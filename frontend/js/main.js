function qs(s, c = document) {
  return c.querySelector(s);
}
function qsa(s, c = document) {
  return [...c.querySelectorAll(s)];
}
function fmtVND(n) {
  return (n || 0).toLocaleString("vi-VN") + "₫";
}
function renderNavbar() {
  const nav = qs("#navbar");
  if (!nav) return;
  const u = currentUser();
  nav.innerHTML = `
  <div class="container nav">
    <div class="brand"><img src="assets/placeholder.svg"/><h1>3H Rental</h1></div>
    <div class="links">
      <a href="index.html">Trang chủ</a>
      ${
        u
          ? `<a href="${
              u.role === "admin" ? "admin.html" : "dashboard.html"
            }">Dashboard</a>`
          : ""
      }
      ${
        u
          ? `
            <div class="user-menu">
              <i class="fas fa-user profile-icon"></i>
              <div class="dropdown-menu">
                <a href="profile.html">Thông tin cá nhân</a>
                <a href="#" id="btn-logout">Đăng xuất</a>
              </div>
            </div>
            `
          : `<a class="btn" href="login.html">Đăng nhập</a> <a class="btn secondary" href="register.html">Đăng ký</a>`
      }
    </div>
  </div>`;
  const b = qs("#btn-logout");
  if (b) {
    b.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
}
document.addEventListener("DOMContentLoaded", renderNavbar);
