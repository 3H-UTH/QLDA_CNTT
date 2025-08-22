// Tenant Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!checkAuth()) return;

    const user = api.getSession();
    if (user.role !== 'OWNER') {
        alert('Bạn không có quyền truy cập trang này');
        window.location.href = 'dashboard.html';
        return;
    }

    // Global variables
    let tenants = [];
    let currentEditingTenant = null;

    // Initialize
    loadTenants();

    // Event listeners
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 300));
    document.getElementById('statusFilter').addEventListener('change', handleFilter);
    document.getElementById('addTenantBtn').addEventListener('click', openAddModal);
    document.getElementById('tenantForm').addEventListener('submit', handleSubmit);
    document.getElementById('cancelEdit').addEventListener('click', closeModal);

    // Search and filter functions
    function handleSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filteredTenants = tenants.filter(tenant => 
            tenant.user.first_name.toLowerCase().includes(searchTerm) ||
            tenant.user.last_name.toLowerCase().includes(searchTerm) ||
            tenant.user.email.toLowerCase().includes(searchTerm) ||
            tenant.phone.toLowerCase().includes(searchTerm) ||
            (tenant.current_room && tenant.current_room.name.toLowerCase().includes(searchTerm))
        );
        displayTenants(filteredTenants);
    }

    function handleFilter() {
        const status = document.getElementById('statusFilter').value;
        let filteredTenants = tenants;

        if (status === 'active') {
            filteredTenants = tenants.filter(tenant => tenant.current_room !== null);
        } else if (status === 'inactive') {
            filteredTenants = tenants.filter(tenant => tenant.current_room === null);
        }

        // Apply search as well
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        if (searchTerm) {
            filteredTenants = filteredTenants.filter(tenant => 
                tenant.user.first_name.toLowerCase().includes(searchTerm) ||
                tenant.user.last_name.toLowerCase().includes(searchTerm) ||
                tenant.user.email.toLowerCase().includes(searchTerm) ||
                tenant.phone.toLowerCase().includes(searchTerm) ||
                (tenant.current_room && tenant.current_room.name.toLowerCase().includes(searchTerm))
            );
        }

        displayTenants(filteredTenants);
    }

    async function loadTenants() {
        try {
            showLoading();
            tenants = await api.getTenants();
            displayTenants(tenants);
            updateStats();
        } catch (error) {
            console.error('Error loading tenants:', error);
            showError(error.message || 'Không thể tải danh sách người thuê');
        } finally {
            hideLoading();
        }
    }

    function displayTenants(tenantsToShow) {
        const tbody = document.getElementById('tenants-tbody');
        tbody.innerHTML = '';

        if (tenantsToShow.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Không có dữ liệu</td></tr>';
            return;
        }

        tenantsToShow.forEach(tenant => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tenant.user.first_name} ${tenant.user.last_name}</td>
                <td><a href="mailto:${tenant.user.email}">${tenant.user.email}</a></td>
                <td><a href="tel:${tenant.phone}">${tenant.phone}</a></td>
                <td>${tenant.current_room ? tenant.current_room.name : '-'}</td>
                <td>
                    <span class="status ${tenant.current_room ? 'status-success' : 'status-secondary'}">
                        ${tenant.current_room ? 'Đang thuê' : 'Không thuê'}
                    </span>
                </td>
                <td>${formatDate(tenant.created_at)}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn-small" onclick="viewTenant(${tenant.id})" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-small" onclick="editTenant(${tenant.id})" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-small" onclick="viewContracts(${tenant.id})" title="Xem hợp đồng">
                            <i class="fas fa-file-contract"></i>
                        </button>
                        <button class="btn-small" onclick="viewInvoices(${tenant.id})" title="Xem hóa đơn">
                            <i class="fas fa-file-invoice"></i>
                        </button>
                        <button class="btn-small danger" onclick="deleteTenant(${tenant.id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    function updateStats() {
        const activeTenants = tenants.filter(t => t.current_room !== null).length;
        const inactiveTenants = tenants.filter(t => t.current_room === null).length;

        document.getElementById('totalTenants').textContent = tenants.length;
        document.getElementById('activeTenants').textContent = activeTenants;
        document.getElementById('inactiveTenants').textContent = inactiveTenants;
    }

    // Modal functions
    function openAddModal() {
        currentEditingTenant = null;
        document.getElementById('modalTitle').textContent = 'Thêm người thuê mới';
        document.getElementById('tenantForm').reset();
        document.getElementById('tenantModal').style.display = 'block';
    }

    function closeModal() {
        document.getElementById('tenantModal').style.display = 'none';
        currentEditingTenant = null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        
        const formData = {
            first_name: document.getElementById('firstName').value.trim(),
            last_name: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            address: document.getElementById('address').value.trim(),
            identity_number: document.getElementById('identityNumber').value.trim(),
            emergency_contact: document.getElementById('emergencyContact').value.trim(),
            notes: document.getElementById('notes').value.trim()
        };

        // Validation
        if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone) {
            showError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        if (!isValidEmail(formData.email)) {
            showError('Email không hợp lệ');
            return;
        }

        if (!isValidPhone(formData.phone)) {
            showError('Số điện thoại không hợp lệ');
            return;
        }

        try {
            showLoading();
            
            if (currentEditingTenant) {
                await api.updateTenant(currentEditingTenant.id, formData);
                showSuccess('Cập nhật thông tin người thuê thành công');
            } else {
                await api.createTenant(formData);
                showSuccess('Thêm người thuê mới thành công');
            }
            
            closeModal();
            loadTenants();
        } catch (error) {
            console.error('Error saving tenant:', error);
            showError(error.message || 'Không thể lưu thông tin người thuê');
        } finally {
            hideLoading();
        }
    }

    // Global functions
    window.viewTenant = function(tenantId) {
        const tenant = tenants.find(t => t.id === tenantId);
        if (!tenant) return;

        const detailsHtml = `
            <div class="tenant-details">
                <h3>Thông tin chi tiết</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Họ tên:</label>
                        <span>${tenant.user.first_name} ${tenant.user.last_name}</span>
                    </div>
                    <div class="info-item">
                        <label>Email:</label>
                        <span>${tenant.user.email}</span>
                    </div>
                    <div class="info-item">
                        <label>Số điện thoại:</label>
                        <span>${tenant.phone}</span>
                    </div>
                    <div class="info-item">
                        <label>Địa chỉ:</label>
                        <span>${tenant.address || 'Chưa cập nhật'}</span>
                    </div>
                    <div class="info-item">
                        <label>CMND/CCCD:</label>
                        <span>${tenant.identity_number || 'Chưa cập nhật'}</span>
                    </div>
                    <div class="info-item">
                        <label>Liên hệ khẩn cấp:</label>
                        <span>${tenant.emergency_contact || 'Chưa cập nhật'}</span>
                    </div>
                    <div class="info-item">
                        <label>Phòng hiện tại:</label>
                        <span>${tenant.current_room ? tenant.current_room.name : 'Không thuê phòng'}</span>
                    </div>
                    <div class="info-item">
                        <label>Ngày tạo:</label>
                        <span>${formatDate(tenant.created_at)}</span>
                    </div>
                    ${tenant.notes ? `
                    <div class="info-item full-width">
                        <label>Ghi chú:</label>
                        <span>${tenant.notes}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        showModal('Chi tiết người thuê', detailsHtml);
    };

    window.editTenant = function(tenantId) {
        const tenant = tenants.find(t => t.id === tenantId);
        if (!tenant) return;

        currentEditingTenant = tenant;
        document.getElementById('modalTitle').textContent = 'Chỉnh sửa thông tin người thuê';
        
        // Fill form
        document.getElementById('firstName').value = tenant.user.first_name;
        document.getElementById('lastName').value = tenant.user.last_name;
        document.getElementById('email').value = tenant.user.email;
        document.getElementById('phone').value = tenant.phone;
        document.getElementById('address').value = tenant.address || '';
        document.getElementById('identityNumber').value = tenant.identity_number || '';
        document.getElementById('emergencyContact').value = tenant.emergency_contact || '';
        document.getElementById('notes').value = tenant.notes || '';
        
        document.getElementById('tenantModal').style.display = 'block';
    };

    window.deleteTenant = async function(tenantId) {
        const tenant = tenants.find(t => t.id === tenantId);
        if (!tenant) return;

        if (tenant.current_room) {
            showError('Không thể xóa người thuê đang thuê phòng');
            return;
        }

        if (!confirm(`Bạn có chắc chắn muốn xóa người thuê "${tenant.user.first_name} ${tenant.user.last_name}"?`)) {
            return;
        }

        try {
            showLoading();
            await api.deleteTenant(tenantId);
            showSuccess('Xóa người thuê thành công');
            loadTenants();
        } catch (error) {
            console.error('Error deleting tenant:', error);
            showError(error.message || 'Không thể xóa người thuê');
        } finally {
            hideLoading();
        }
    };

    window.viewContracts = function(tenantId) {
        // Redirect to contracts page with tenant filter
        window.location.href = `contracts.html?tenant=${tenantId}`;
    };

    window.viewInvoices = function(tenantId) {
        // Redirect to invoices page with tenant filter
        window.location.href = `invoice-management.html?tenant=${tenantId}`;
    };

    // Utility functions
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPhone(phone) {
        return /^[\d\s\-\+\(\)]{10,15}$/.test(phone);
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('vi-VN');
    }

    function showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button class="btn secondary" onclick="this.closest('.modal').remove()">Đóng</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function showLoading() {
        document.body.style.cursor = 'wait';
    }

    function hideLoading() {
        document.body.style.cursor = 'default';
    }

    function showSuccess(message) {
        alert(message);
    }

    function showError(message) {
        alert('Lỗi: ' + message);
    }

    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('tenantModal');
        if (event.target === modal) {
            closeModal();
        }
    };
});
