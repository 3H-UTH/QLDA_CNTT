// Meter Reading Management JavaScript
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
    const meterReadingForm = document.getElementById('meterReadingForm');
    const contractSelect = document.getElementById('contractSelect');
    const filterContract = document.getElementById('filterContract');
    const readingTbody = document.getElementById('reading-tbody');

    // Input elements for calculations
    const elecPrevInput = document.getElementById('elecPrev');
    const elecCurrInput = document.getElementById('elecCurr');
    const waterPrevInput = document.getElementById('waterPrev');
    const waterCurrInput = document.getElementById('waterCurr');
    const elecPriceInput = document.getElementById('elecPrice');
    const waterPriceInput = document.getElementById('waterPrice');

    // Display elements
    const elecUsageDisplay = document.getElementById('elecUsage');
    const waterUsageDisplay = document.getElementById('waterUsage');
    const elecCostDisplay = document.getElementById('elecCost');
    const waterCostDisplay = document.getElementById('waterCost');

    // Load initial data
    loadContracts();
    loadMeterReadings();

    // Event listeners
    meterReadingForm.addEventListener('submit', handleSaveMeterReading);
    document.getElementById('filterBtn').addEventListener('click', handleFilter);
    document.getElementById('clearFilterBtn').addEventListener('click', clearFilters);

    // Add calculation listeners
    [elecPrevInput, elecCurrInput, elecPriceInput].forEach(input => {
        input.addEventListener('input', calculateElecUsage);
    });
    [waterPrevInput, waterCurrInput, waterPriceInput].forEach(input => {
        input.addEventListener('input', calculateWaterUsage);
    });

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

    async function loadMeterReadings(params = {}) {
        try {
            showLoading();
            const response = await api.getMeterReadings(params);
            const readings = response.results || response;
            
            displayMeterReadings(readings);
        } catch (error) {
            console.error('Error loading meter readings:', error);
            showError('Không thể tải danh sách chỉ số điện nước');
        } finally {
            hideLoading();
        }
    }

    function displayMeterReadings(readings) {
        readingTbody.innerHTML = '';

        if (!readings || readings.length === 0) {
            readingTbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Không có chỉ số nào</td></tr>';
            return;
        }

        readings.forEach(reading => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${reading.contract}</td>
                <td>${reading.contract_name || 'N/A'}</td>
                <td>${reading.period}</td>
                <td>${reading.elec_prev} → ${reading.elec_curr} (${reading.kwh || (reading.elec_curr - reading.elec_prev)})</td>
                <td>${reading.water_prev} → ${reading.water_curr} (${reading.m3 || (reading.water_curr - reading.water_prev)})</td>
                <td>${formatCurrency(reading.elec_cost || ((reading.elec_curr - reading.elec_prev) * reading.elec_price))}</td>
                <td>${formatCurrency(reading.water_cost || ((reading.water_curr - reading.water_prev) * reading.water_price))}</td>
                <td>${formatDate(reading.created_at)}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn-small" onclick="editReading(${reading.id})">Sửa</button>
                        <button class="btn-small danger" onclick="deleteReading(${reading.id})">Xóa</button>
                    </div>
                </td>
            `;
            readingTbody.appendChild(row);
        });
    }

    async function handleSaveMeterReading(e) {
        e.preventDefault();
        
        try {
            showLoading();
            const formData = new FormData(meterReadingForm);
            const readingData = {
                contract: parseInt(formData.get('contract')),
                period: formData.get('period'),
                elec_prev: parseInt(formData.get('elec_prev')),
                elec_curr: parseInt(formData.get('elec_curr')),
                water_prev: parseInt(formData.get('water_prev')),
                water_curr: parseInt(formData.get('water_curr')),
                elec_price: parseFloat(formData.get('elec_price')),
                water_price: parseFloat(formData.get('water_price'))
            };

            // Validation
            if (readingData.elec_curr < readingData.elec_prev) {
                throw new Error('Chỉ số điện mới không được nhỏ hơn chỉ số cũ');
            }
            if (readingData.water_curr < readingData.water_prev) {
                throw new Error('Chỉ số nước mới không được nhỏ hơn chỉ số cũ');
            }

            const readingId = document.getElementById('readingId').value;
            if (readingId) {
                await api.updateMeterReading(readingId, readingData);
                showSuccess('Cập nhật chỉ số thành công');
            } else {
                await api.createMeterReading(readingData);
                showSuccess('Lưu chỉ số thành công');
            }
            
            meterReadingForm.reset();
            document.getElementById('readingId').value = '';
            resetCalculations();
            loadMeterReadings();
        } catch (error) {
            console.error('Error saving meter reading:', error);
            showError(error.message || 'Không thể lưu chỉ số điện nước');
        } finally {
            hideLoading();
        }
    }

    function handleFilter() {
        const params = {};
        
        const contract = document.getElementById('filterContract').value;
        const period = document.getElementById('filterPeriod').value;
        
        if (contract) params.contract = contract;
        if (period) params.period = period;
        
        loadMeterReadings(params);
    }

    function clearFilters() {
        document.getElementById('filterContract').value = '';
        document.getElementById('filterPeriod').value = '';
        loadMeterReadings();
    }

    function calculateElecUsage() {
        const prev = parseFloat(elecPrevInput.value) || 0;
        const curr = parseFloat(elecCurrInput.value) || 0;
        const price = parseFloat(elecPriceInput.value) || 0;
        
        const usage = Math.max(0, curr - prev);
        const cost = usage * price;
        
        elecUsageDisplay.textContent = `${usage} kWh`;
        elecCostDisplay.textContent = formatCurrency(cost);
    }

    function calculateWaterUsage() {
        const prev = parseFloat(waterPrevInput.value) || 0;
        const curr = parseFloat(waterCurrInput.value) || 0;
        const price = parseFloat(waterPriceInput.value) || 0;
        
        const usage = Math.max(0, curr - prev);
        const cost = usage * price;
        
        waterUsageDisplay.textContent = `${usage} m³`;
        waterCostDisplay.textContent = formatCurrency(cost);
    }

    function resetCalculations() {
        elecUsageDisplay.textContent = '-- kWh';
        waterUsageDisplay.textContent = '-- m³';
        elecCostDisplay.textContent = '-- VND';
        waterCostDisplay.textContent = '-- VND';
    }

    // Global functions for meter reading actions
    window.editReading = async function(id) {
        try {
            showLoading();
            const reading = await api.getMeterReading(id);
            
            // Populate form with reading data
            document.getElementById('readingId').value = reading.id;
            document.getElementById('contractSelect').value = reading.contract;
            document.getElementById('period').value = reading.period;
            document.getElementById('elecPrev').value = reading.elec_prev;
            document.getElementById('elecCurr').value = reading.elec_curr;
            document.getElementById('waterPrev').value = reading.water_prev;
            document.getElementById('waterCurr').value = reading.water_curr;
            document.getElementById('elecPrice').value = reading.elec_price;
            document.getElementById('waterPrice').value = reading.water_price;
            
            // Calculate and display usage
            calculateElecUsage();
            calculateWaterUsage();
            
            // Scroll to form
            meterReadingForm.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error loading meter reading:', error);
            showError('Không thể tải thông tin chỉ số');
        } finally {
            hideLoading();
        }
    };

    window.deleteReading = async function(id) {
        if (!confirm('Xác nhận xóa chỉ số điện nước? Hành động này không thể hoàn tác.')) return;
        
        try {
            showLoading();
            await api.deleteMeterReading(id);
            showSuccess('Đã xóa chỉ số điện nước');
            loadMeterReadings();
        } catch (error) {
            console.error('Error deleting meter reading:', error);
            showError(error.message || 'Không thể xóa chỉ số điện nước');
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
