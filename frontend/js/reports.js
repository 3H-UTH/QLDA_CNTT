// Reports JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!checkAuth()) return;

    const user = api.getSession();
    if (user.role !== 'OWNER') {
        alert('Bạn không có quyền truy cập trang này');
        window.location.href = 'dashboard.html';
        return;
    }

    // Chart instance
    let revenueChart = null;

    // Set default date ranges
    setDefaultDates();

    // Event listeners
    document.getElementById('generateRevenueReport').addEventListener('click', generateRevenueReport);
    document.getElementById('generateArrearsReport').addEventListener('click', generateArrearsReport);
    document.getElementById('exportReport').addEventListener('click', exportRevenueReport);
    document.getElementById('exportArrears').addEventListener('click', exportArrearsReport);

    // Quick date buttons
    document.getElementById('thisMonth').addEventListener('click', () => setDateRange('thisMonth'));
    document.getElementById('thisQuarter').addEventListener('click', () => setDateRange('thisQuarter'));
    document.getElementById('thisYear').addEventListener('click', () => setDateRange('thisYear'));
    document.getElementById('lastYear').addEventListener('click', () => setDateRange('lastYear'));

    function setDefaultDates() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        document.getElementById('fromPeriod').value = `${currentYear}-01`;
        document.getElementById('toPeriod').value = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    }

    function setDateRange(type) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;

        let fromPeriod, toPeriod;

        switch (type) {
            case 'thisMonth':
                fromPeriod = toPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
                break;
            case 'thisQuarter':
                const quarterStart = (currentQuarter - 1) * 3 + 1;
                fromPeriod = `${currentYear}-${String(quarterStart).padStart(2, '0')}`;
                toPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
                break;
            case 'thisYear':
                fromPeriod = `${currentYear}-01`;
                toPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
                break;
            case 'lastYear':
                fromPeriod = `${currentYear - 1}-01`;
                toPeriod = `${currentYear - 1}-12`;
                break;
        }

        document.getElementById('fromPeriod').value = fromPeriod;
        document.getElementById('toPeriod').value = toPeriod;
    }

    async function generateRevenueReport() {
        const fromPeriod = document.getElementById('fromPeriod').value;
        const toPeriod = document.getElementById('toPeriod').value;

        if (!fromPeriod || !toPeriod) {
            showError('Vui lòng nhập đầy đủ khoảng thời gian');
            return;
        }

        if (fromPeriod > toPeriod) {
            showError('Thời gian bắt đầu không được lớn hơn thời gian kết thúc');
            return;
        }

        try {
            showLoading();
            const report = await api.getRevenueReport(fromPeriod, toPeriod);
            
            displayRevenueSummary(report);
            displayRevenueChart(report);
            displayMonthlyBreakdown(report);
            
            // Show sections
            document.getElementById('revenueSummary').style.display = 'grid';
            document.getElementById('chartContainer').style.display = 'block';
            document.getElementById('monthlyBreakdown').style.display = 'block';
            
        } catch (error) {
            console.error('Error generating revenue report:', error);
            showError(error.message || 'Không thể tạo báo cáo doanh thu');
        } finally {
            hideLoading();
        }
    }

    function displayRevenueSummary(report) {
        document.getElementById('totalRevenue').textContent = formatCurrency(report.total_revenue);
        
        const totalInvoices = report.monthly_breakdown.reduce((sum, month) => sum + month.paid_invoices_count, 0);
        document.getElementById('totalInvoices').textContent = totalInvoices;
        
        const avgRevenue = report.monthly_breakdown.length > 0 ? 
            report.total_revenue / report.monthly_breakdown.length : 0;
        document.getElementById('avgRevenue').textContent = formatCurrency(avgRevenue);
    }

    function displayRevenueChart(report) {
        const ctx = document.getElementById('revenueChart').getContext('2d');
        
        // Destroy existing chart
        if (revenueChart) {
            revenueChart.destroy();
        }

        const labels = report.monthly_breakdown.map(item => item.period);
        const data = report.monthly_breakdown.map(item => item.revenue);

        revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Doanh thu (VND)',
                    data: data,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Biểu đồ doanh thu theo tháng'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                }
            }
        });
    }

    function displayMonthlyBreakdown(report) {
        const tbody = document.getElementById('breakdown-tbody');
        tbody.innerHTML = '';

        report.monthly_breakdown.forEach(month => {
            const percentage = report.total_revenue > 0 ? 
                (month.revenue / report.total_revenue * 100).toFixed(1) : 0;
                
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${month.period}</td>
                <td>${formatCurrency(month.revenue)}</td>
                <td>${month.paid_invoices_count}</td>
                <td>${percentage}%</td>
            `;
            tbody.appendChild(row);
        });
    }

    async function generateArrearsReport() {
        const period = document.getElementById('arrearsPeriod').value;

        try {
            showLoading();
            const report = await api.getArrearsReport(period);
            
            displayArrearsSummary(report);
            displayUnpaidInvoices(report);
            
            // Show sections
            document.getElementById('arrearsSummary').style.display = 'grid';
            document.getElementById('unpaidInvoices').style.display = 'block';
            
        } catch (error) {
            console.error('Error generating arrears report:', error);
            showError(error.message || 'Không thể tạo báo cáo công nợ');
        } finally {
            hideLoading();
        }
    }

    function displayArrearsSummary(report) {
        document.getElementById('totalUnpaid').textContent = formatCurrency(report.summary.total_unpaid_amount);
        document.getElementById('totalOverdue').textContent = formatCurrency(report.summary.total_overdue_amount);
        document.getElementById('unpaidCount').textContent = report.summary.unpaid_count;
        document.getElementById('overdueCount').textContent = report.summary.overdue_count;
    }

    function displayUnpaidInvoices(report) {
        const tbody = document.getElementById('unpaid-tbody');
        tbody.innerHTML = '';

        if (!report.unpaid_invoices || report.unpaid_invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">Không có hóa đơn chưa thanh toán</td></tr>';
            return;
        }

        report.unpaid_invoices.forEach(invoice => {
            const statusClass = invoice.status === 'OVERDUE' ? 'status-danger' : 'status-warning';
            const statusText = invoice.status === 'OVERDUE' ? 'Quá hạn' : 'Chưa trả';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${invoice.invoice_id}</td>
                <td>${invoice.room_name}</td>
                <td>${invoice.tenant_name}</td>
                <td><a href="mailto:${invoice.tenant_email}">${invoice.tenant_email}</a></td>
                <td>${invoice.period}</td>
                <td>${formatCurrency(invoice.total)}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>${formatDate(invoice.due_date)}</td>
                <td>${invoice.days_overdue > 0 ? `${invoice.days_overdue} ngày` : '-'}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn-small" onclick="sendReminder('${invoice.tenant_email}', ${invoice.invoice_id})">Nhắc nhở</button>
                        <button class="btn-small success" onclick="markPaidFromReport(${invoice.invoice_id})">Đã trả</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async function exportRevenueReport() {
        const fromPeriod = document.getElementById('fromPeriod').value;
        const toPeriod = document.getElementById('toPeriod').value;

        if (!fromPeriod || !toPeriod) {
            showError('Vui lòng tạo báo cáo trước khi xuất');
            return;
        }

        try {
            const report = await api.getRevenueReport(fromPeriod, toPeriod);
            exportToCSV(report, 'revenue');
        } catch (error) {
            console.error('Error exporting revenue report:', error);
            showError('Không thể xuất báo cáo');
        }
    }

    async function exportArrearsReport() {
        const period = document.getElementById('arrearsPeriod').value;

        try {
            const report = await api.getArrearsReport(period);
            exportToCSV(report, 'arrears');
        } catch (error) {
            console.error('Error exporting arrears report:', error);
            showError('Không thể xuất báo cáo công nợ');
        }
    }

    function exportToCSV(report, type) {
        let csvContent = '';
        let filename = '';

        if (type === 'revenue') {
            filename = `bao-cao-doanh-thu-${new Date().toISOString().slice(0, 10)}.csv`;
            csvContent = 'Tháng,Doanh thu,Số hóa đơn\n';
            report.monthly_breakdown.forEach(month => {
                csvContent += `${month.period},${month.revenue},${month.paid_invoices_count}\n`;
            });
        } else if (type === 'arrears') {
            filename = `bao-cao-cong-no-${new Date().toISOString().slice(0, 10)}.csv`;
            csvContent = 'ID Hóa đơn,Phòng,Người thuê,Email,Kỳ,Số tiền,Trạng thái,Ngày đến hạn,Số ngày quá hạn\n';
            report.unpaid_invoices.forEach(invoice => {
                csvContent += `${invoice.invoice_id},${invoice.room_name},${invoice.tenant_name},${invoice.tenant_email},${invoice.period},${invoice.total},${invoice.status},${invoice.due_date},${invoice.days_overdue}\n`;
            });
        }

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showSuccess(`Đã xuất file ${filename}`);
    }

    // Global functions
    window.sendReminder = function(email, invoiceId) {
        // This would typically send an email reminder
        if (confirm(`Gửi email nhắc nhở thanh toán đến ${email}?`)) {
            // Implement email sending logic here
            showSuccess('Đã gửi email nhắc nhở');
        }
    };

    window.markPaidFromReport = async function(invoiceId) {
        if (!confirm('Xác nhận đánh dấu hóa đơn đã thanh toán?')) return;
        
        try {
            showLoading();
            await api.markInvoicePaid(invoiceId);
            showSuccess('Đã đánh dấu hóa đơn đã thanh toán');
            // Refresh arrears report
            generateArrearsReport();
        } catch (error) {
            console.error('Error marking invoice paid:', error);
            showError(error.message || 'Không thể cập nhật trạng thái hóa đơn');
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
});
