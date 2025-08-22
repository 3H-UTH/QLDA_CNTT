// Room Management Script
let currentEditingRoom = null;
let rooms = [];

document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra quyền truy cập
    const user = requireAuth(); // Tạm thời bỏ kiểm tra role để test
    if (!user) return;
    
    // Kiểm tra role và hiển thị cảnh báo nếu không phải OWNER
    if (user.role !== 'OWNER') {
        showError('Bạn cần có quyền OWNER để quản lý phòng. Role hiện tại: ' + user.role);
        return;
    }

    initializeRoomManagement();
});

async function initializeRoomManagement() {
    try {
        await loadRooms();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing room management:', error);
        showError('Có lỗi xảy ra khi tải dữ liệu');
    }
}

function setupEventListeners() {
    // Add room button
    document.getElementById('btn-add-room').addEventListener('click', showAddRoomModal);
    
    // Modal close buttons
    document.getElementById('close-modal').addEventListener('click', hideRoomModal);
    document.getElementById('cancel-modal').addEventListener('click', hideRoomModal);
    document.getElementById('close-delete-modal').addEventListener('click', hideDeleteModal);
    document.getElementById('cancel-delete').addEventListener('click', hideDeleteModal);
    
    // Form submit
    document.getElementById('room-form').addEventListener('submit', handleRoomSubmit);
    
    // Delete confirmation
    document.getElementById('confirm-delete').addEventListener('click', handleDeleteRoom);
    
    // Search
    document.getElementById('search-rooms').addEventListener('input', handleSearch);
    
    // Image upload preview
    document.getElementById('room-images').addEventListener('change', handleImagesPreview);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const roomModal = document.getElementById('room-modal');
        const deleteModal = document.getElementById('delete-modal');
        if (event.target === roomModal) {
            hideRoomModal();
        }
        if (event.target === deleteModal) {
            hideDeleteModal();
        }
    });
}

async function loadRooms() {
    try {
        showLoading(true);
        
        console.log('Loading rooms from API...');
        
        // Use the new API client instead of direct fetch
        const data = await api.getRooms();
        console.log('Rooms loaded successfully:', data);
        
        rooms = Array.isArray(data) ? data : (data.results || []);
        renderRoomsTable();
    } catch (error) {
        console.error('Error loading rooms:', error);
        showError('Không thể tải danh sách phòng: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function renderRoomsTable() {
    const tbody = document.getElementById('rooms-tbody');
    tbody.innerHTML = '';
    
    if (rooms.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    Chưa có phòng nào. <a href="#" onclick="showAddRoomModal()">Thêm phòng đầu tiên</a>
                </td>
            </tr>
        `;
        return;
    }
    
    rooms.forEach(room => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${room.name || ''}</td>
            <td>${room.area_m2 ? room.area_m2 + ' m²' : '-'}</td>
            <td>${room.bedrooms || 1}</td>
            <td>${room.bathrooms || 1}</td>
            <td>${fmtVND(parseFloat(room.base_price || 0))}</td>
            <td>
                <span class="status-badge status-${(room.status || 'EMPTY').toLowerCase()}">
                    ${getStatusText(room.status || 'EMPTY')}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="editRoom(${room.id})" title="Sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="showDeleteModal(${room.id}, '${(room.name || '').replace(/'/g, "\\'")}' )" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getStatusText(status) {
    const statusMap = {
        'EMPTY': 'Trống',
        'RENTED': 'Đã thuê',
        'MAINT': 'Bảo trì'
    };
    return statusMap[status] || status;
}

function showAddRoomModal() {
    currentEditingRoom = null;
    document.getElementById('modal-title').innerHTML = '<i class="fas fa-plus"></i> Thêm phòng mới';
    resetRoomForm();
    document.getElementById('room-modal').style.display = 'block';
}

function editRoom(roomId) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    currentEditingRoom = room;
    document.getElementById('modal-title').innerHTML = '<i class="fas fa-edit"></i> Sửa thông tin phòng';
    
    // Populate form with room data (with safe defaults)
    document.getElementById('room-name').value = room.name || '';
    document.getElementById('room-area').value = room.area_m2 || '';
    document.getElementById('room-bedrooms').value = room.bedrooms || 1;
    document.getElementById('room-bathrooms').value = room.bathrooms || 1;
    document.getElementById('room-price').value = room.base_price || '';
    document.getElementById('room-address').value = room.address || '';
    document.getElementById('room-status').value = room.status || 'EMPTY';
    document.getElementById('room-detail').value = room.detail || '';
    
    // Populate owner information
    document.getElementById('owner-name').value = room.owner_name || '';
    document.getElementById('owner-phone').value = room.owner_phone || '';
    document.getElementById('owner-email').value = room.owner_email || '';
    
    // Show current images if exist
    const preview = document.getElementById('images-preview');
    preview.innerHTML = '';
    
    if (room.images && Array.isArray(room.images)) {
        // Show all images
        room.images.forEach((image, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.innerHTML = `
                <img src="${image}" alt="Current ${index + 1}">
                ${index === 0 ? '<div class="main-badge">Ảnh chính</div>' : ''}
            `;
            preview.appendChild(imageItem);
        });
    } else if (room.image) {
        // Show single image as main image
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.innerHTML = `
            <img src="${room.image}" alt="Current main">
            <div class="main-badge">Ảnh chính</div>
        `;
        preview.appendChild(imageItem);
    }
    
    // Clear file input
    document.getElementById('room-images').value = '';
    
    document.getElementById('room-modal').style.display = 'block';
}

function resetRoomForm() {
    document.getElementById('room-form').reset();
    document.getElementById('room-bedrooms').value = 1;
    document.getElementById('room-bathrooms').value = 1;
    document.getElementById('room-status').value = 'EMPTY';
    
    // Reset owner information
    document.getElementById('owner-name').value = '';
    document.getElementById('owner-phone').value = '';
    document.getElementById('owner-email').value = '';
    
    // Reset images preview
    const preview = document.getElementById('images-preview');
    if (preview) {
        preview.innerHTML = '';
    }
}

function hideRoomModal() {
    document.getElementById('room-modal').style.display = 'none';
    currentEditingRoom = null;
}

function showDeleteModal(roomId, roomName) {
    currentEditingRoom = { id: roomId };
    document.getElementById('delete-room-name').textContent = roomName;
    document.getElementById('delete-modal').style.display = 'block';
}

function hideDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    currentEditingRoom = null;
}

async function handleRoomSubmit(event) {
    event.preventDefault();
    
    const imageFiles = document.getElementById('room-images').files;
    
    try {
        showLoading(true, currentEditingRoom ? 'Đang cập nhật phòng...' : 'Đang tạo phòng mới...');
        
        // Prepare room data
        const roomData = {
            name: document.getElementById('room-name').value.trim(),
            bedrooms: parseInt(document.getElementById('room-bedrooms').value),
            bathrooms: parseInt(document.getElementById('room-bathrooms').value),
            base_price: parseFloat(document.getElementById('room-price').value),
            address: document.getElementById('room-address').value.trim(),
            status: document.getElementById('room-status').value,
            detail: document.getElementById('room-detail').value.trim(),
            // Add owner information
            owner_name: document.getElementById('owner-name').value.trim(),
            owner_phone: document.getElementById('owner-phone').value.trim(),
            owner_email: document.getElementById('owner-email').value.trim()
        };
        
        // Add area if provided
        const area = parseFloat(document.getElementById('room-area').value);
        if (area) {
            roomData.area_m2 = area;
        }
        
        let result;
        
        // If there are image files, use FormData
        if (imageFiles && imageFiles.length > 0) {
            const formData = new FormData();
            
            // Add all room data to FormData
            Object.keys(roomData).forEach(key => {
                formData.append(key, roomData[key]);
            });
            
            // Add first image as main image
            formData.append('image', imageFiles[0]);
            
            // Convert additional images to base64 and store as JSON string
            if (imageFiles.length > 1) {
                const additionalImages = [];
                for (let i = 1; i < imageFiles.length; i++) {
                    const base64 = await convertFileToBase64(imageFiles[i]);
                    additionalImages.push(base64);
                }
                formData.append('additional_images', JSON.stringify(additionalImages));
            }
            
            if (currentEditingRoom) {
                result = await api.updateRoomWithFile(currentEditingRoom.id, formData);
            } else {
                result = await api.createRoomWithFile(formData);
            }
        } else {
            // No images, use regular JSON API
            if (currentEditingRoom) {
                result = await api.updateRoom(currentEditingRoom.id, roomData);
            } else {
                result = await api.createRoom(roomData);
            }
        }
        
        hideRoomModal();
        await loadRooms();
        showSuccess(currentEditingRoom ? 'Cập nhật phòng thành công!' : 'Thêm phòng thành công!');
        
    } catch (error) {
        console.error('Error saving room:', error);
        showError('Không thể lưu phòng: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Helper function to convert file to base64
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function handleDeleteRoom() {
    if (!currentEditingRoom) return;
    
    try {
        await api.deleteRoom(currentEditingRoom.id);
        
        hideDeleteModal();
        await loadRooms();
        showSuccess('Xóa phòng thành công!');
        
    } catch (error) {
        console.error('Error deleting room:', error);
        showError('Không thể xóa phòng: ' + error.message);
    }
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const filteredRooms = rooms.filter(room => 
        (room.name || '').toLowerCase().includes(searchTerm) ||
        (room.address || '').toLowerCase().includes(searchTerm)
    );
    
    // Temporarily update rooms for rendering
    const originalRooms = rooms;
    rooms = filteredRooms;
    renderRoomsTable();
    rooms = originalRooms;
}

function showLoading(show, message = 'Đang tải...') {
    const loadingElement = document.getElementById('loading');
    const tableContainer = document.getElementById('rooms-table-container');
    
    if (show) {
        loadingElement.innerHTML = `<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> ${message}</div>`;
        loadingElement.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
    } else {
        loadingElement.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'block';
    }
}

function showError(message) {
    // Tạo thông báo lỗi dạng toast
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f8d7da;
        color: #721c24;
        padding: 12px 20px;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 9999;
        max-width: 400px;
    `;
    errorDiv.innerHTML = `
        <strong>Lỗi:</strong> ${message}
        <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 18px; cursor: pointer;">&times;</button>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Tự động ẩn sau 5 giây
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
    
    // Fallback vẫn có alert cho trường hợp khẩn cấp
    console.error('Error:', message);
}

function showSuccess(message) {
    // Tạo thông báo thành công dạng toast
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d4edda;
        color: #155724;
        padding: 12px 20px;
        border: 1px solid #c3e6cb;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 9999;
        max-width: 400px;
    `;
    successDiv.innerHTML = `
        <strong>Thành công:</strong> ${message}
        <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 18px; cursor: pointer;">&times;</button>
    `;
    
    document.body.appendChild(successDiv);
    
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        if (successDiv.parentElement) {
            successDiv.remove();
        }
    }, 3000);
}

// Preview image function used in HTML
function previewImage(input) {
    const file = input.files[0];
    const preview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
    }
}

// Handle multiple images preview
function previewImages(input) {
    const files = Array.from(input.files);
    const preview = document.getElementById('images-preview');
    
    if (files.length === 0) {
        preview.innerHTML = '';
        return;
    }
    
    if (files.length > 10) {
        alert('Tối đa chỉ được chọn 10 ảnh');
        input.value = '';
        return;
    }
    
    preview.innerHTML = '';
    
    files.forEach((file, index) => {
        if (!file.type.startsWith('image/')) {
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}">
                <button type="button" class="remove-btn" onclick="removeImagePreview(this, ${index})" title="Xóa ảnh">
                    <i class="fas fa-times"></i>
                </button>
                ${index === 0 ? '<div class="main-badge">Ảnh chính</div>' : ''}
            `;
            preview.appendChild(imageItem);
        };
        reader.readAsDataURL(file);
    });
}

// Export to global scope for HTML callbacks
window.previewImages = previewImages;

function removeImagePreview(button, index) {
    const input = document.getElementById('room-images');
    const dt = new DataTransfer();
    const files = Array.from(input.files);
    
    // Remove the file at the specified index
    files.splice(index, 1);
    
    // Rebuild the FileList
    files.forEach(file => dt.items.add(file));
    input.files = dt.files;
    
    // Re-render preview
    previewImages(input);
}

// Export to global scope for HTML callbacks
window.removeImagePreview = removeImagePreview;

function handleImagesPreview(event) {
    previewImages(event.target);
}

// Handle image preview (existing function, keep for compatibility)
function handleImagePreview(event) {
    previewImage(event.target);
}

// Upload multiple images
async function uploadImages(files) {
    if (!files || files.length === 0) return [];
    
    const uploadPromises = Array.from(files).map(async (file) => {
        try {
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            return base64;
        } catch (error) {
            console.error('Error processing image:', error);
            return null;
        }
    });
    
    const results = await Promise.all(uploadPromises);
    return results.filter(result => result !== null);
}

// Upload image file (simplified - store as base64 for now)
async function uploadImage(file) {
    if (!file) return null;
    
    try {
        // Convert to base64
        const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        
        // For now, just return the base64 data
        // In production, you'd want to upload to server
        return base64;
    } catch (error) {
        console.error('Image processing failed:', error);
        return null;
    }
}
