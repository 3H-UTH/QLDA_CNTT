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
  <div class="container">
    <div class="nav">
      <div class="brand">
        <img src="assets/placeholder.svg" alt="3H Rental Logo"/>
        <h1>3H Rental</h1>
      </div>
      <nav class="nav-links">
        <a href="index.html">
          <i class="fas fa-home"></i> Trang chủ
        </a>
        ${
          u && u.role === "admin"
            ? `<a href="admin.html">
                <i class="fas fa-cogs"></i> Quản trị
              </a>`
            : ""
        }
        ${
          u && u.role === "OWNER"
            ? `<a href="room-management.html">
                <i class="fas fa-building"></i> Quản lý phòng
              </a>`
            : ""
        }
        ${
          u && u.role !== "admin"
            ? `<a href="dashboard.html">
                <i class="fas fa-tachometer-alt"></i> Dashboard
              </a>`
            : ""
        }
        ${
          u
            ? `
              <div class="user-menu" style="position: relative;">
                <a href="profile.html" class="btn btn-secondary">
                  <i class="fas fa-user"></i> ${u.fullName || u.email}
                </a>
                <a href="#" id="btn-logout" class="btn btn-outline" style="margin-left: 0.5rem;">
                  <i class="fas fa-sign-out-alt"></i> Đăng xuất
                </a>
              </div>
              `
            : `
              <a class="btn btn-secondary" href="register.html">
                <i class="fas fa-user-plus"></i> Đăng ký
              </a>
              <a class="btn btn-primary" href="login.html">
                <i class="fas fa-sign-in-alt"></i> Đăng nhập
              </a>
              `
        }
      </nav>
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
