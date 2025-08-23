function qs(s, c = document) {
  return c.querySelector(s);
}

function qsa(s, c = document) {
  return [...c.querySelectorAll(s)];
}

function fmtVND(n) {
  // Đảm bảo n là một số hợp lệ
  const numValue = parseFloat(n);
  
  // Kiểm tra nếu là số hợp lệ (không phải NaN)
  if (isNaN(numValue)) {
    console.warn("Giá trị không phải là số:", n);
    return "0₫";
  }
  
  // Sử dụng định dạng tiền tệ Việt Nam với khoảng cách giữa các chữ số
  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "decimal",
    maximumFractionDigits: 0,
  });
  return formatter.format(numValue) + "₫";
}

function renderNavbar() {
  const nav = qs("#navbar");
  if (!nav) {
    console.error('Navbar element not found!');
    return;
  }
  
  let u = null;
  try {
    u = currentUser();
  } catch (error) {
    console.error('Error getting current user:', error);
  }
  
  console.log('Rendering navbar with user:', u);
  
  nav.innerHTML = `
  <div class="container">
    <div class="nav">
      <div class="brand">
        <img src="assets/placeholder.svg" alt="3H Rental Logo"/>
        <h1>3H Rental</h1>
      </div>
      <nav class="nav-links">
        <a href="index.html" ${window.location.pathname.includes('index') ? 'style="color: var(--primary);"' : ''}>
          <i class="fas fa-home"></i> Trang chủ
        </a>
        ${
          u && u.role === "OWNER"
            ? `<a href="room-management.html" ${window.location.pathname.includes('room-management') ? 'style="color: var(--primary);"' : ''}>
                <i class="fas fa-building"></i> Quản lý phòng
              </a>
              <a href="rental-management.html" ${window.location.pathname.includes('rental-management') ? 'style="color: var(--primary);"' : ''}>
                <i class="fas fa-handshake"></i> Quản lý thuê phòng
              </a>
              <a href="invoice-management.html" ${window.location.pathname.includes('invoice-management') ? 'style="color: var(--primary);"' : ''}>
                <i class="fas fa-file-invoice"></i> Hóa đơn
              </a>
              <a href="reports.html" ${window.location.pathname.includes('reports') ? 'style="color: var(--primary);"' : ''}>
                <i class="fas fa-chart-bar"></i> Báo cáo
              </a>`
            : ""
        }
        ${
          u && u.role !== "OWNER"
            ? `<a href="dashboard.html" ${window.location.pathname.includes('dashboard') ? 'style="color: var(--primary);"' : ''}>
                <i class="fas fa-tachometer-alt"></i> Dashboard
              </a>`
            : ""
        }
        ${
          u
            ? `
              <div class="user-menu" style="position: relative; display: flex; align-items: center; gap: 1rem;">
                <a href="profile.html" class="btn btn-ghost">
                  <i class="fas fa-user"></i> ${u.username || u.email || 'User'}
                </a>
                <button onclick="logout()" class="btn btn-ghost" style="color: var(--danger);">
                  <i class="fas fa-sign-out-alt"></i> Đăng xuất
                </button>
              </div>`
            : `
              <div style="display: flex; gap: 0.75rem;">
                <a href="login.html" class="btn btn-ghost">
                  <i class="fas fa-sign-in-alt"></i> Đăng nhập
                </a>
                <a href="register.html" class="btn btn-primary">
                  <i class="fas fa-user-plus"></i> Đăng ký
                </a>
              </div>`
        }
      </nav>
    </div>
  </div>
  `;
}

function logout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    // Clear session
    if (window.api && api.clearSession) {
      api.clearSession();
    } else {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
    
    // Trigger custom event
    window.dispatchEvent(new CustomEvent('userLogout'));
    
    // Redirect
    window.location.href = "index.html";
  }
}

// Notification toasts removed

// Initialize navbar on page load
document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
  
  // Check if this is a redirect after login (has timestamp parameter)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('_t')) {
    console.log('Detected login redirect, forcing navbar refresh');
    // Remove the timestamp parameter from URL
    urlParams.delete('_t');
    const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
    window.history.replaceState({}, '', newUrl);
    
    // Force navbar refresh after a brief delay
    setTimeout(() => {
      renderNavbar();
    }, 100);
  }
});

// Listen for storage changes to update navbar when login status changes
window.addEventListener('storage', (e) => {
  if (e.key === 'currentUser') {
    console.log('User session changed, updating navbar');
    renderNavbar();
  }
});

// Also listen for custom events
window.addEventListener('userLogin', () => {
  console.log('User login event, updating navbar');
  renderNavbar();
});

window.addEventListener('userLogout', () => {
  console.log('User logout event, updating navbar');
  renderNavbar();
});
