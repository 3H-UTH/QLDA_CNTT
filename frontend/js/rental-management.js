document.addEventListener("DOMContentLoaded", async () => {
  const user = requireAuth(["OWNER"]);
  if (!user) return;

  let currentRequestId = null;
  let currentTenantId = null;
  let allRequests = [];
  let allTenants = [];
  let allContracts = [];
  let currentView = 'cards'; // 'cards' or 'table'

  // Initialize tabs
  initializeTabs();
  
  // Load initial data
  await loadAllData();

  // Event listeners
  document.getElementById('statusFilter').addEventListener('change', filterRequests);
  document.getElementById('tenantSearch').addEventListener('input', filterTenants);
  document.getElementById('tenantStatusFilter').addEventListener('change', filterTenants);

  function initializeTabs() {
    // Set up tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.onclick.toString().match(/'(\w+)'/)[1];
        switchTab(tabId);
      });
    });
  }

  // View toggle function
  window.toggleView = function(view) {
    currentView = view;
    
    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[onclick="toggleView('${view}')"]`).classList.add('active');
    
    // Show/hide appropriate containers
    const currentTab = document.querySelector('.tab-content.active').id;
    
    if (currentTab === 'requests-tab') {
      const grid = document.getElementById('requests-grid');
      const table = document.getElementById('requests-table');
      
      if (view === 'cards') {
        grid.style.display = 'grid';
        table.style.display = 'none';
        displayRequestsAsCards(allRequests);
      } else {
        grid.style.display = 'none';
        table.style.display = 'block';
        displayRequests(allRequests);
      }
    } else if (currentTab === 'tenants-tab') {
      const grid = document.getElementById('tenants-grid');
      const table = document.getElementById('tenants-table');
      
      if (view === 'cards') {
        grid.style.display = 'grid';
        table.style.display = 'none';
        displayTenantsAsCards(allTenants);
      } else {
        grid.style.display = 'none';
        table.style.display = 'block';
        displayTenants(allTenants);
      }
    }
  };

  async function loadAllData() {
    try {
      // Load requests (contracts)
      await loadRequests();
      
      // Load tenants and their contracts
      await loadTenants();
      
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Lỗi tải dữ liệu: ' + error.message);
    }
  }

  async function loadRequests() {
    try {
      const grid = document.getElementById('requests-grid');
      const tbody = document.getElementById('requests-tbody');
      
      // Show loading in both views
      grid.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i><p>Đang tải dữ liệu...</p></div>';
      tbody.innerHTML = '<tr><td colspan="5" class="help">Đang tải dữ liệu...</td></tr>';

      // Load all contracts (pending requests are contracts with status PENDING)
      const contractsResponse = await api.getContracts();
      console.log('Contracts response:', contractsResponse);
      
      // Ensure contracts is an array
      const contracts = Array.isArray(contractsResponse) ? contractsResponse : 
                       (contractsResponse && Array.isArray(contractsResponse.results) ? contractsResponse.results : []);
      
      allRequests = contracts || [];
      console.log('Processed requests array:', allRequests);

      // Display in current view
      if (currentView === 'cards') {
        displayRequestsAsCards(allRequests);
      } else {
        displayRequests(allRequests);
      }
      
      updateRequestsStats();
      updateTabBadges();
      
      // Load details for each request
      setTimeout(() => loadRequestsDetails(), 500);

    } catch (error) {
      console.error('Error loading requests:', error);
      const grid = document.getElementById('requests-grid');
      const tbody = document.getElementById('requests-tbody');
      
      grid.innerHTML = `<div class="loading-message"><i class="fas fa-exclamation-triangle"></i><p>Lỗi tải dữ liệu: ${error.message}</p></div>`;
      tbody.innerHTML = `<tr><td colspan="5" class="help" style="color: var(--danger);">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
    }
  }

  async function loadTenants() {
    try {
      const grid = document.getElementById('tenants-grid');
      const tbody = document.getElementById('tenants-tbody');
      
      // Show loading in both views
      grid.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i><p>Đang tải dữ liệu...</p></div>';
      tbody.innerHTML = '<tr><td colspan="5" class="help">Đang tải dữ liệu...</td></tr>';

      // Load all tenants
      const tenantsResponse = await api.getTenants();
      console.log('Tenants response:', tenantsResponse);
      
      // Ensure tenants is an array
      const tenants = Array.isArray(tenantsResponse) ? tenantsResponse :
                     (tenantsResponse && Array.isArray(tenantsResponse.results) ? tenantsResponse.results : []);
                     
      allTenants = tenants || [];
      console.log('Processed tenants array:', allTenants);

      // Load all contracts to get current rentals
      const contractsResponse = await api.getContracts();
      const contracts = Array.isArray(contractsResponse) ? contractsResponse :
                       (contractsResponse && Array.isArray(contractsResponse.results) ? contractsResponse.results : []);
      allContracts = contracts || [];

      // Display in current view
      if (currentView === 'cards') {
        displayTenantsAsCards(allTenants);
      } else {
        displayTenants(allTenants);
      }
      
      updateTenantsStats();
      updateTabBadges();
      
      // Load details for each tenant
      setTimeout(() => loadTenantsDetails(), 500);

    } catch (error) {
      console.error('Error loading tenants:', error);
      const grid = document.getElementById('tenants-grid');
      const tbody = document.getElementById('tenants-tbody');
      
      grid.innerHTML = `<div class="loading-message"><i class="fas fa-exclamation-triangle"></i><p>Lỗi tải dữ liệu: ${error.message}</p></div>`;
      tbody.innerHTML = `<tr><td colspan="5" class="help" style="color: var(--danger);">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
    }
  }

  function displayRequests(requests) {
    const tbody = document.getElementById('requests-tbody');
    
    // Ensure requests is an array
    if (!Array.isArray(requests)) {
      console.warn('displayRequests: requests is not an array:', requests);
      tbody.innerHTML = '<tr><td colspan="7" class="help" style="color: var(--error);">Dữ liệu yêu cầu không đúng định dạng.</td></tr>';
      return;
    }
    
    if (requests.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="help">Chưa có yêu cầu nào.</td></tr>';
      return;
    }

    try {
      const rows = requests.map(request => {
        if (!request || typeof request !== 'object') {
          console.warn('Invalid request object:', request);
          return '';
        }
        return createRequestRow(request);
      }).filter(row => row.trim() !== '');
      
      if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="help">Không có yêu cầu hợp lệ để hiển thị.</td></tr>';
      } else {
        tbody.innerHTML = rows.join('');
      }
    } catch (error) {
      console.error('Error displaying requests:', error);
      tbody.innerHTML = `<tr><td colspan="7" class="help" style="color: var(--error);">Lỗi hiển thị dữ liệu: ${error.message}</td></tr>`;
    }
  }

  function displayTenants(tenants) {
    const tbody = document.getElementById('tenants-tbody');
    
    // Ensure tenants is an array
    if (!Array.isArray(tenants)) {
      console.warn('displayTenants: tenants is not an array:', tenants);
      tbody.innerHTML = '<tr><td colspan="6" class="help" style="color: var(--error);">Dữ liệu người thuê không đúng định dạng.</td></tr>';
      return;
    }
    
    if (tenants.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="help">Chưa có người thuê nào.</td></tr>';
      return;
    }

    try {
      const rows = tenants.map(tenant => {
        if (!tenant || typeof tenant !== 'object') {
          console.warn('Invalid tenant object:', tenant);
          return '';
        }
        return createTenantRow(tenant);
      }).filter(row => row.trim() !== '');
      
      if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="help">Không có người thuê hợp lệ để hiển thị.</td></tr>';
      } else {
        tbody.innerHTML = rows.join('');
      }
    } catch (error) {
      console.error('Error displaying tenants:', error);
      tbody.innerHTML = `<tr><td colspan="6" class="help" style="color: var(--error);">Lỗi hiển thị dữ liệu: ${error.message}</td></tr>`;
    }
  }

  function createRequestRow(request) {
    const statusClass = getStatusClass(request.status);
    const statusText = getStatusText(request.status);
    const createdAt = new Date(request.created_at || Date.now()).toLocaleString('vi-VN');
    
    return `
      <tr data-request-id="${request.id}">
        <td>
          <div class="room-info">
            <strong>${request.room_name || `Phòng #${request.room}`}</strong>
            <div class="room-details" id="room-${request.id}">Đang tải...</div>
          </div>
        </td>
        <td>
          <div class="tenant-info">
            <strong>${request.tenant_name || 'N/A'}</strong>
            <div class="tenant-details" id="request-tenant-${request.id}">Đang tải...</div>
          </div>
        </td>
        <td>
          <div class="contact-info">
            <div><i class="fas fa-envelope"></i> ${request.tenant_email || 'N/A'}</div>
            <div><i class="fas fa-phone"></i> ${request.tenant_phone || 'N/A'}</div>
          </div>
        </td>
        <td>
          <div class="message">
            ${request.notes || 'Không có lời nhắn'}
          </div>
        </td>
        <td>
          <div class="timestamp">
            ${createdAt}
          </div>
        </td>
        <td>
          <span class="badge ${statusClass}">${statusText}</span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="viewRequest(${request.id})">
              <i class="fas fa-eye"></i> Xem
            </button>
            ${request.status === 'PENDING' ? `
              <button class="btn btn-sm btn-success" onclick="quickApprove(${request.id})">
                <i class="fas fa-check"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="quickReject(${request.id})">
                <i class="fas fa-times"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }

  function createTenantRow(tenant) {
    // Find active contracts for this tenant
    const activeContracts = allContracts.filter(c => 
      c.tenant === tenant.id && c.status === 'ACTIVE'
    );
    
    const isActive = activeContracts.length > 0;
    const roomInfo = activeContracts.length > 0 ? 
      activeContracts.map(c => `Phòng ${c.room}`).join(', ') : 
      'Không thuê phòng nào';
    
    return `
      <tr data-tenant-id="${tenant.id}">
        <td>
          <div class="tenant-info">
            <div class="tenant-avatar">
              <i class="fas fa-user-circle"></i>
            </div>
            <div class="tenant-details">
              <strong>${tenant.full_name || 'N/A'}</strong>
              <div class="tenant-meta">
                <span class="badge ${isActive ? 'active' : 'inactive'}">
                  ${isActive ? 'Đang thuê' : 'Không thuê'}
                </span>
              </div>
              <div class="tenant-id">ID: ${tenant.id_number || 'Chưa cập nhật'}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="room-list" id="tenant-rooms-${tenant.id}">
            ${roomInfo}
          </div>
          ${activeContracts.length > 0 ? `
            <div class="rental-period">
              <small class="text-muted">
                Từ: ${activeContracts[0].start_date || 'N/A'}
              </small>
            </div>
          ` : ''}
        </td>
        <td>
          <div class="contact-info">
            <div><i class="fas fa-envelope"></i> ${tenant.email || 'N/A'}</div>
            <div><i class="fas fa-phone"></i> ${tenant.phone || 'N/A'}</div>
            <div><i class="fas fa-map-marker-alt"></i> ${tenant.address || 'Chưa cập nhật'}</div>
          </div>
        </td>
        <td>
          <div class="contract-info">
            ${activeContracts.length > 0 ? `
              <div class="contract-count">${activeContracts.length} hợp đồng</div>
              <div class="contract-total">
                <small class="text-muted">
                  Tổng: ${fmtVND(activeContracts.reduce((sum, c) => sum + (c.monthly_rent || 0), 0))}/tháng
                </small>
              </div>
            ` : `
              <span class="text-muted">Không có hợp đồng</span>
            `}
          </div>
        </td>
        <td>
          <div class="payment-status" id="tenant-payment-${tenant.id}">
            <span class="loading">Đang tải...</span>
          </div>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="viewTenant(${tenant.id})">
              <i class="fas fa-eye"></i> Xem
            </button>
            ${isActive ? `
              <button class="btn btn-sm btn-info" onclick="viewTenantContracts(${tenant.id})">
                <i class="fas fa-file-contract"></i> HĐ
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }

  async function loadRequestsDetails() {
    for (const request of allRequests) {
      try {
        // Load room details
        const room = await api.getRoom(request.room);
        const roomElement = document.getElementById(`room-${request.id}`);
        if (roomElement && room) {
          roomElement.innerHTML = `
            <small>
              <div>${room.address || 'Không có địa chỉ'}</div>
              <div>Giá: ${fmtVND(room.base_price)}/tháng</div>
            </small>
          `;
        }
      } catch (error) {
        console.error(`Error loading room ${request.room}:`, error);
      }

      try {
        // Load tenant details
        const tenant = await api.getTenant(request.tenant);
        const tenantElement = document.getElementById(`request-tenant-${request.id}`);
        if (tenantElement && tenant) {
          tenantElement.innerHTML = `
            <small>
              <div>CCCD: ${tenant.id_number || 'Chưa cập nhật'}</div>
              <div>SĐT: ${tenant.phone || 'Chưa cập nhật'}</div>
            </small>
          `;
        }
      } catch (error) {
        console.error(`Error loading tenant ${request.tenant}:`, error);
      }
    }
  }

  async function loadTenantsDetails() {
    for (const tenant of allTenants) {
      try {
        // Load payment status for active contracts
        const activeContracts = allContracts.filter(c => 
          c.tenant === tenant.id && c.status === 'ACTIVE'
        );
        
        const paymentElement = document.getElementById(`tenant-payment-${tenant.id}`);
        if (paymentElement) {
          if (activeContracts.length > 0) {
            // TODO: Load recent invoices/payments
            paymentElement.innerHTML = `
              <span class="badge success">Đã thanh toán</span>
              <div><small>Cập nhật: ${new Date().toLocaleDateString('vi-VN')}</small></div>
            `;
          } else {
            paymentElement.innerHTML = `<span class="text-muted">Không thuê phòng</span>`;
          }
        }
        
        // Load room details
        const roomElement = document.getElementById(`tenant-rooms-${tenant.id}`);
        if (roomElement && activeContracts.length > 0) {
          const roomDetails = await Promise.all(
            activeContracts.map(async (contract) => {
              try {
                const room = await api.getRoom(contract.room);
                return `<div class="room-item">
                  <strong>${room.name || `Phòng ${contract.room}`}</strong>
                  <small> - ${fmtVND(contract.monthly_rent || room.base_price)}/tháng</small>
                </div>`;
              } catch (error) {
                return `<div class="room-item">Phòng ${contract.room}</div>`;
              }
            })
          );
          roomElement.innerHTML = roomDetails.join('');
        }
        
      } catch (error) {
        console.error(`Error loading tenant details ${tenant.id}:`, error);
      }
    }
  }

  function updateRequestsStats() {
    // Ensure allRequests is an array
    const requests = Array.isArray(allRequests) ? allRequests : [];
    
    const pending = requests.filter(r => r && r.status === 'PENDING').length;
    const approved = requests.filter(r => r && r.status === 'ACTIVE').length;
    const rejected = requests.filter(r => r && r.status === 'ENDED').length;

    const pendingEl = document.getElementById('pendingCount');
    const approvedEl = document.getElementById('approvedCount');
    const rejectedEl = document.getElementById('rejectedCount');
    
    if (pendingEl) pendingEl.textContent = pending;
    if (approvedEl) approvedEl.textContent = approved;
    if (rejectedEl) rejectedEl.textContent = rejected;
  }

  function updateTenantsStats() {
    // Ensure arrays are valid
    const tenants = Array.isArray(allTenants) ? allTenants : [];
    const contracts = Array.isArray(allContracts) ? allContracts : [];
    
    const activeTenants = tenants.filter(t => {
      return t && contracts.some(c => c && c.tenant === t.id && c.status === 'ACTIVE');
    }).length;
    
    const totalTenants = tenants.length;
    
    const monthlyRevenue = contracts
      .filter(c => c && c.status === 'ACTIVE')
      .reduce((sum, c) => sum + (c.monthly_rent || 0), 0);

    const activeEl = document.getElementById('activeTenantCount');
    const totalEl = document.getElementById('totalTenantCount');
    const revenueEl = document.getElementById('monthlyRevenue');
    
    if (activeEl) activeEl.textContent = activeTenants;
    if (totalEl) totalEl.textContent = totalTenants;
    if (revenueEl) revenueEl.textContent = fmtVND(monthlyRevenue);
  }

  function filterRequests() {
    const filter = document.getElementById('statusFilter').value;
    
    // Ensure allRequests is an array
    if (!Array.isArray(allRequests)) {
      console.warn('filterRequests: allRequests is not an array:', allRequests);
      if (currentView === 'cards') {
        displayRequestsAsCards([]);
      } else {
        displayRequests([]);
      }
      return;
    }
    
    let filteredRequests = allRequests;

    if (filter !== 'all') {
      filteredRequests = allRequests.filter(r => r && r.status === filter);
    }

    if (currentView === 'cards') {
      displayRequestsAsCards(filteredRequests);
    } else {
      displayRequests(filteredRequests);
      setTimeout(() => loadRequestsDetails(), 100);
    }
  }

  function filterTenants() {
    const searchTerm = document.getElementById('tenantSearch').value.toLowerCase();
    const statusFilter = document.getElementById('tenantStatusFilter').value;
    
    // Ensure allTenants is an array
    if (!Array.isArray(allTenants)) {
      console.warn('filterTenants: allTenants is not an array:', allTenants);
      if (currentView === 'cards') {
        displayTenantsAsCards([]);
      } else {
        displayTenants([]);
      }
      return;
    }
    
    let filteredTenants = allTenants;

    // Filter by search term
    if (searchTerm) {
      filteredTenants = filteredTenants.filter(t => 
        t && (
          (t.full_name || '').toLowerCase().includes(searchTerm) ||
          (t.email || '').toLowerCase().includes(searchTerm) ||
          (t.phone || '').includes(searchTerm) ||
          (t.id_number || '').includes(searchTerm)
        )
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      // Ensure allContracts is an array
      const contracts = Array.isArray(allContracts) ? allContracts : [];
      
      filteredTenants = filteredTenants.filter(t => {
        if (!t) return false;
        
        const hasActiveContract = contracts.some(c => 
          c && c.tenant === t.id && c.status === 'ACTIVE'
        );
        return statusFilter === 'active' ? hasActiveContract : !hasActiveContract;
      });
    }

    if (currentView === 'cards') {
      displayTenantsAsCards(filteredTenants);
    } else {
      displayTenants(filteredTenants);
      setTimeout(() => loadTenantsDetails(), 100);
    }
  }

  // Helper functions
  function getStatusClass(status) {
    const statusMap = {
      'PENDING': 'pending',
      'ACTIVE': 'approved',
      'ENDED': 'rejected',
      'SUSPENDED': 'suspended'
    };
    return statusMap[status] || 'pending';
  }

  function getStatusText(status) {
    const statusMap = {
      'PENDING': 'Chờ xử lý',
      'ACTIVE': 'Đã chấp nhận',
      'ENDED': 'Đã từ chối',
      'SUSPENDED': 'Tạm dừng'
    };
    return statusMap[status] || status;
  }

  function showError(message) {
    console.error('Error:', message);
    
    // Use showNotification if available, otherwise fallback to alert
    if (typeof showNotification === 'function') {
      const type = message.includes('thành công') ? 'success' : 'error';
      showNotification(message, type);
    } else {
      alert(message);
    }
  }

  // Global functions for buttons
  window.switchTab = function(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(`${tabId}-tab`).classList.add('active');
    
    // Add active class to clicked button
    event.target.closest('.tab-btn').classList.add('active');
    
    // Update view based on current tab and view mode
    if (tabId === 'requests') {
      if (currentView === 'cards') {
        displayRequestsAsCards(allRequests);
      } else {
        displayRequests(allRequests);
      }
    } else if (tabId === 'tenants') {
      if (currentView === 'cards') {
        displayTenantsAsCards(allTenants);
      } else {
        displayTenants(allTenants);
      }
    }
  };

  window.refreshRequests = async function() {
    await loadRequests();
  };

  window.refreshTenants = async function() {
    await loadTenants();
  };

  window.viewRequest = async function(requestId) {
    const request = allRequests.find(r => r.id === requestId);
    if (!request) return;

    currentRequestId = requestId;
    
    try {
      // Load full details
      const room = await api.getRoom(request.room);
      const tenant = await api.getTenant(request.tenant);

      const details = `
        <div class="detail-grid">
          <div class="detail-section">
            <h4><i class="fas fa-home"></i> Thông tin phòng</h4>
            <div class="detail-item">
              <label>Tên phòng:</label>
              <span>${room?.name || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <label>Địa chỉ:</label>
              <span>${room?.address || 'Chưa cập nhật'}</span>
            </div>
            <div class="detail-item">
              <label>Giá thuê:</label>
              <span>${fmtVND(room?.base_price || 0)}/tháng</span>
            </div>
            <div class="detail-item">
              <label>Diện tích:</label>
              <span>${room?.area_m2 || 'N/A'} m²</span>
            </div>
          </div>
          
          <div class="detail-section">
            <h4><i class="fas fa-user"></i> Thông tin người thuê</h4>
            <div class="detail-item">
              <label>Họ tên:</label>
              <span>${tenant?.full_name || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <label>Email:</label>
              <span>${tenant?.email || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <label>Điện thoại:</label>
              <span>${tenant?.phone || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <label>CCCD/CMND:</label>
              <span>${tenant?.id_number || 'Chưa cập nhật'}</span>
            </div>
            <div class="detail-item">
              <label>Địa chỉ:</label>
              <span>${tenant?.address || 'Chưa cập nhật'}</span>
            </div>
            <div class="detail-item">
              <label>Liên hệ khẩn cấp:</label>
              <span>${tenant?.emergency_contact || 'Chưa cập nhật'}</span>
            </div>
          </div>
          
          <div class="detail-section full-width">
            <h4><i class="fas fa-comment"></i> Lời nhắn từ người thuê</h4>
            <div class="message-content">
              ${request.notes || 'Không có lời nhắn'}
            </div>
          </div>
          
          <div class="detail-section full-width">
            <h4><i class="fas fa-info-circle"></i> Thông tin yêu cầu</h4>
            <div class="detail-item">
              <label>Thời gian gửi:</label>
              <span>${new Date(request.created_at || Date.now()).toLocaleString('vi-VN')}</span>
            </div>
            <div class="detail-item">
              <label>Trạng thái:</label>
              <span class="badge ${getStatusClass(request.status)}">${getStatusText(request.status)}</span>
            </div>
          </div>
        </div>
      `;

      document.getElementById('requestDetails').innerHTML = details;
      document.getElementById('modalTitle').textContent = `Chi tiết yêu cầu thuê - Phòng ${room?.name || request.room}`;
      
      // Show/hide action buttons based on status
      const approveBtn = document.getElementById('approveBtn');
      const rejectBtn = document.getElementById('rejectBtn');
      
      if (request.status === 'PENDING') {
        approveBtn.style.display = 'inline-block';
        rejectBtn.style.display = 'inline-block';
      } else {
        approveBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
      }
      
      document.getElementById('requestModal').style.display = 'block';

    } catch (error) {
      console.error('Error loading request details:', error);
      showError('Lỗi tải chi tiết yêu cầu: ' + error.message);
    }
  };

  window.viewTenant = async function(tenantId) {
    const tenant = allTenants.find(t => t.id === tenantId);
    if (!tenant) return;

    currentTenantId = tenantId;
    
    try {
      const activeContracts = allContracts.filter(c => 
        c.tenant === tenantId && c.status === 'ACTIVE'
      );

      let contractsInfo = '';
      if (activeContracts.length > 0) {
        const contractDetails = await Promise.all(
          activeContracts.map(async (contract) => {
            try {
              const room = await api.getRoom(contract.room);
              return `
                <div class="contract-item">
                  <h5>Phòng ${room.name || contract.room}</h5>
                  <div class="contract-details">
                    <div><strong>Giá thuê:</strong> ${fmtVND(contract.monthly_rent || room.base_price)}/tháng</div>
                    <div><strong>Từ ngày:</strong> ${contract.start_date || 'N/A'}</div>
                    <div><strong>Đến ngày:</strong> ${contract.end_date || 'N/A'}</div>
                    <div><strong>Địa chỉ:</strong> ${room.address || 'Chưa cập nhật'}</div>
                  </div>
                </div>
              `;
            } catch (error) {
              return `<div class="contract-item">Lỗi tải thông tin phòng ${contract.room}</div>`;
            }
          })
        );
        contractsInfo = contractDetails.join('');
      } else {
        contractsInfo = '<div class="no-contracts">Không có hợp đồng hiện tại</div>';
      }

      const details = `
        <div class="detail-grid">
          <div class="detail-section">
            <h4><i class="fas fa-user"></i> Thông tin cá nhân</h4>
            <div class="detail-item">
              <label>Họ tên:</label>
              <span>${tenant.full_name || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <label>Email:</label>
              <span>${tenant.email || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <label>Điện thoại:</label>
              <span>${tenant.phone || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <label>CCCD/CMND:</label>
              <span>${tenant.id_number || 'Chưa cập nhật'}</span>
            </div>
            <div class="detail-item">
              <label>Địa chỉ:</label>
              <span>${tenant.address || 'Chưa cập nhật'}</span>
            </div>
            <div class="detail-item">
              <label>Liên hệ khẩn cấp:</label>
              <span>${tenant.emergency_contact || 'Chưa cập nhật'}</span>
            </div>
          </div>
          
          <div class="detail-section full-width">
            <h4><i class="fas fa-file-contract"></i> Hợp đồng hiện tại</h4>
            ${contractsInfo}
          </div>
        </div>
      `;

      document.getElementById('tenantDetails').innerHTML = details;
      document.getElementById('tenantModalTitle').textContent = `Chi tiết người thuê - ${tenant.full_name || 'N/A'}`;
      
      document.getElementById('tenantModal').style.display = 'block';

    } catch (error) {
      console.error('Error loading tenant details:', error);
      showError('Lỗi tải chi tiết người thuê: ' + error.message);
    }
  };

  window.quickApprove = function(requestId) {
    if (confirm('Bạn có chắc chắn muốn chấp nhận yêu cầu này?')) {
      approveRequestById(requestId);
    }
  };

  window.quickReject = function(requestId) {
    if (confirm('Bạn có chắc chắn muốn từ chối yêu cầu này?')) {
      rejectRequestById(requestId);
    }
  };

  window.approveRequest = function() {
    if (currentRequestId) {
      approveRequestById(currentRequestId);
    }
  };

  window.rejectRequest = function() {
    if (currentRequestId) {
      rejectRequestById(currentRequestId);
    }
  };

  async function approveRequestById(requestId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      const endDateStr = endDate.toISOString().split('T')[0];

      await api.updateContract(requestId, {
        status: 'ACTIVE',
        start_date: today,
        end_date: endDateStr
      });

      showError('Đã chấp nhận yêu cầu thuê thành công!');
      closeModal();
      await loadAllData();
      
    } catch (error) {
      console.error('Error approving request:', error);
      showError('Lỗi khi chấp nhận yêu cầu: ' + error.message);
    }
  }

  async function rejectRequestById(requestId) {
    try {
      await api.updateContract(requestId, {
        status: 'ENDED'
      });

      showError('Đã từ chối yêu cầu thuê.');
      closeModal();
      await loadAllData();
      
    } catch (error) {
      console.error('Error rejecting request:', error);
      showError('Lỗi khi từ chối yêu cầu: ' + error.message);
    }
  }

  window.closeModal = function() {
    document.getElementById('requestModal').style.display = 'none';
    currentRequestId = null;
  };

  window.closeTenantModal = function() {
    document.getElementById('tenantModal').style.display = 'none';
    currentTenantId = null;
  };

  window.viewTenantContract = function() {
    // TODO: Navigate to contract management page
    console.log('View tenant contract:', currentTenantId);
  };

  window.viewTenantInvoices = function() {
    // TODO: Navigate to invoice management page
    console.log('View tenant invoices:', currentTenantId);
  };

  window.viewTenantContracts = function(tenantId) {
    viewTenant(tenantId);
  };

  // Cards Display Functions
  function displayRequestsAsCards(requests) {
    const grid = document.getElementById('requests-grid');
    
    if (!Array.isArray(requests) || requests.length === 0) {
      grid.innerHTML = '<div class="loading-message"><i class="fas fa-inbox"></i><p>Chưa có yêu cầu nào.</p></div>';
      return;
    }

    const cards = requests.map(request => createRequestCard(request)).join('');
    grid.innerHTML = cards;
  }

  function displayTenantsAsCards(tenants) {
    const grid = document.getElementById('tenants-grid');
    
    if (!Array.isArray(tenants) || tenants.length === 0) {
      grid.innerHTML = '<div class="loading-message"><i class="fas fa-users"></i><p>Chưa có người thuê nào.</p></div>';
      return;
    }

    const cards = tenants.map(tenant => createTenantCard(tenant)).join('');
    grid.innerHTML = cards;
  }

  function createRequestCard(request) {
    const statusInfo = getStatusInfo(request.status);
    const createdAt = formatDate(request.created_at);
    
    return `
      <div class="request-card" onclick="viewRequest(${request.id})">
        <div class="card-header">
          <div>
            <h4 class="card-title">${request.room_name || `Phòng #${request.room}`}</h4>
            <p class="card-subtitle">${request.tenant_name || 'N/A'}</p>
          </div>
          <span class="status-badge status-${statusInfo.class}">${statusInfo.text}</span>
        </div>
        
        <div class="card-content">
          <div class="info-row">
            <i class="info-icon fas fa-envelope"></i>
            <span class="info-text">${request.tenant_email || 'Chưa có email'}</span>
          </div>
          <div class="info-row">
            <i class="info-icon fas fa-phone"></i>
            <span class="info-text">${request.tenant_phone || 'Chưa có SĐT'}</span>
          </div>
          <div class="info-row">
            <i class="info-icon fas fa-calendar"></i>
            <span class="info-text">${createdAt}</span>
          </div>
          ${request.notes ? `
            <div class="info-row">
              <i class="info-icon fas fa-comment"></i>
              <span class="info-text">${request.notes.length > 50 ? request.notes.substring(0, 50) + '...' : request.notes}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="card-actions">
          ${request.status === 'PENDING' ? `
            <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); quickApprove(${request.id})">
              <i class="fas fa-check"></i> Chấp nhận
            </button>
            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); quickReject(${request.id})">
              <i class="fas fa-times"></i> Từ chối
            </button>
          ` : `
            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewRequest(${request.id})">
              <i class="fas fa-eye"></i> Xem chi tiết
            </button>
          `}
        </div>
      </div>
    `;
  }

  function createTenantCard(tenant) {
    const activeContracts = allContracts.filter(c => 
      c.tenant === tenant.id && c.status === 'ACTIVE'
    );
    
    const totalRooms = activeContracts.length;
    const monthlyRevenue = activeContracts.reduce((sum, c) => sum + (c.monthly_rent || 0), 0);
    
    return `
      <div class="tenant-card" onclick="viewTenant(${tenant.id})">
        <div class="card-header">
          <div>
            <h4 class="card-title">${tenant.full_name || tenant.username}</h4>
            <p class="card-subtitle">${totalRooms > 0 ? `Đang thuê ${totalRooms} phòng` : 'Không thuê phòng'}</p>
          </div>
          <span class="status-badge ${totalRooms > 0 ? 'status-active' : 'status-ended'}">
            ${totalRooms > 0 ? 'Đang thuê' : 'Đã nghỉ'}
          </span>
        </div>
        
        <div class="card-content">
          <div class="info-row">
            <i class="info-icon fas fa-envelope"></i>
            <span class="info-text">${tenant.email || 'Chưa có email'}</span>
          </div>
          <div class="info-row">
            <i class="info-icon fas fa-phone"></i>
            <span class="info-text">${tenant.phone || 'Chưa có SĐT'}</span>
          </div>
          ${totalRooms > 0 ? `
            <div class="info-row">
              <i class="info-icon fas fa-home"></i>
              <span class="info-text">${activeContracts.map(c => c.room_name || `Phòng #${c.room}`).join(', ')}</span>
            </div>
            <div class="info-row">
              <i class="info-icon fas fa-dollar-sign"></i>
              <span class="info-value">${monthlyRevenue.toLocaleString('vi-VN')}₫/tháng</span>
            </div>
          ` : ''}
        </div>
        
        <div class="card-actions">
          <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewTenant(${tenant.id})">
            <i class="fas fa-eye"></i> Chi tiết
          </button>
          ${totalRooms > 0 ? `
            <button class="btn btn-sm btn-info" onclick="event.stopPropagation(); viewTenantInvoices()">
              <i class="fas fa-file-invoice"></i> Hóa đơn
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  function getStatusInfo(status) {
    switch(status) {
      case 'PENDING':
        return { class: 'pending', text: 'Chờ xử lý' };
      case 'ACTIVE':
        return { class: 'active', text: 'Đã chấp nhận' };
      case 'ENDED':
        return { class: 'ended', text: 'Đã từ chối' };
      default:
        return { class: 'pending', text: 'Không xác định' };
    }
  }

  function updateTabBadges() {
    const pendingCount = allRequests.filter(r => r.status === 'PENDING').length;
    const activeTenantsCount = allTenants.filter(t => {
      return allContracts.some(c => c.tenant === t.id && c.status === 'ACTIVE');
    }).length;
    
    document.getElementById('pending-badge').textContent = pendingCount;
    document.getElementById('tenants-badge').textContent = activeTenantsCount;
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Close modals when clicking outside
  window.onclick = function(event) {
    const requestModal = document.getElementById('requestModal');
    const tenantModal = document.getElementById('tenantModal');
    
    if (event.target === requestModal) {
      closeModal();
    }
    if (event.target === tenantModal) {
      closeTenantModal();
    }
  };
});
