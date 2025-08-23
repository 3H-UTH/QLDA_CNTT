// Dashboard for tenant - displays rental requests and contracts
document.addEventListener("DOMContentLoaded", async () => {
  const user = requireAuth(["TENANT"]);
  if (!user) return;

  let allRequests = [];
  let allContracts = [];

  // Load initial data
  await loadAllData();

  async function loadAllData() {
    try {
      await Promise.all([
        loadRentalRequests(),
        loadContracts()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showToast('Có lỗi xảy ra khi tải dữ liệu', 'error');
    }
  }

  async function loadRentalRequests() {
    try {
      console.log('Loading rental requests for tenant...');
      
      // Load rental requests for current user
      const response = await api.getRentalRequests();
      console.log('Rental Requests response:', response);
      
      // Ensure data is an array
      allRequests = Array.isArray(response) ? response : 
                   (response && Array.isArray(response.results) ? response.results : []);
      
      // Filter to only show requests from current user
      allRequests = allRequests.filter(request => request.tenant === user.id);
      
      renderRentalRequests();
    } catch (error) {
      console.error('Error loading rental requests:', error);
      document.getElementById('req-tbody').innerHTML = 
        '<tr><td colspan="6" class="error">Lỗi tải yêu cầu xem nhà: ' + error.message + '</td></tr>';
    }
  }

  async function loadContracts() {
    try {
      console.log('Loading contracts for tenant...');
      
      // Load contracts for current user
      const response = await api.getContracts();
      console.log('Contracts response:', response);
      
      // Ensure data is an array
      allContracts = Array.isArray(response) ? response : 
                    (response && Array.isArray(response.results) ? response.results : []);
      
      // Filter to only show contracts from current user
      allContracts = allContracts.filter(contract => contract.tenant === user.id);
      
      renderContracts();
    } catch (error) {
      console.error('Error loading contracts:', error);
      document.getElementById('contract-tbody').innerHTML = 
        '<tr><td colspan="6" class="error">Lỗi tải hợp đồng: ' + error.message + '</td></tr>';
    }
  }

  function renderRentalRequests() {
    const tbody = document.getElementById('req-tbody');
    
    if (!allRequests || allRequests.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Bạn chưa có yêu cầu xem nhà nào.</td></tr>';
      return;
    }

    tbody.innerHTML = allRequests.map(request => createRequestRow(request)).join('');
    
    // Load room details for each request
    loadRequestDetails();
  }

  function renderContracts() {
    const grid = document.getElementById('contracts-grid');
    const table = document.getElementById('contracts-table');
    const tbody = document.getElementById('contract-tbody');
    
    if (!allContracts || allContracts.length === 0) {
      grid.innerHTML = `
        <div class="empty-contracts">
          <i class="fas fa-file-contract"></i>
          <h3>Chưa có hợp đồng</h3>
          <p>Bạn chưa có hợp đồng thuê nhà nào. Hãy gửi yêu cầu xem nhà để có thể thuê phòng.</p>
        </div>
      `;
      table.style.display = 'none';
      return;
    }

    // Show grid by default, hide table
    grid.style.display = 'grid';
    table.style.display = 'none';

    grid.innerHTML = allContracts.map(contract => createContractCard(contract)).join('');
    
    // Also populate table as fallback
    tbody.innerHTML = allContracts.map(contract => createContractRow(contract)).join('');
    
    // Load contract details
    loadContractDetails();
  }

  function createContractCard(contract) {
    const statusInfo = getContractStatusInfo(contract.status);
    const startDate = new Date(contract.start_date || Date.now()).toLocaleDateString('vi-VN');
    const endDate = new Date(contract.end_date || Date.now()).toLocaleDateString('vi-VN');
    const monthlyRent = parseFloat(contract.monthly_rent || 0);
    const deposit = parseFloat(contract.deposit || 0);
    
    return `
      <div class="contract-card" data-contract-id="${contract.id}">
        <div class="contract-card-header">
          <div class="contract-info">
            <h3>
              <i class="fas fa-file-contract"></i>
              <div id="contract-room-${contract.id}">Phòng #${contract.room}</div>
            </h3>
            <div class="contract-id">Hợp đồng #${contract.id}</div>
          </div>
          <div class="contract-status">
            <span class="status-badge status-${statusInfo.class}">${statusInfo.text}</span>
          </div>
        </div>
        
        <div class="contract-period">
          <div class="contract-period-label">Thời gian hợp đồng</div>
          <div class="contract-period-dates">
            <span><i class="fas fa-calendar-alt"></i> ${startDate}</span>
            <span><i class="fas fa-arrow-right"></i></span>
            <span><i class="fas fa-calendar-times"></i> ${endDate}</span>
          </div>
        </div>

        <div class="contract-room-info" id="contract-room-info-${contract.id}">
          <div class="room-name">
            <i class="fas fa-home"></i>
            <span>Đang tải thông tin phòng...</span>
          </div>
        </div>

        <div class="contract-details-grid">
          <div class="contract-detail">
            <div class="contract-detail-label">
              <i class="fas fa-money-bill-wave"></i>
              Tiền thuê/tháng
            </div>
            <div class="contract-detail-value money">${fmtVND(monthlyRent)}</div>
          </div>
          <div class="contract-detail">
            <div class="contract-detail-label">
              <i class="fas fa-piggy-bank"></i>
              Tiền cọc
            </div>
            <div class="contract-detail-value money">${fmtVND(deposit)}</div>
          </div>
        </div>

        <div class="contract-actions">
          ${contract.rental_request ? `
            <a href="#" class="contract-link" onclick="viewRequestDetails(${contract.rental_request}); return false;">
              <i class="fas fa-link"></i> 
              Yêu cầu #${contract.rental_request}
            </a>
          ` : '<span></span>'}
          
          <button class="contract-view-btn" onclick="viewContractDetails(${contract.id})">
            <i class="fas fa-eye"></i>
            Xem chi tiết
          </button>
        </div>
      </div>
    `;
  }

  function createRequestRow(request) {
    const statusInfo = getRequestStatusInfo(request.status);
    const createdAt = new Date(request.created_at || Date.now()).toLocaleString('vi-VN');
    const viewingTime = new Date(request.viewing_time || Date.now()).toLocaleString('vi-VN');
    
    return `
      <tr data-request-id="${request.id}">
        <td>
          <div class="room-info" id="request-room-${request.id}">
            <strong>Phòng #${request.room}</strong>
            <div class="room-details">Đang tải...</div>
          </div>
        </td>
        <td>
          <div class="notes">
            ${request.notes ? (request.notes.length > 50 ? request.notes.substring(0, 50) + '...' : request.notes) : 'Không có lời nhắn'}
          </div>
        </td>
        <td>${createdAt}</td>
        <td>${viewingTime}</td>
        <td>
          <span class="status-badge status-${statusInfo.class}">${statusInfo.text}</span>
        </td>
        <td>
          <div class="action-buttons">
            ${request.status === 'PENDING' ? `
              <button class="btn btn-sm btn-danger" onclick="cancelRequest(${request.id})" title="Hủy yêu cầu">
                <i class="fas fa-times"></i> Hủy
              </button>
            ` : ''}
            <button class="btn btn-sm btn-primary" onclick="viewRequestDetails(${request.id})" title="Xem chi tiết">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function createContractRow(contract) {
    const statusInfo = getContractStatusInfo(contract.status);
    const startDate = new Date(contract.start_date || Date.now()).toLocaleDateString('vi-VN');
    const endDate = new Date(contract.end_date || Date.now()).toLocaleDateString('vi-VN');
    const monthlyRent = parseFloat(contract.monthly_rent || 0);
    
    return `
      <tr data-contract-id="${contract.id}">
        <td>
          <div class="room-info" id="contract-room-${contract.id}">
            <strong>Phòng #${contract.room}</strong>
            <div class="room-details">Đang tải...</div>
          </div>
        </td>
        <td>
          <strong>${fmtVND(monthlyRent)}</strong>
        </td>
        <td>
          <div class="contract-period">
            <div><strong>Từ:</strong> ${startDate}</div>
            <div><strong>Đến:</strong> ${endDate}</div>
          </div>
        </td>
        <td>
          <span class="status-badge status-${statusInfo.class}">${statusInfo.text}</span>
        </td>
        <td>
          ${contract.rental_request ? `
            <button class="btn btn-sm btn-info" onclick="viewRequestDetails(${contract.rental_request})" title="Xem yêu cầu gốc">
              <i class="fas fa-link"></i> Yêu cầu #${contract.rental_request}
            </button>
          ` : 'Không có'}
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="viewContractDetails(${contract.id})" title="Xem hợp đồng">
              <i class="fas fa-file-contract"></i> Xem
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  // Load detailed room information for requests
  async function loadRequestDetails() {
    for (const request of allRequests) {
      try {
        const room = await api.getRoom(request.room);
        const roomElement = document.getElementById(`request-room-${request.id}`);
        if (roomElement && room) {
          roomElement.innerHTML = `
            <strong>${room.name || `Phòng #${request.room}`}</strong>
            <div class="room-details">
              <small>
                <div><i class="fas fa-map-marker-alt"></i> ${room.address || 'Chưa có địa chỉ'}</div>
                <div><i class="fas fa-money-bill-wave"></i> ${fmtVND(parseFloat(room.base_price || 0))}/tháng</div>
              </small>
            </div>
          `;
        }
      } catch (error) {
        console.error(`Error loading room ${request.room}:`, error);
      }
    }
  }

  // Load detailed room information for contracts
  async function loadContractDetails() {
    for (const contract of allContracts) {
      try {
        const room = await api.getRoom(contract.room);
        
        // Update card view
        const roomElement = document.getElementById(`contract-room-${contract.id}`);
        const roomInfoElement = document.getElementById(`contract-room-info-${contract.id}`);
        
        if (roomElement && room) {
          roomElement.textContent = room.name || `Phòng #${contract.room}`;
        }
        
        if (roomInfoElement && room) {
          roomInfoElement.innerHTML = `
            <div class="room-name">
              <i class="fas fa-home"></i>
              <span>${room.name || `Phòng #${contract.room}`}</span>
            </div>
            <div class="room-address">
              <i class="fas fa-map-marker-alt"></i>
              ${room.address || 'Chưa có địa chỉ'}
            </div>
          `;
        }
        
        // Update table view (fallback) - for the old table row
        const tableRoomElement = document.querySelector(`tr[data-contract-id="${contract.id}"] .room-info`);
        if (tableRoomElement && room) {
          tableRoomElement.innerHTML = `
            <strong>${room.name || `Phòng #${contract.room}`}</strong>
            <div class="room-details">
              <small>
                <div><i class="fas fa-map-marker-alt"></i> ${room.address || 'Chưa có địa chỉ'}</div>
                <div><i class="fas fa-bed"></i> ${room.bedrooms || 1} phòng ngủ, ${room.bathrooms || 1} phòng tắm</div>
              </small>
            </div>
          `;
        }
      } catch (error) {
        console.error(`Error loading room ${contract.room}:`, error);
        
        // Update with error state
        const roomInfoElement = document.getElementById(`contract-room-info-${contract.id}`);
        if (roomInfoElement) {
          roomInfoElement.innerHTML = `
            <div class="room-name">
              <i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i>
              <span>Không thể tải thông tin phòng</span>
            </div>
          `;
        }
      }
    }
  }

  // Helper functions for status display
  function getRequestStatusInfo(status) {
    switch(status) {
      case 'PENDING':
        return { class: 'pending', text: 'Chờ xử lý' };
      case 'ACCEPTED':
        return { class: 'active', text: 'Đã chấp nhận' };
      case 'DECLINED':
        return { class: 'ended', text: 'Đã từ chối' };
      case 'CANCELED':
        return { class: 'canceled', text: 'Đã hủy' };
      default:
        return { class: 'pending', text: 'Không xác định' };
    }
  }

  function getContractStatusInfo(status) {
    switch(status) {
      case 'ACTIVE':
        return { class: 'active', text: 'Đang hiệu lực' };
      case 'ENDED':
        return { class: 'ended', text: 'Đã kết thúc' };
      case 'SUSPENDED':
        return { class: 'suspended', text: 'Tạm dừng' };
      default:
        return { class: 'pending', text: 'Không xác định' };
    }
  }

  // Toast notification system
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
      color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
      padding: 12px 20px;
      border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 9999;
      max-width: 400px;
      animation: slideIn 0.3s ease;
    `;
    
    toast.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span><i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer; margin-left: 10px;">&times;</button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  // Global functions for button actions
  window.cancelRequest = async function(requestId) {
    if (confirm('Bạn có chắc chắn muốn hủy yêu cầu xem nhà này?')) {
      try {
        await api.cancelRentalRequest(requestId);
        showToast('Đã hủy yêu cầu xem nhà thành công!', 'success');
        await loadRentalRequests();
      } catch (error) {
        console.error('Error canceling request:', error);
        showToast('Lỗi khi hủy yêu cầu: ' + error.message, 'error');
      }
    }
  };

  window.viewRequestDetails = function(requestId) {
    const request = allRequests.find(r => r.id === requestId);
    if (request) {
      // You can implement a modal or navigate to a detailed page
      alert(`Chi tiết yêu cầu #${requestId}:\n\n` +
            `Trạng thái: ${getRequestStatusInfo(request.status).text}\n` +
            `Thời gian gửi: ${new Date(request.created_at).toLocaleString('vi-VN')}\n` +
            `Thời gian xem nhà: ${new Date(request.viewing_time).toLocaleString('vi-VN')}\n` +
            `Lời nhắn: ${request.notes || 'Không có'}`);
    }
  };

  window.viewContractDetails = async function(contractId) {
    try {
      const contract = allContracts.find(c => c.id === contractId);
      if (!contract) {
        showToast('Không tìm thấy hợp đồng', 'error');
        return;
      }

      // Load additional data
      const [room, tenant] = await Promise.all([
        api.getRoom(contract.room),
        api.getTenant(contract.tenant)
      ]);

      showContractDetailsModal(contract, room, tenant);
    } catch (error) {
      console.error('Error loading contract details:', error);
      showToast('Có lỗi xảy ra khi tải chi tiết hợp đồng', 'error');
    }
  };

  function showContractDetailsModal(contract, room, tenant) {
    const modal = document.getElementById('contractModal');
    const content = document.getElementById('contractDetailsContent');
    
    if (!modal || !content) {
      console.error('Contract modal elements not found');
      showToast('Không tìm thấy modal element', 'error');
      return;
    }
    
    const startDate = new Date(contract.start_date).toLocaleDateString('vi-VN');
    const endDate = new Date(contract.end_date).toLocaleDateString('vi-VN');
    const createdDate = new Date(contract.created_at).toLocaleDateString('vi-VN');
    
    const statusInfo = getContractStatusInfo(contract.status);
    
    // Get tenant initials for avatar - safely handle missing data
    const firstName = tenant.first_name || '';
    const lastName = tenant.last_name || '';
    const username = tenant.username || '';
    
    const tenantInitials = firstName && lastName 
      ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
      : username.charAt(0).toUpperCase();
    
    const tenantDisplayName = firstName && lastName 
      ? `${firstName} ${lastName}` 
      : (tenant.full_name || username);
    
    // Update modal title
    const modalTitle = document.getElementById('contractModalTitle');
    if (modalTitle) {
      modalTitle.innerHTML = `<i class="fas fa-file-contract"></i> Hợp đồng #${contract.id} - ${statusInfo.text} - ${startDate} đến ${endDate}`;
    }
    
    content.innerHTML = `
      <div class="contract-view-body">
        <div class="contract-grid">
          <!-- Left Column: Basic Info -->
          <div class="contract-left-col">
            <!-- Financial Information -->
            <div class="info-card">
              <h3 class="card-title">
                <i class="fas fa-money-bill-wave"></i>
                Thông tin tài chính
              </h3>
              <div class="info-rows">
                <div class="info-row">
                  <span class="label">Tiền thuê/tháng:</span>
                  <span class="value money">${fmtVND(parseFloat(contract.monthly_rent || 0))}</span>
                </div>
                <div class="info-row">
                  <span class="label">Tiền cọc:</span>
                  <span class="value money">${fmtVND(parseFloat(contract.deposit || 0))}</span>
                </div>
                <div class="info-row">
                  <span class="label">Chu kỳ thanh toán:</span>
                  <span class="value">${contract.billing_cycle || 'MONTHLY'}</span>
                </div>
              </div>
            </div>

            <!-- Contract Information -->
            <div class="info-card">
              <h3 class="card-title">
                <i class="fas fa-file-contract"></i>
                Thông tin hợp đồng
              </h3>
              <div class="info-rows">
                <div class="info-row">
                  <span class="label">Ngày ký:</span>
                  <span class="value">${createdDate}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ngày bắt đầu:</span>
                  <span class="value">${startDate}</span>
                </div>
                <div class="info-row">
                  <span class="label">Ngày kết thúc:</span>
                  <span class="value">${endDate}</span>
                </div>
              </div>
            </div>

            ${contract.notes ? `
              <div class="info-card">
                <h3 class="card-title">
                  <i class="fas fa-sticky-note"></i>
                  Ghi chú
                </h3>
                <div class="notes-content">
                  ${contract.notes}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Right Column: Room & Tenant -->
          <div class="contract-right-col">
            <!-- Room Information -->
            <div class="info-card room-card">
              <h3 class="card-title">
                <i class="fas fa-home"></i>
                Thông tin phòng
              </h3>
              <div class="room-content">
                <div class="room-header-compact">
                  ${room.image ? 
                    `<div class="room-image-wrapper">
                       <img src="${room.image}" alt="${room.name}" class="room-thumb">
                     </div>` :
                    `<div class="room-image-wrapper">
                       <div class="room-thumb-placeholder">
                         <i class="fas fa-image"></i>
                       </div>
                     </div>`
                  }
                  <div class="room-info-compact">
                    <h4 class="room-name">${room.name || `Phòng #${contract.room}`}</h4>
                    <p class="room-address">
                      <i class="fas fa-map-marker-alt"></i>
                      ${room.address || 'Chưa có địa chỉ'}
                    </p>
                  </div>
                </div>
                <div class="room-details-compact">
                  <div class="room-detail-item">
                    <i class="fas fa-expand-arrows-alt"></i>
                    <span>${room.area_m2 || 'N/A'} m²</span>
                  </div>
                  <div class="room-detail-item">
                    <i class="fas fa-bed"></i>
                    <span>${room.bedrooms || 1} phòng ngủ</span>
                  </div>
                  <div class="room-detail-item">
                    <i class="fas fa-bath"></i>
                    <span>${room.bathrooms || 1} phòng tắm</span>
                  </div>
                </div>
                ${room.detail ? `
                  <div class="room-description">
                    <p>${room.detail}</p>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Tenant Information -->
            <div class="info-card tenant-card">
              <h3 class="card-title">
                <i class="fas fa-user"></i>
                Thông tin người thuê
              </h3>
              <div class="tenant-content">
                <div class="tenant-profile">
                  <div class="tenant-avatar-compact">
                    ${tenantInitials}
                  </div>
                  <div class="tenant-info-compact">
                    <h4 class="tenant-name">${tenantDisplayName}</h4>
                    <div class="tenant-contacts">
                      ${tenant.email ? `
                        <div class="contact-item">
                          <i class="fas fa-envelope"></i>
                          <span>${tenant.email}</span>
                        </div>
                      ` : ''}
                      ${tenant.phone ? `
                        <div class="contact-item">
                          <i class="fas fa-phone"></i>
                          <span>${tenant.phone}</span>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Show download button if contract image exists
    const downloadBtn = document.getElementById('downloadContractBtn');
    if (contract.contract_image && downloadBtn) {
      downloadBtn.style.display = 'inline-flex';
      downloadBtn.innerHTML = '<i class="fas fa-download"></i> Tải ảnh hợp đồng';
      downloadBtn.onclick = () => downloadContractImage(contract.contract_image, `hop-dong-${contract.id}`);
    } else if (downloadBtn) {
      downloadBtn.style.display = 'none';
    }
    
    modal.style.display = 'block';
  }

  // Helper functions for contract modal
  window.closeContractModal = function() {
    document.getElementById('contractModal').style.display = 'none';
  };

  window.openImageLightbox = function(imageSrc) {
    // Create lightbox if not exists
    let lightbox = document.getElementById('imageLightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'imageLightbox';
      lightbox.className = 'image-lightbox';
      lightbox.innerHTML = `
        <div class="lightbox-content">
          <span class="lightbox-close" onclick="closeImageLightbox()">&times;</span>
          <img class="lightbox-image" id="lightboxImage" src="" alt="Contract Image">
        </div>
      `;
      document.body.appendChild(lightbox);
      
      // Close on background click
      lightbox.onclick = function(e) {
        if (e.target === lightbox) {
          closeImageLightbox();
        }
      };
    }
    
    document.getElementById('lightboxImage').src = imageSrc;
    lightbox.style.display = 'block';
  };

  window.closeImageLightbox = function() {
    const lightbox = document.getElementById('imageLightbox');
    if (lightbox) {
      lightbox.style.display = 'none';
    }
  };

  window.downloadContractImage = function(imageUrl, filename) {
    try {
      // Create a temporary link for downloading
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename + '.jpg';
      link.target = '_blank';
      link.style.display = 'none';
      
      // Add to DOM, click, then remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      showToast('Đang tải ảnh hợp đồng...', 'success');
    } catch (error) {
      console.error('Error downloading image:', error);
      showToast('Lỗi khi tải ảnh: ' + error.message, 'error');
    }
  };

  // Close modal when clicking outside
  window.onclick = function(event) {
    const contractModal = document.getElementById('contractModal');
    if (event.target === contractModal) {
      closeContractModal();
    }
  };

  // Refresh functions
  window.refreshRequests = async function() {
    await loadRentalRequests();
  };

  window.refreshContracts = async function() {
    await loadContracts();
  };
});
