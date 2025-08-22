
// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin page loaded, checking authentication...');
    
    // Debug: Check what's in localStorage
    console.log('Access token:', localStorage.getItem('access_token'));
    console.log('Current user:', localStorage.getItem('currentUser'));
    
    // Check authentication using the existing auth system
    const user = requireAuth(['OWNER']);
    console.log('requireAuth result:', user);
    
    if (!user) {
        console.log('No user returned from requireAuth, should redirect to login');
        return;
    }

    console.log('Admin page loaded for user:', user);

    // Initialize
    loadRooms();
    loadRequests(); 
    loadContracts();    // Event listeners
    document.getElementById('roomForm').addEventListener('submit', handleRoomSubmit);

    // Room management
    async function loadRooms() {
        try {
            console.log('Loading rooms...');
            console.log('Current token:', localStorage.getItem('access_token'));
            
            const rooms = await api.getRooms();
            console.log('Rooms loaded:', rooms);
            displayRooms(rooms);
        } catch (error) {
            console.error('Error loading rooms:', error);
            
            // Check if it's an auth error
            if (error.message && error.message.includes('401')) {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                window.location.href = 'login.html';
                return;
            }
            
            // Display error but don't block the interface
            displayRooms([]);
            console.log('Showing empty room list due to error');
        }
    }

    function displayRooms(rooms) {
        const tbody = document.getElementById('room-tbody');
        tbody.innerHTML = '';

        if (rooms.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Chưa có phòng nào</td></tr>';
            return;
        }

        rooms.forEach(room => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${room.name}</td>
                <td>${room.address || 'Chưa cập nhật'}</td>
                <td>${formatCurrency(room.base_price)}</td>
                <td>
                    <span class="badge ${room.status === 'EMPTY' ? 'success' : room.status === 'RENTED' ? 'warning' : 'secondary'}">
                        ${room.status === 'EMPTY' ? 'Trống' : room.status === 'RENTED' ? 'Đã thuê' : 'Bảo trì'}
                    </span>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn-small" onclick="viewRoom(${room.id})">Xem</button>
                        <button class="btn-small" onclick="editRoom(${room.id})">Sửa</button>
                        <button class="btn-small danger" onclick="deleteRoom(${room.id})">Xóa</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async function handleRoomSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('title').value.trim(),
            address: document.getElementById('location').value.trim(),
            base_price: parseFloat(document.getElementById('price').value) || 0,
            status: document.getElementById('status').value.toUpperCase(),
            detail: document.getElementById('description').value.trim(),
            area_m2: 25.0,  // Default value
            bedrooms: 1,    // Default value  
            bathrooms: 1    // Default value
        };

        if (!formData.name || !formData.address || !formData.base_price) {
            showError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            const roomId = document.getElementById('roomId').value;
            
            if (roomId) {
                await api.updateRoom(roomId, formData);
                showSuccess('Cập nhật phòng thành công');
            } else {
                await api.createRoom(formData);
                showSuccess('Thêm phòng mới thành công');
            }
            
            document.getElementById('roomForm').reset();
            document.getElementById('roomId').value = '';
            loadRooms();
        } catch (error) {
            console.error('Error saving room:', error);
            showError(error.message || 'Không thể lưu thông tin phòng');
        }
    }

    // Contract management (placeholder - extend as needed)
    async function loadRequests() {
        // This would load rental requests if the API exists
        const tbody = document.getElementById('req-tbody');
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Chức năng đang phát triển</td></tr>';
    }

    async function loadContracts() {
        try {
            console.log('Loading contracts...');
            const contracts = await api.getContracts();
            console.log('Contracts loaded:', contracts);
            displayContracts(contracts);
        } catch (error) {
            console.error('Error loading contracts:', error);
            
            // Display empty contracts table
            const tbody = document.getElementById('contract-tbody');
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Đang tải dữ liệu...</td></tr>';
        }
    }

    function displayContracts(contracts) {
        const tbody = document.getElementById('contract-tbody');
        tbody.innerHTML = '';

        if (contracts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Chưa có hợp đồng nào</td></tr>';
            return;
        }

        contracts.forEach(contract => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contract.room ? contract.room.name : 'N/A'}</td>
                <td>${contract.tenant ? contract.tenant.user.first_name + ' ' + contract.tenant.user.last_name : 'N/A'}</td>
                <td>${formatCurrency(contract.monthly_rent)}</td>
                <td>${formatDate(contract.start_date)} → ${contract.end_date ? formatDate(contract.end_date) : 'Không xác định'}</td>
                <td>
                    <span class="badge ${contract.status === 'ACTIVE' ? 'success' : 'secondary'}">
                        ${contract.status === 'ACTIVE' ? 'Hoạt động' : contract.status}
                    </span>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn-small" onclick="viewContract(${contract.id})">Xem</button>
                        ${contract.status === 'ACTIVE' ? 
                            `<button class="btn-small warning" onclick="endContract(${contract.id})">Kết thúc</button>` : 
                            ''
                        }
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Global functions
    window.viewRoom = function(roomId) {
        window.location.href = `room.html?id=${roomId}`;
    };

    window.editRoom = async function(roomId) {
        try {
            const room = await api.getRoom(roomId);
            
            document.getElementById('roomId').value = room.id;
            document.getElementById('title').value = room.name;
            document.getElementById('location').value = room.address;
            document.getElementById('price').value = room.price;
            document.getElementById('status').value = room.status.toLowerCase();
            document.getElementById('description').value = room.description || '';
        } catch (error) {
            console.error('Error loading room:', error);
            showError('Không thể tải thông tin phòng');
        }
    };

    window.deleteRoom = async function(roomId) {
        if (!confirm('Bạn có chắc chắn muốn xóa phòng này?')) {
            return;
        }

        try {
            await api.deleteRoom(roomId);
            showSuccess('Xóa phòng thành công');
            loadRooms();
        } catch (error) {
            console.error('Error deleting room:', error);
            showError(error.message || 'Không thể xóa phòng');
        }
    };

    window.viewContract = function(contractId) {
        // Navigate to contract details
        window.location.href = `contracts.html?id=${contractId}`;
    };

    window.endContract = async function(contractId) {
        if (!confirm('Bạn có chắc chắn muốn kết thúc hợp đồng này?')) {
            return;
        }

        try {
            await api.updateContract(contractId, { 
                status: 'TERMINATED',
                end_date: new Date().toISOString().split('T')[0]
            });
            showSuccess('Đã kết thúc hợp đồng');
            loadContracts();
        } catch (error) {
            console.error('Error ending contract:', error);
            showError(error.message || 'Không thể kết thúc hợp đồng');
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

    function showSuccess(message) {
        alert(message);
    }

    function showError(message) {
        alert('Lỗi: ' + message);
    }
});
