// Common utility functions and authentication handling
function checkAuth() {
    // Try new auth system first
    const currentUserData = localStorage.getItem('currentUser');
    if (currentUserData) {
        try {
            const userData = JSON.parse(currentUserData);
            console.log('User authenticated via currentUser:', userData);
            return true;
        } catch (error) {
            console.error('Error parsing currentUser:', error);
        }
    }
    
    // Fallback to old auth system
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        console.log('No auth data found, redirecting to login');
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        const userData = JSON.parse(user);
        // Check if token is expired (simple check)
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (tokenPayload.exp < currentTime) {
            // Token expired, try to refresh
            refreshToken().then(success => {
                if (!success) {
                    logout();
                }
            });
        }
        
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        logout();
        return false;
    }
}

async function refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    
    try {
        const response = await fetch('/api/auth/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access);
            return true;
        }
    } catch (error) {
        console.error('Token refresh error:', error);
    }
    
    return false;
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Navigation functions
function initNavigation() {
    const user = api.getSession();
    if (!user) return;
    
    // Update user info in header
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
        userNameElement.textContent = `${user.first_name} ${user.last_name}`;
    }
    
    const userRoleElement = document.querySelector('.user-role');
    if (userRoleElement) {
        userRoleElement.textContent = user.role === 'OWNER' ? 'Chủ trọ' : 'Người thuê';
    }
    
    // Hide/show menu items based on role
    if (user.role === 'TENANT') {
        const ownerOnlyElements = document.querySelectorAll('.owner-only');
        ownerOnlyElements.forEach(el => el.style.display = 'none');
    }
    
    // Set active navigation item
    setActiveNavItem();
}

function setActiveNavItem() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navItems = document.querySelectorAll('.sidebar nav a');
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Common UI functions (notification system removed)

function confirmAction(message, callback) {
    const modal = document.createElement('div');
    modal.className = 'modal confirmation-modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Xác nhận</h3>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn secondary" onclick="closeConfirmation(false)">Hủy</button>
                <button class="btn danger" onclick="closeConfirmation(true)">Xác nhận</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    window.closeConfirmation = function(confirmed) {
        modal.remove();
        if (confirmed && callback) {
            callback();
        }
    };
}

// Form validation utilities
function validateRequired(fields) {
    const errors = [];
    
    for (const [fieldName, value] of Object.entries(fields)) {
        if (!value || value.toString().trim() === '') {
            errors.push(`${fieldName} là bắt buộc`);
        }
    }
    
    return errors;
}

function validateEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

function validatePhone(phone) {
    const pattern = /^[\d\s\-\+\(\)]{10,15}$/;
    return pattern.test(phone);
}

function validateNumber(value, min = null, max = null) {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (min !== null && num < min) return false;
    if (max !== null && num > max) return false;
    return true;
}

// Date utilities
function formatDate(dateString, format = 'vi-VN') {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(format);
}

function formatDateTime(dateString, format = 'vi-VN') {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString(format);
}

function getCurrentPeriod() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function getPreviousPeriod() {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function getNextPeriod() {
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

// Currency utilities
function formatCurrency(amount, currency = 'VND') {
    if (amount === null || amount === undefined) return '0 ₫';
    
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function parseCurrency(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        // Remove currency symbols and spaces
        const cleaned = value.replace(/[^\d,.-]/g, '');
        // Handle Vietnamese number format (comma as thousands separator)
        const normalized = cleaned.replace(/,/g, '');
        return parseFloat(normalized) || 0;
    }
    return 0;
}

// Loading and error handling
function showGlobalLoading() {
    let loader = document.getElementById('global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'global-loader';
        loader.innerHTML = `
            <div class="spinner"></div>
            <p>Đang tải...</p>
        `;
        document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
}

function hideGlobalLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

function handleGlobalError(error) {
    console.error('Global error:', error);
    
    if (error.status === 401) {
        alert('Phiên đăng nhập đã hết hạn');
        logout();
        return;
    }
    
    if (error.status === 403) {
        alert('Bạn không có quyền thực hiện thao tác này');
        return;
    }
    
    if (error.status >= 500) {
        alert('Lỗi máy chủ. Vui lòng thử lại sau');
        return;
    }
    
    alert(error.message || 'Đã xảy ra lỗi');
}

// URL parameters utility
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function setUrlParameter(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.replaceState({}, '', url);
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check auth on every page except login/register
    const currentPage = window.location.pathname.split('/').pop();
    if (!['login.html', 'register.html', ''].includes(currentPage)) {
        if (checkAuth()) {
            initNavigation();
        }
    }
    
    // Add logout handler to logout buttons
    const logoutBtns = document.querySelectorAll('.logout-btn, [data-action="logout"]');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            confirmAction('Bạn có chắc chắn muốn đăng xuất?', logout);
        });
    });
    
    // Add click handler for user menu toggle
    const userMenuToggle = document.querySelector('.user-menu-toggle');
    const userDropdown = document.querySelector('.user-dropdown');
    
    if (userMenuToggle && userDropdown) {
        userMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            userDropdown.classList.remove('show');
        });
    }
});

// Export functions for use in other scripts
window.authUtils = {
    checkAuth,
    logout,
    refreshToken
};

window.uiUtils = {
    confirmAction,
    showGlobalLoading,
    hideGlobalLoading,
    handleGlobalError
};

window.formUtils = {
    validateRequired,
    validateEmail,
    validatePhone,
    validateNumber
};

window.dateUtils = {
    formatDate,
    formatDateTime,
    getCurrentPeriod,
    getPreviousPeriod,
    getNextPeriod
};

window.currencyUtils = {
    formatCurrency,
    parseCurrency
};

window.urlUtils = {
    getUrlParameter,
    setUrlParameter
};
