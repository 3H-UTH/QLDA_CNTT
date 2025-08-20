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
            ? `<a href="admin.html" ${window.location.pathname.includes('admin') ? 'style="color: var(--primary);"' : ''}>
                <i class="fas fa-cogs"></i> Quản trị
              </a>`
            : ""
        }
        ${
          u && u.role === "OWNER"
            ? `<a href="room-management.html" ${window.location.pathname.includes('room-management') ? 'style="color: var(--primary);"' : ''}>
                <i class="fas fa-building"></i> Quản lý phòng
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

function showNotif(msg, type = "info") {
  // Create a modern toast notification
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    z-index: 1000;
    padding: 1rem 1.5rem;
    border-radius: var(--radius-md);
    background: var(--card-bg);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-lg);
    max-width: 400px;
    opacity: 0;
    transform: translateX(100%);
    transition: all var(--transition-normal);
  `;
  
  // Set color based on type
  let iconClass = 'fas fa-info-circle';
  let colorStyle = 'color: var(--info);';
  
  switch(type) {
    case 'success':
      iconClass = 'fas fa-check-circle';
      colorStyle = 'color: var(--success);';
      break;
    case 'error':
      iconClass = 'fas fa-exclamation-circle';
      colorStyle = 'color: var(--danger);';
      break;
    case 'warning':
      iconClass = 'fas fa-exclamation-triangle';
      colorStyle = 'color: var(--warning);';
      break;
  }
  
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <i class="${iconClass}" style="font-size: 1.25rem; ${colorStyle}"></i>
      <span style="color: var(--text-primary); font-weight: 500;">${msg}</span>
      <button onclick="this.closest('.toast').remove()" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0; margin-left: auto;">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 100);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

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
