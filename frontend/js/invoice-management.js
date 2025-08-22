// Invoice Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!checkAuth()) return;

    const user = api.getSession();
    if (user.role !== 'OWNER') {
        alert('Bạn không có quyền truy cập trang này');
        window.location.href = 'dashboard.html';
        return;
    }

    // Form elements
    const invoiceGenerateForm = document.getElementById('invoiceGenerateForm');
    const contractSelect = document.getElementById('contractSelect');
    const filterContract = document.getElementById('filterContract');
    const invoiceTbody = document.getElementById('invoice-tbody');

    // Modal elements
    const invoiceModal = document.getElementById('invoiceModal');
    const closeModal = document.getElementById('closeModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const invoiceDetails = document.getElementById('invoiceDetails');

    // Load initial data
    loadContracts();
    loadInvoices();

    // Event listeners
    invoiceGenerateForm.addEventListener('submit', handleGenerateInvoice);
    document.getElementById('filterBtn').addEventListener('click', handleFilter);
    document.getElementById('clearFilterBtn').addEventListener('click', clearFilters);
    closeModal.addEventListener('click', () => invoiceModal.style.display = 'none');
    closeModalBtn.addEventListener('click', () => invoiceModal.style.display = 'none');

    // Set current month as default
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('period').value = currentMonth;

    async function loadContracts() {
        try {
            showLoading();
            const response = await api.getContracts();
            const contracts = response.results || response;
            
            // Populate contract selects
            [contractSelect, filterContract].forEach(select => {
                select.innerHTML = select === contractSelect ? 
                    '<option value="">Chọn hợp đồng...</option>' : 
                    '<option value="">Tất cả hợp đồng</option>';
                    
                contracts.filter(c => c.status === 'ACTIVE').forEach(contract => {
                    const option = document.createElement('option');
                    option.value = contract.id;
                    option.textContent = `${contract.room_name} - ${contract.tenant_name}`;
                    select.appendChild(option);
                });
            });
        } catch (error) {
            console.error('Error loading contracts:', error);
            showError('Không thể tải danh sách hợp đồng');
        } finally {
            hideLoading();
        }
    }

    async function loadInvoices(params = {}) {
        try {
            showLoading();
            const response = await api.getInvoices(params);
            const invoices = response.results || response;
            
            displayInvoices(invoices);
        } catch (error) {
            console.error('Error loading invoices:', error);
            showError('Không thể tải danh sách hóa đơn');
        } finally {
            hideLoading();
        }
    }

    function displayInvoices(invoices) {
        invoiceTbody.innerHTML = '';

        if (!invoices || invoices.length === 0) {
            invoiceTbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Không có hóa đơn nào</td></tr>';
            return;
        }

        invoices.forEach(invoice => {
            const row = document.createElement('tr');
            
            const statusClass = {
                'UNPAID': 'status-warning',
                'PAID': 'status-success',
                'OVERDUE': 'status-danger'
            }[invoice.status] || '';

            const statusText = {
                'UNPAID': 'Chưa thanh toán',
                'PAID': 'Đã thanh toán',
                'OVERDUE': 'Quá hạn'
            }[invoice.status] || invoice.status;

            row.innerHTML = `
                <td>${invoice.id}</td>
                <td>${invoice.room_name}</td>
                <td>${invoice.tenant_name}</td>
                <td>${invoice.period}</td>
                <td>${formatCurrency(invoice.total)}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>${formatDate(invoice.due_date)}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn-small" onclick="viewInvoice(${invoice.id})">Xem</button>
                        ${invoice.status === 'UNPAID' ? `
                            <button class="btn-small success" onclick="markPaid(${invoice.id})">Đã trả</button>
                            <button class="btn-small warning" onclick="markOverdue(${invoice.id})">Quá hạn</button>
                        ` : ''}
                        ${invoice.status !== 'PAID' ? `
                            <button class="btn-small danger" onclick="cancelInvoice(${invoice.id})">Hủy</button>
                        ` : ''}
                    </div>
                </td>
            `;
            invoiceTbody.appendChild(row);
        });
    }

    async function handleGenerateInvoice(e) {
        e.preventDefault();
        
        try {
            showLoading();
            const formData = new FormData(invoiceGenerateForm);
            const generateData = {
                contract: parseInt(formData.get('contract')),
                period: formData.get('period'),
                service_cost: parseFloat(formData.get('service_cost')) || 0,
                due_days: parseInt(formData.get('due_days')) || 30
            };

            await api.generateInvoice(generateData);
            showSuccess('Tạo hóa đơn thành công');
            invoiceGenerateForm.reset();
            loadInvoices();
        } catch (error) {
            console.error('Error generating invoice:', error);
            showError(error.message || 'Không thể tạo hóa đơn');
        } finally {
            hideLoading();
        }
    }

    function handleFilter() {
        const params = {};
        
        const contract = document.getElementById('filterContract').value;
        const period = document.getElementById('filterPeriod').value;
        const status = document.getElementById('filterStatus').value;
        
        if (contract) params.contract = contract;
        if (period) params.period = period;
        if (status) params.status = status;
        
        loadInvoices(params);
    }

    function clearFilters() {
        document.getElementById('filterContract').value = '';
        document.getElementById('filterPeriod').value = '';
        document.getElementById('filterStatus').value = '';
        loadInvoices();
    }

    // Global functions for invoice actions
    window.viewInvoice = async function(id) {
        try {
            showLoading();
            const invoice = await api.getInvoice(id);
            
            invoiceDetails.innerHTML = `
                <div class="invoice-detail">
                    <div class="grid" style="grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div><strong>ID hóa đơn:</strong> ${invoice.id}</div>
                        <div><strong>Kỳ:</strong> ${invoice.period}</div>
                        <div><strong>Phòng:</strong> ${invoice.room_name}</div>
                        <div><strong>Người thuê:</strong> ${invoice.tenant_name}</div>
                        <div><strong>Tiền phòng:</strong> ${formatCurrency(invoice.room_price)}</div>
                        <div><strong>Tiền điện:</strong> ${formatCurrency(invoice.elec_cost)}</div>
                        <div><strong>Tiền nước:</strong> ${formatCurrency(invoice.water_cost)}</div>
                        <div><strong>Phí dịch vụ:</strong> ${formatCurrency(invoice.service_cost)}</div>
                        <div><strong>Tổng tiền:</strong> <span style="color: #dc2626; font-size: 1.2em;">${formatCurrency(invoice.total)}</span></div>
                        <div><strong>Trạng thái:</strong> ${invoice.status}</div>
                        <div><strong>Ngày phát hành:</strong> ${formatDate(invoice.issued_at)}</div>
                        <div><strong>Ngày đến hạn:</strong> ${formatDate(invoice.due_date)}</div>
                    </div>
                </div>
            `;
            
            invoiceModal.style.display = 'block';
        } catch (error) {
            console.error('Error loading invoice details:', error);
            showError('Không thể tải chi tiết hóa đơn');
        } finally {
            hideLoading();
        }
    };

    window.markPaid = async function(id) {
        if (!confirm('Xác nhận đánh dấu hóa đơn đã thanh toán?')) return;
        
        try {
            showLoading();
            await api.markInvoicePaid(id);
            showSuccess('Đã đánh dấu hóa đơn đã thanh toán');
            loadInvoices();
        } catch (error) {
            console.error('Error marking invoice paid:', error);
            showError(error.message || 'Không thể cập nhật trạng thái hóa đơn');
        } finally {
            hideLoading();
        }
    };

    window.markOverdue = async function(id) {
        if (!confirm('Xác nhận đánh dấu hóa đơn quá hạn?')) return;
        
        try {
            showLoading();
            await api.markInvoiceOverdue(id);
            showSuccess('Đã đánh dấu hóa đơn quá hạn');
            loadInvoices();
        } catch (error) {
            console.error('Error marking invoice overdue:', error);
            showError(error.message || 'Không thể cập nhật trạng thái hóa đơn');
        } finally {
            hideLoading();
        }
    };

    window.cancelInvoice = async function(id) {
        if (!confirm('Xác nhận hủy hóa đơn? Hành động này không thể hoàn tác.')) return;
        
        try {
            showLoading();
            await api.cancelInvoice(id);
            showSuccess('Đã hủy hóa đơn');
            loadInvoices();
        } catch (error) {
            console.error('Error canceling invoice:', error);
            showError(error.message || 'Không thể hủy hóa đơn');
        } finally {
            hideLoading();
        }
    };

    // Utility functions
    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('vi-VN');
    }

    function showLoading() {
        // Add loading indicator
        document.body.style.cursor = 'wait';
    }

    function hideLoading() {
        document.body.style.cursor = 'default';
    }

    function showSuccess(message) {
        alert(message); // Replace with better notification system
    }

    function showError(message) {
        alert('Lỗi: ' + message); // Replace with better notification system
    }
});
