// Notification system for 3H Rental
class NotificationSystem {
  constructor() {
    this.notifications = this.loadFromStorage();
    this.init();
  }

  init() {
    this.createNotificationUI();
    this.updateBadge();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('rental_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('rental_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  createNotificationUI() {
    // Find navbar or create notification container
    const navbar = document.querySelector('#navbar .nav');
    if (!navbar) return;

    // Create notification bell button
    const notificationHTML = `
      <div class="notification-container" style="position: relative; display: flex; align-items: center;">
        <button id="notification-bell" class="btn btn-ghost notification-bell" onclick="toggleNotifications()">
          <i class="fas fa-bell"></i>
          <span id="notification-badge" class="notification-badge" style="display: none;">0</span>
        </button>
        
        <div id="notification-dropdown" class="notification-dropdown" style="display: none;">
          <div class="notification-header">
            <h3>Thông báo</h3>
            <button onclick="markAllAsRead()" class="btn-text">Đánh dấu đã đọc</button>
          </div>
          <div class="notification-list" id="notification-list">
            <!-- Notifications will be populated here -->
          </div>
          <div class="notification-footer">
            <a href="#" onclick="viewAllNotifications()" class="btn-text">Xem tất cả</a>
          </div>
        </div>
      </div>
    `;

    // Insert before user menu
    const userMenu = navbar.querySelector('.user-menu');
    if (userMenu) {
      userMenu.insertAdjacentHTML('beforebegin', notificationHTML);
    } else {
      // If no user menu, add to end of nav
      navbar.insertAdjacentHTML('beforeend', notificationHTML);
    }
  }

  addNotification(notification) {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    this.notifications.unshift(newNotification);
    
    // Keep only latest 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.saveToStorage();
    this.updateUI();
    this.showToast(notification);
  }

  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
      this.updateUI();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveToStorage();
    this.updateUI();
  }

  updateUI() {
    this.updateBadge();
    this.updateDropdown();
  }

  updateBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    const unreadCount = this.notifications.filter(n => !n.read).length;
    
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }

  updateDropdown() {
    const list = document.getElementById('notification-list');
    if (!list) return;

    if (this.notifications.length === 0) {
      list.innerHTML = '<div class="notification-empty">Không có thông báo nào</div>';
      return;
    }

    // Show latest 10 notifications
    const recentNotifications = this.notifications.slice(0, 10);
    
    list.innerHTML = recentNotifications.map(notification => `
      <div class="notification-item ${notification.read ? 'read' : 'unread'}" 
           onclick="handleNotificationClick(${notification.id})">
        <div class="notification-icon ${notification.type}">
          <i class="fas ${this.getIconForType(notification.type)}"></i>
        </div>
        <div class="notification-content">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-message">${notification.message}</div>
          <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
        </div>
        ${!notification.read ? '<div class="notification-dot"></div>' : ''}
      </div>
    `).join('');
  }

  getIconForType(type) {
    const icons = {
      'rental_request': 'fa-home',
      'rental_approved': 'fa-check-circle',
      'rental_rejected': 'fa-times-circle',
      'payment': 'fa-credit-card',
      'invoice': 'fa-file-invoice',
      'system': 'fa-info-circle',
      'default': 'fa-bell'
    };
    return icons[type] || icons.default;
  }

  formatTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    
    return time.toLocaleDateString('vi-VN');
  }

  showToast(notification) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
      <div class="toast-icon ${notification.type}">
        <i class="fas ${this.getIconForType(notification.type)}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title">${notification.title}</div>
        <div class="toast-message">${notification.message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Add to page
    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  // Public methods for different notification types
  notifyRentalRequest(tenantName, roomName) {
    this.addNotification({
      type: 'rental_request',
      title: 'Yêu cầu thuê mới',
      message: `${tenantName} đã gửi yêu cầu thuê ${roomName}`,
      data: { tenantName, roomName }
    });
  }

  notifyRentalApproved(roomName) {
    this.addNotification({
      type: 'rental_approved',
      title: 'Yêu cầu được chấp nhận',
      message: `Yêu cầu thuê ${roomName} đã được chấp nhận`,
      data: { roomName }
    });
  }

  notifyRentalRejected(roomName) {
    this.addNotification({
      type: 'rental_rejected',
      title: 'Yêu cầu bị từ chối',
      message: `Yêu cầu thuê ${roomName} đã bị từ chối`,
      data: { roomName }
    });
  }

  notifyPaymentReceived(amount, roomName) {
    this.addNotification({
      type: 'payment',
      title: 'Thanh toán mới',
      message: `Đã nhận thanh toán ${fmtVND(amount)} cho ${roomName}`,
      data: { amount, roomName }
    });
  }

  notifyInvoiceGenerated(roomName, period) {
    this.addNotification({
      type: 'invoice',
      title: 'Hóa đơn mới',
      message: `Hóa đơn tháng ${period} cho ${roomName} đã được tạo`,
      data: { roomName, period }
    });
  }
}

// Global functions
window.toggleNotifications = function() {
  const dropdown = document.getElementById('notification-dropdown');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  }
};

window.markAllAsRead = function() {
  if (window.notificationSystem) {
    window.notificationSystem.markAllAsRead();
  }
};

window.handleNotificationClick = function(notificationId) {
  if (window.notificationSystem) {
    window.notificationSystem.markAsRead(notificationId);
  }
};

window.viewAllNotifications = function() {
  // TODO: Navigate to full notifications page
  console.log('View all notifications');
};

// Initialize notification system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for navbar to be rendered first
  setTimeout(() => {
    window.notificationSystem = new NotificationSystem();
  }, 100);
});

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
  const container = event.target.closest('.notification-container');
  const dropdown = document.getElementById('notification-dropdown');
  
  if (!container && dropdown) {
    dropdown.style.display = 'none';
  }
});
