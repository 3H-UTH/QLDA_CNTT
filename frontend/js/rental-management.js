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
      grid.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i><p>Đang tải dữ liệu yêu cầu xem nhà...</p></div>';
      tbody.innerHTML = '<tr><td colspan="7" class="help">Đang tải dữ liệu yêu cầu xem nhà...</td></tr>';

      // Luôn tải danh sách hợp đồng mới nhất trước
      console.log('Tải danh sách hợp đồng...');
      const contractsResponse = await api.getContracts();
      const contracts = Array.isArray(contractsResponse) ? contractsResponse :
                       (contractsResponse && Array.isArray(contractsResponse.results) ? 
                        contractsResponse.results : []);
      allContracts = contracts || [];
      console.log('Đã tải', allContracts.length, 'hợp đồng');
      console.log('Chi tiết hợp đồng:', allContracts);
      
      // Log cấu trúc dữ liệu hợp đồng để debug
      if (allContracts.length > 0) {
        console.log('Cấu trúc hợp đồng đầu tiên:', allContracts[0]);
        console.log('Các keys của hợp đồng:', Object.keys(allContracts[0]));
        
        // Tìm hợp đồng ACTIVE
        const activeContracts = allContracts.filter(c => c.status === 'ACTIVE');
        console.log('Số hợp đồng ACTIVE:', activeContracts.length);
        if (activeContracts.length > 0) {
          console.log('Hợp đồng ACTIVE đầu tiên:', activeContracts[0]);
        }
      }
      
      // Tải yêu cầu xem nhà từ API mới
      const rentalRequestsResponse = await api.getRentalRequests();
      console.log('Rental Requests response:', rentalRequestsResponse);
      
      // Đảm bảo dữ liệu là một mảng
      const rentalRequests = Array.isArray(rentalRequestsResponse) ? rentalRequestsResponse : 
                       (rentalRequestsResponse && Array.isArray(rentalRequestsResponse.results) ? 
                        rentalRequestsResponse.results : []);
      
      console.log('Chi tiết rental requests:', rentalRequests);
      
      console.log('Kiểm tra và cập nhật trạng thái các yêu cầu...');
      // Cập nhật trạng thái của yêu cầu dựa trên hợp đồng
      const updatedRequests = rentalRequests.map(request => {
        console.log(`Kiểm tra request #${request.id}:`, request);
        
        // Thay đổi logic: map theo room và tenant thay vì request ID
        const hasActiveContract = allContracts.some(contract => {
          console.log(`So sánh contract:`, contract);
          console.log(`Contract fields:`, Object.keys(contract));
          
          // Kiểm tra xem contract có cùng room và tenant với request không
          const roomMatch = contract.room === request.room && contract.status === 'ACTIVE';
          const tenantMatch = contract.tenant === request.tenant && contract.status === 'ACTIVE';
          const bothMatch = contract.room === request.room && contract.tenant === request.tenant && contract.status === 'ACTIVE';
          
          console.log(`Request room: ${request.room}, tenant: ${request.tenant}`);
          console.log(`Contract room: ${contract.room}, tenant: ${contract.tenant}, status: ${contract.status}`);
          console.log(`Room match: ${roomMatch}, Tenant match: ${tenantMatch}, Both match: ${bothMatch}`);
          
          return bothMatch;
        });
        
        // Nếu có hợp đồng ACTIVE, đánh dấu yêu cầu là CONTRACTED
        if (hasActiveContract) {
          console.log(`Yêu cầu #${request.id} đã có hợp đồng ACTIVE, đánh dấu là CONTRACTED`);
          return {...request, displayStatus: 'CONTRACTED'};
        }
        
        return request;
      });
      
      // Lưu tất cả yêu cầu vào biến toàn cục
      allRequests = updatedRequests || [];
      console.log('Processed rental requests array:', allRequests);
      
      // Kiểm tra xem có dữ liệu không
      if (allRequests.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle"></i><p>Chưa có yêu cầu xem nhà nào.</p></div>';
        tbody.innerHTML = '<tr><td colspan="7" class="help">Chưa có yêu cầu xem nhà nào.</td></tr>';
      } else {
        // Display in current view
        if (currentView === 'cards') {
          displayRequestsAsCards(allRequests);
        } else {
          displayRequests(allRequests);
        }
      }
      
      updateRequestsStats();
      updateTabBadges();
      
      // Load details for each request
      if (allRequests.length > 0) {
        setTimeout(() => loadRequestsDetails(), 500);
      }

    } catch (error) {
      console.error('Error loading requests:', error);
      const grid = document.getElementById('requests-grid');
      const tbody = document.getElementById('requests-tbody');
      
      grid.innerHTML = `<div class="loading-message error"><i class="fas fa-exclamation-triangle"></i><p>Lỗi tải dữ liệu: ${error.message}</p></div>`;
      tbody.innerHTML = `<tr><td colspan="7" class="help" style="color: var(--danger);">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
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
    // Validate request object
    if (!request || !request.id) {
      console.warn('Invalid request object in createRequestRow:', request);
      return '';
    }

    // Try to safely extract data with default values
    // Kiểm tra hợp đồng ACTIVE theo room và tenant
    const activeContract = allContracts.find(c => {
      // Map theo room và tenant thay vì request ID
      return c.room === request.room && c.tenant === request.tenant && c.status === 'ACTIVE';
    });
    
    // Sử dụng displayStatus nếu có, hoặc kiểm tra hợp đồng ACTIVE
    const status = activeContract ? 'CONTRACTED' : (request.displayStatus || request.status || 'UNKNOWN');
    const statusClass = getStatusClass(status);
    const statusText = getStatusText(status);
    const createdAt = new Date(request.created_at || Date.now()).toLocaleString('vi-VN');
    const viewingTime = new Date(request.viewing_time || Date.now()).toLocaleString('vi-VN');
    
    // Kiểm tra xem yêu cầu này có hợp đồng ACTIVE không
    const hasActiveContract = !!activeContract;
    
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
            <div><i class="fas fa-calendar"></i> ${createdAt}</div>
            <div><i class="fas fa-clock"></i> Hẹn xem: ${viewingTime}</div>
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
            ${hasActiveContract ? `
              <button class="btn btn-sm btn-info" onclick="viewContractForRequest(${request.id})" title="Xem hợp đồng">
                <i class="fas fa-file-contract"></i> Xem HĐ
              </button>
              <button class="btn btn-sm btn-danger" onclick="cancelContract(${request.id})" title="Hủy hợp đồng">
                <i class="fas fa-ban"></i> Hủy HĐ
              </button>
            ` : request.status === 'PENDING' ? `
              <button class="btn btn-sm btn-success" onclick="quickApprove(${request.id})" title="Chấp nhận">
                <i class="fas fa-check"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="quickReject(${request.id})" title="Từ chối">
                <i class="fas fa-times"></i>
              </button>
              <button class="btn btn-sm btn-warning" onclick="createContract(${request.id})" title="Lập hợp đồng">
                <i class="fas fa-file-contract"></i> HĐ
              </button>
            ` : request.status === 'ACCEPTED' ? `
              <button class="btn btn-sm btn-warning" onclick="createContract(${request.id})" title="Lập hợp đồng">
                <i class="fas fa-file-contract"></i> HĐ
              </button>
              <button class="btn btn-sm btn-danger" onclick="cancelRequest(${request.id})" title="Hủy yêu cầu">
                <i class="fas fa-ban"></i> Hủy
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
        // Kiểm tra xem request có tồn tại và có thuộc tính room không
        if (!request || !request.room) {
          console.warn('Invalid request object:', request);
          continue;
        }

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
        console.error(`Error loading room ${request?.room}:`, error);
      }

      try {
        // Kiểm tra xem request có tồn tại và có thuộc tính tenant không
        if (!request || !request.tenant) {
          console.warn('Invalid request object or missing tenant:', request);
          continue;
        }

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
        console.error(`Error loading tenant ${request?.tenant}:`, error);
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
    
    // Debug logging
    console.log('Updating request stats with requests:', requests);
    console.log('Request statuses:', requests.map(r => r?.status));
    
    // Tính toán stats với logic cải thiện
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let contracted = 0;
    
    requests.forEach(request => {
      if (!request) return;
      
      // Kiểm tra xem request có hợp đồng ACTIVE không theo room và tenant
      const hasActiveContract = allContracts.some(c => {
        return c.room === request.room && c.tenant === request.tenant && c.status === 'ACTIVE';
      });
      
      if (hasActiveContract) {
        contracted++;
      } else {
        switch (request.status) {
          case 'PENDING':
            pending++;
            break;
          case 'ACCEPTED':
            approved++;
            break;
          case 'DECLINED':
          case 'REJECTED':
          case 'CANCELED':
            rejected++;
            break;
        }
      }
    });

    console.log('Stats: pending:', pending, 'approved:', approved, 'rejected:', rejected, 'contracted:', contracted);

    const pendingEl = document.getElementById('pendingCount');
    const approvedEl = document.getElementById('approvedCount');
    const rejectedEl = document.getElementById('rejectedCount');
    const contractedEl = document.getElementById('contractedCount');
    
    if (pendingEl) pendingEl.textContent = pending;
    if (approvedEl) approvedEl.textContent = approved;
    if (rejectedEl) rejectedEl.textContent = rejected;
    if (contractedEl) contractedEl.textContent = contracted;
    
    // Update tab badges
    updateTabBadges();
  }

  function updateTenantsStats() {
    // Ensure arrays are valid
    const tenants = Array.isArray(allTenants) ? allTenants : [];
    const contracts = Array.isArray(allContracts) ? allContracts : [];
    
    const activeTenants = tenants.filter(t => {
      return t && contracts.some(c => c && c.tenant === t.id && c.status === 'ACTIVE');
    }).length;
    
    const totalTenants = tenants.length;
    
    // Lọc và debug các hợp đồng đang hoạt động
    const activeContracts = contracts.filter(c => c && c.status === 'ACTIVE');
    console.log('Active contracts:', activeContracts);
    
    // Tính tổng thu nhập hàng tháng một cách an toàn hơn
    let monthlyRevenue = 0;
    for (const contract of activeContracts) {
      console.log('Contract monthly_rent:', contract.monthly_rent, typeof contract.monthly_rent);
      const rent = parseFloat(contract.monthly_rent) || 0;
      monthlyRevenue += rent;
    }
    console.log('Total monthly revenue calculated:', monthlyRevenue);

    const activeEl = document.getElementById('activeTenantCount');
    const totalEl = document.getElementById('totalTenantCount');
    const revenueEl = document.getElementById('monthlyRevenue');
    
    console.log('Monthly Revenue before formatting:', monthlyRevenue);
    console.log('Monthly Revenue type:', typeof monthlyRevenue);
    
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
      if (filter === 'CONTRACTED') {
        // Show requests that have an ACTIVE contract theo room và tenant
        filteredRequests = allRequests.filter(r => {
          if (!r) return false;
          return allContracts.some(c => {
            return c.room === r.room && c.tenant === r.tenant && c.status === 'ACTIVE';
          });
        });
      } else {
        // Show requests by status, excluding those with ACTIVE contracts
        filteredRequests = allRequests.filter(r => {
          if (!r) return false;
          
          // Exclude if has active contract theo room và tenant
          const hasActiveContract = allContracts.some(c => {
            return c.room === r.room && c.tenant === r.tenant && c.status === 'ACTIVE';
          });
          if (hasActiveContract) return false;
          
          return r.status === filter;
        });
      }
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
      'ACCEPTED': 'approved',
      'DECLINED': 'rejected',
      'CANCELED': 'canceled',
      'ACTIVE': 'approved', // for backward compatibility
      'ENDED': 'rejected',  // for backward compatibility
      'REJECTED': 'rejected',
      'SUSPENDED': 'suspended',
      'CONTRACTED': 'success', // Trạng thái cho yêu cầu đã có hợp đồng ACTIVE
      'UNKNOWN': 'pending'
    };
    return statusMap[status] || 'pending';
  }

  function getStatusText(status) {
    const statusMap = {
      'PENDING': 'Chờ xử lý',
      'ACCEPTED': 'Đã chấp nhận',
      'DECLINED': 'Đã từ chối',
      'CANCELED': 'Đã hủy',
      'ACTIVE': 'Đã chấp nhận', // for backward compatibility
      'ENDED': 'Đã từ chối',     // for backward compatibility
      'REJECTED': 'Đã từ chối',
      'SUSPENDED': 'Tạm dừng',
      'CONTRACTED': 'Đã lập hợp đồng', // Nhãn cho yêu cầu đã có hợp đồng ACTIVE
      'UNKNOWN': 'Không xác định'
    };
    return statusMap[status] || 'Không xác định';
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

  // Quick action functions
  window.quickApprove = async function(requestId) {
    try {
      await api.acceptRentalRequest(requestId);
      showToast('Đã chấp nhận yêu cầu xem nhà!', 'success');
      await loadAllData();
    } catch (error) {
      console.error('Error accepting request:', error);
      showToast('Lỗi khi chấp nhận yêu cầu: ' + error.message, 'error');
    }
  };

  window.quickReject = async function(requestId) {
    if (confirm('Bạn có chắc chắn muốn từ chối yêu cầu này?')) {
      try {
        await api.declineRentalRequest(requestId);
        showToast('Đã từ chối yêu cầu xem nhà!', 'success');
        await loadAllData();
      } catch (error) {
        console.error('Error declining request:', error);
        showToast('Lỗi khi từ chối yêu cầu: ' + error.message, 'error');
      }
    }
  };

  window.createContract = async function(requestId) {
    const request = allRequests.find(r => r.id === requestId);
    if (!request) {
      showToast('Không tìm thấy yêu cầu xem nhà', 'error');
      return;
    }

    // Allow contract creation from both PENDING and ACCEPTED requests
    if (request.status !== 'PENDING' && request.status !== 'ACCEPTED') {
      showToast('Chỉ có thể tạo hợp đồng từ yêu cầu chờ xử lý hoặc đã được chấp nhận', 'error');
      return;
    }

    try {
      // Load room and tenant details for contract
      const room = await api.getRoom(request.room);
      const tenant = await api.getTenant(request.tenant);

      // Show contract creation modal
      showContractCreationModal(request, room, tenant);
    } catch (error) {
      console.error('Error loading details for contract creation:', error);
      showToast('Lỗi khi tải thông tin: ' + error.message, 'error');
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
              <span class="badge ${getStatusClass(request.displayStatus || request.status)}">${getStatusText(request.displayStatus || request.status)}</span>
              ${request.displayStatus ? `<small class="text-muted">(${getStatusText(request.status)} → ${getStatusText(request.displayStatus)})</small>` : ''}
            </div>
          </div>
        </div>
      `;

      document.getElementById('requestDetails').innerHTML = details;
      document.getElementById('modalTitle').textContent = `Chi tiết yêu cầu thuê - Phòng ${room?.name || request.room}`;
      
      // Show/hide action buttons based on status
      const approveBtn = document.getElementById('approveBtn');
      const rejectBtn = document.getElementById('rejectBtn');
      const contractBtn = document.getElementById('contractBtn');
      
      // Kiểm tra xem yêu cầu này có hợp đồng ACTIVE không theo room và tenant
      const activeContract = allContracts.find(c => {
        return c.room === request.room && c.tenant === request.tenant && c.status === 'ACTIVE';
      });
      const hasActiveContract = !!activeContract;
      
      if (hasActiveContract) {
        // Đã có hợp đồng ACTIVE
        if (approveBtn) approveBtn.style.display = 'none';
        if (rejectBtn) rejectBtn.style.display = 'none';
        if (contractBtn) {
          contractBtn.innerHTML = '<i class="fas fa-file-contract"></i> Xem hợp đồng';
          contractBtn.onclick = function() { viewContractForRequest(request.id); };
          contractBtn.style.display = 'inline-block';
        }
        // Thêm nút hủy hợp đồng
        const cancelBtn = document.getElementById('rejectBtn');
        if (cancelBtn) {
          cancelBtn.innerHTML = '<i class="fas fa-ban"></i> Hủy hợp đồng';
          cancelBtn.onclick = function() { cancelContract(request.id); };
          cancelBtn.style.display = 'inline-block';
        }
      } else if (request.status === 'PENDING') {
        if (approveBtn) approveBtn.style.display = 'inline-block';
        if (rejectBtn) {
          rejectBtn.innerHTML = '<i class="fas fa-times"></i> Từ chối';
          rejectBtn.onclick = rejectRequest;
          rejectBtn.style.display = 'inline-block';
        }
        if (contractBtn) {
          contractBtn.innerHTML = '<i class="fas fa-file-contract"></i> Lập hợp đồng';
          contractBtn.onclick = function() { createContract(request.id); };
          contractBtn.style.display = 'inline-block';
        }
      } else if (request.status === 'ACCEPTED') {
        if (approveBtn) approveBtn.style.display = 'none';
        if (rejectBtn) {
          rejectBtn.innerHTML = '<i class="fas fa-ban"></i> Hủy yêu cầu';
          rejectBtn.onclick = function() { cancelRequest(request.id); };
          rejectBtn.style.display = 'inline-block';
        }
        if (contractBtn) {
          contractBtn.innerHTML = '<i class="fas fa-file-contract"></i> Lập hợp đồng';
          contractBtn.onclick = function() { createContract(request.id); };
          contractBtn.style.display = 'inline-block';
        }
      } else {
        if (approveBtn) approveBtn.style.display = 'none';
        if (rejectBtn) rejectBtn.style.display = 'none';
        if (contractBtn) contractBtn.style.display = 'none';
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

  window.approveRequest = function() {
    if (currentRequestId) {
      quickApprove(currentRequestId);
    }
  };

  window.rejectRequest = function() {
    if (currentRequestId) {
      quickReject(currentRequestId);
    }
  };

  window.closeModal = function() {
    document.getElementById('requestModal').style.display = 'none';
    currentRequestId = null;
  };

  window.closeTenantModal = function() {
    document.getElementById('tenantModal').style.display = 'none';
    currentTenantId = null;
  };

  window.closeTenantContractModal = function() {
    document.getElementById('tenantContractModal').style.display = 'none';
  };

  window.viewTenantContract = async function() {
    if (!currentTenantId) {
      showToast('Không tìm thấy thông tin người thuê', 'error');
      return;
    }

    try {
      // Find active contracts for this tenant
      const tenantContracts = allContracts.filter(c => 
        c.tenant === currentTenantId && c.status === 'ACTIVE'
      );

      if (tenantContracts.length === 0) {
        showToast('Người thuê này chưa có hợp đồng nào đang hoạt động', 'warning');
        return;
      }

      // Get the most recent active contract
      const contract = tenantContracts.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )[0];

      // Load additional data
      const [room, tenant] = await Promise.all([
        api.getRoom(contract.room),
        api.getTenant(contract.tenant)
      ]);

      showTenantContractDetailsModal(contract, room, tenant);
    } catch (error) {
      console.error('Error loading tenant contract:', error);
      showToast('Có lỗi xảy ra khi tải hợp đồng', 'error');
    }
  };

  function showTenantContractDetailsModal(contract, room, tenant) {
    const modal = document.getElementById('tenantContractModal');
    const content = document.getElementById('tenantContractDetailsContent');
    
    if (!modal || !content) {
      console.error('Tenant contract modal elements not found');
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
    const modalTitle = document.getElementById('tenantContractModalTitle');
    if (modalTitle) {
      modalTitle.innerHTML = `<i class="fas fa-file-contract"></i> Hợp đồng #${contract.id} - ${statusInfo.text} - ${startDate} đến ${endDate}`;
    }
    
    content.innerHTML = `
      <div class="contract-details">
        <!-- Body Section -->
        <div class="contract-view-body">
          <div class="contract-grid">
            <!-- Left Column -->
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
                    <span class="value">${contract.billing_cycle === 'MONTHLY' ? 'Hàng tháng' : contract.billing_cycle}</span>
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

            <!-- Right Column -->
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
                        ${tenant.address ? `
                          <div class="contact-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${tenant.address}</span>
                          </div>
                        ` : ''}
                        ${tenant.emergency_contact ? `
                          <div class="contact-item">
                            <i class="fas fa-phone-alt"></i>
                            <span>${tenant.emergency_contact}</span>
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
      </div>
    `;
    
    // Show download button if contract image exists
    const downloadBtn = document.getElementById('downloadTenantContractBtn');
    if (contract.contract_image && downloadBtn) {
      downloadBtn.style.display = 'inline-flex';
      downloadBtn.innerHTML = '<i class="fas fa-download"></i> Tải ảnh hợp đồng';
      downloadBtn.onclick = () => downloadContractImage(contract.contract_image, `hop-dong-${contract.id}`);
    } else if (downloadBtn) {
      downloadBtn.style.display = 'none';
    }
    
    modal.style.display = 'block';
  }

  // Helper functions for tenant contract modal
  window.openTenantImageLightbox = function(imageSrc) {
    // Create lightbox if not exists
    let lightbox = document.getElementById('tenantImageLightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'tenantImageLightbox';
      lightbox.className = 'image-lightbox';
      lightbox.innerHTML = `
        <div class="lightbox-content">
          <span class="lightbox-close" onclick="closeTenantImageLightbox()">&times;</span>
          <img class="lightbox-image" id="tenantLightboxImage" src="" alt="Contract Image">
        </div>
      `;
      document.body.appendChild(lightbox);
      
      // Close on background click
      lightbox.onclick = function(e) {
        if (e.target === lightbox) {
          closeTenantImageLightbox();
        }
      };
    }
    
    document.getElementById('tenantLightboxImage').src = imageSrc;
    lightbox.style.display = 'block';
  };

  window.closeTenantImageLightbox = function() {
    const lightbox = document.getElementById('tenantImageLightbox');
    if (lightbox) {
      lightbox.style.display = 'none';
    }
  };

  window.downloadTenantContract = function() {
    // Implementation for downloading contract
    showToast('Tính năng tải xuống sẽ được cập nhật sau', 'info');
  };

  window.editContract = function() {
    // Implementation for editing contract
    showToast('Tính năng chỉnh sửa hợp đồng sẽ được cập nhật sau', 'info');
  };

  window.uploadContractImage = function(contractId) {
    // Implementation for uploading contract image
    showToast('Tính năng tải lên hình ảnh sẽ được cập nhật sau', 'info');
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

  // Helper function to convert file to base64
  function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

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
    
    // Kiểm tra đầu vào
    if (!Array.isArray(requests)) {
      console.warn('displayRequestsAsCards: requests is not an array:', requests);
      grid.innerHTML = '<div class="loading-message error"><i class="fas fa-exclamation-circle"></i><p>Dữ liệu yêu cầu không đúng định dạng.</p></div>';
      return;
    }
    
    if (requests.length === 0) {
      grid.innerHTML = '<div class="loading-message empty"><i class="fas fa-inbox"></i><p>Chưa có yêu cầu xem nhà nào.</p></div>';
      return;
    }

    try {
      const cards = requests.map(request => {
        if (!request || typeof request !== 'object') {
          console.warn('Invalid request object:', request);
          return '';
        }
        return createRequestCard(request);
      }).filter(card => card.trim() !== '');
      
      if (cards.length === 0) {
        grid.innerHTML = '<div class="loading-message empty"><i class="fas fa-inbox"></i><p>Không có yêu cầu hợp lệ để hiển thị.</p></div>';
      } else {
        grid.innerHTML = cards.join('');
      }
    } catch (error) {
      console.error('Error displaying request cards:', error);
      grid.innerHTML = `<div class="loading-message error"><i class="fas fa-exclamation-triangle"></i><p>Lỗi hiển thị dữ liệu: ${error.message}</p></div>`;
    }
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
    // Validate request object
    if (!request || !request.id) {
      console.warn('Invalid request object in createRequestCard:', request);
      return '';
    }

    // Try to safely extract data with default values
    // Kiểm tra hợp đồng ACTIVE theo room và tenant
    const activeContract = allContracts.find(c => {
      // Map theo room và tenant thay vì request ID
      return c.room === request.room && c.tenant === request.tenant && c.status === 'ACTIVE';
    });
    
    const status = activeContract ? 'CONTRACTED' : (request.displayStatus || request.status || 'UNKNOWN');
    const statusInfo = getStatusInfo(status);
    const createdAt = formatDate(request.created_at || new Date());
    const viewingTime = formatDate(request.viewing_time || request.created_at || new Date());
    
    // Kiểm tra xem yêu cầu này có hợp đồng ACTIVE không
    const hasActiveContract = !!activeContract;
    
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
            <span class="info-text">Yêu cầu: ${createdAt}</span>
          </div>
          <div class="info-row">
            <i class="info-icon fas fa-clock"></i>
            <span class="info-text">Hẹn xem: ${viewingTime}</span>
          </div>
          ${request.notes ? `
            <div class="info-row">
              <i class="info-icon fas fa-comment"></i>
              <span class="info-text">${request.notes.length > 50 ? request.notes.substring(0, 50) + '...' : request.notes}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="card-actions">
          ${hasActiveContract ? `
            <button class="btn btn-sm btn-info" onclick="event.stopPropagation(); viewContractForRequest(${request.id})">
              <i class="fas fa-file-contract"></i> Xem hợp đồng
            </button>
            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); cancelContract(${request.id})">
              <i class="fas fa-ban"></i> Hủy hợp đồng
            </button>
          ` : request.status === 'PENDING' ? `
            <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); quickApprove(${request.id})">
              <i class="fas fa-check"></i> Chấp nhận
            </button>
            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); quickReject(${request.id})">
              <i class="fas fa-times"></i> Từ chối
            </button>
            <button class="btn btn-sm btn-warning" onclick="event.stopPropagation(); createContract(${request.id})">
              <i class="fas fa-file-contract"></i> Lập hợp đồng
            </button>
          ` : request.status === 'ACCEPTED' ? `
            <button class="btn btn-sm btn-warning" onclick="event.stopPropagation(); createContract(${request.id})">
              <i class="fas fa-file-contract"></i> Lập hợp đồng
            </button>
            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); cancelRequest(${request.id})">
              <i class="fas fa-ban"></i> Hủy
            </button>
            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewRequest(${request.id})">
              <i class="fas fa-eye"></i> Xem chi tiết
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
      case 'ACCEPTED':
        return { class: 'active', text: 'Đã chấp nhận' };
      case 'DECLINED':
        return { class: 'ended', text: 'Đã từ chối' };
      case 'CANCELED':
        return { class: 'canceled', text: 'Đã hủy' };
      case 'CONTRACTED':
        return { class: 'success', text: 'Đã lập hợp đồng' };
      case 'ACTIVE': // backward compatibility
        return { class: 'active', text: 'Đã chấp nhận' };
      case 'ENDED': // backward compatibility
        return { class: 'ended', text: 'Đã từ chối' };
      case 'REJECTED':
        return { class: 'ended', text: 'Đã từ chối' };
      case 'SUSPENDED':
        return { class: 'suspended', text: 'Tạm dừng' };
      case 'UNKNOWN':
        return { class: 'pending', text: 'Không xác định' };
      default:
        return { class: 'pending', text: 'Không xác định' };
    }
  }

  function updateTabBadges() {
    // Count only pending requests that don't have active contracts theo room và tenant
    const pendingCount = allRequests.filter(r => {
      if (!r || r.status !== 'PENDING') return false;
      
      // Exclude requests that already have active contracts
      const hasActiveContract = allContracts.some(c => {
        return c.room === r.room && c.tenant === r.tenant && c.status === 'ACTIVE';
      });
      return !hasActiveContract;
    }).length;
    
    const activeTenantsCount = allTenants.filter(t => {
      return allContracts.some(c => c.tenant === t.id && c.status === 'ACTIVE');
    }).length;
    
    const pendingBadge = document.getElementById('pending-badge');
    const tenantsBadge = document.getElementById('tenants-badge');
    
    if (pendingBadge) pendingBadge.textContent = pendingCount;
    if (tenantsBadge) tenantsBadge.textContent = activeTenantsCount;
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

  // Show/hide loading states
  function showLoading(show, message = 'Đang tải...') {
    // Implementation depends on your loading component
    console.log(show ? message : 'Loading complete');
  }

  // Toast notification system
  function showToast(message, type = 'info') {
    // Create toast notification
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

  // Contract creation modal
  function showContractCreationModal(request, room, tenant) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('contractModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'contractModal';
      modal.className = 'modal';
      document.body.appendChild(modal);
    }

    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split('T')[0];

    modal.innerHTML = `
      <div class="modal-content contract-modal">
        <div class="modal-header">
          <h3><i class="fas fa-file-contract"></i> Tạo hợp đồng thuê nhà</h3>
          <button class="close-btn" onclick="closeContractModal()">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="contract-info-summary">
            <h4>Thông tin tóm tắt</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>Phòng:</label>
                <span>${room.name}</span>
              </div>
              <div class="info-item">
                <label>Người thuê:</label>
                <span>${tenant.full_name || tenant.username}</span>
              </div>
              <div class="info-item">
                <label>Giá phòng:</label>
                <span>${fmtVND(parseFloat(room.base_price || 0))}/tháng</span>
              </div>
              <div class="info-item">
                <label>Thời gian xem nhà:</label>
                <span>${new Date(request.viewing_time).toLocaleString('vi-VN')}</span>
              </div>
              <div class="info-item">
                <label>Trạng thái yêu cầu:</label>
                <span class="status-badge status-${getStatusClass(request.status)}">${getStatusText(request.status)}</span>
              </div>
            </div>
            ${request.status === 'PENDING' ? `
              <div class="alert alert-info" style="margin-top: 1rem; padding: 0.75rem; background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 4px; color: #1565c0;">
                <i class="fas fa-info-circle"></i> <strong>Lưu ý:</strong> Yêu cầu này chưa được chấp nhận. Hệ thống sẽ tự động chấp nhận yêu cầu khi bạn tạo hợp đồng.
              </div>
            ` : ''}
          </div>

          <form id="contractForm">
            <div class="form-row">
              <div class="form-group">
                <label for="contract-start-date">Ngày bắt đầu hợp đồng <span class="required">*</span></label>
                <input type="date" id="contract-start-date" name="start_date" value="${today}" required>
              </div>
              <div class="form-group">
                <label for="contract-end-date">Ngày kết thúc hợp đồng <span class="required">*</span></label>
                <input type="date" id="contract-end-date" name="end_date" value="${nextYearStr}" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="contract-monthly-rent">Tiền thuê hàng tháng <span class="required">*</span></label>
                <input type="number" id="contract-monthly-rent" name="monthly_rent" value="${room.base_price || 0}" step="1000" required>
              </div>
              <div class="form-group">
                <label for="contract-deposit">Tiền đặt cọc</label>
                <input type="number" id="contract-deposit" name="deposit" value="${(room.base_price || 0) * 2}" step="1000">
              </div>
            </div>

            <div class="form-group">
              <label for="contract-billing-cycle">Chu kỳ thanh toán</label>
              <select id="contract-billing-cycle" name="billing_cycle">
                <option value="MONTHLY">Hàng tháng</option>
                <option value="QUARTERLY">Hàng quý</option>
                <option value="YEARLY">Hàng năm</option>
              </select>
            </div>

            <div class="form-group">
              <label for="contract-notes">Ghi chú hợp đồng</label>
              <textarea id="contract-notes" name="notes" rows="4" placeholder="Các điều khoản, quy định đặc biệt..."></textarea>
            </div>

            <div class="form-group">
              <label for="contract-image">Ảnh hợp đồng đã ký</label>
              <input type="file" id="contract-image" name="contract_image" accept="image/*">
              <small class="form-help">Tải lên ảnh hợp đồng đã ký (nếu có). Hỗ trợ: JPG, PNG, GIF</small>
            </div>

            <input type="hidden" name="rental_request_id" value="${request.id}">
            <input type="hidden" name="room" value="${request.room}">
            <input type="hidden" name="tenant" value="${request.tenant}">
          </form>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeContractModal()">Hủy</button>
          <button type="button" class="btn btn-primary" onclick="submitContract()">
            <i class="fas fa-save"></i> ${request.status === 'PENDING' ? 'Chấp nhận và tạo hợp đồng' : 'Tạo hợp đồng'}
          </button>
        </div>
      </div>
    `;

    modal.style.display = 'block';
  }

  window.closeContractModal = function() {
    const modal = document.getElementById('contractModal');
    if (modal) {
      modal.style.display = 'none';
    }
  };

  window.submitContract = async function() {
    const form = document.getElementById('contractForm');
    const formData = new FormData(form);
    
    // Check if we have an image file
    const imageFile = formData.get('contract_image');
    const hasImage = imageFile && imageFile.size > 0;
    
    // Validate that we have a rental_request_id
    const requestId = parseInt(formData.get('rental_request_id'));
    const request = allRequests.find(r => r.id === requestId);
    
    if (!request) {
      showToast('Không tìm thấy yêu cầu xem nhà', 'error');
      return;
    }

    // Check if request status allows contract creation
    if (request.status !== 'ACCEPTED' && request.status !== 'PENDING') {
      showToast('Chỉ có thể tạo hợp đồng từ yêu cầu đã được chấp nhận', 'error');
      return;
    }

    try {
      showLoading(true, 'Đang tạo hợp đồng...');
      
      // If request is still PENDING, accept it first
      if (request.status === 'PENDING') {
        await api.acceptRentalRequest(requestId);
        showToast('Đã chấp nhận yêu cầu xem nhà', 'info');
      }
      
      // Convert FormData to object for JSON API
      const contractData = {};
      for (let [key, value] of formData.entries()) {
        if (key === 'rental_request_id' || key === 'room' || key === 'tenant') {
          contractData[key] = parseInt(value);
        } else if (key === 'monthly_rent' || key === 'deposit') {
          contractData[key] = parseFloat(value) || 0;
        } else if (key !== 'contract_image') { // Skip file input, will handle separately
          contractData[key] = value;
        }
      }
      
      // Convert image to base64 if present
      if (hasImage) {
        const base64Image = await convertFileToBase64(imageFile);
        contractData.contract_image_base64 = base64Image;
      }
      
      // Always use JSON API with base64 image
      await api.createContract(contractData);
      
      closeContractModal();
      showToast('Tạo hợp đồng thành công!', 'success');
      
      // Tải lại dữ liệu và cập nhật giao diện
      console.log('Đang tải lại dữ liệu sau khi tạo hợp đồng...');
      await loadRequests(); // Tải lại danh sách yêu cầu và hợp đồng
      await loadTenants(); // Cập nhật danh sách người thuê
      
    } catch (error) {
      console.error('Error creating contract:', error);
      showToast('Lỗi khi tạo hợp đồng: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  };

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

  // Close modals when clicking outside
  window.onclick = function(event) {
    const requestModal = document.getElementById('requestModal');
    const tenantModal = document.getElementById('tenantModal');
    const contractModal = document.getElementById('contractModal');
    const tenantContractModal = document.getElementById('tenantContractModal');
    
    if (event.target === requestModal) {
      closeModal();
    }
    if (event.target === tenantModal) {
      closeTenantModal();
    }
    if (event.target === contractModal) {
      closeContractModal();
    }
    if (event.target === tenantContractModal) {
      closeTenantContractModal();
    }
  };

  // Hàm xem hợp đồng từ một yêu cầu thuê
  window.viewContractForRequest = async function(requestId) {
    try {
      // Tìm yêu cầu thuê
      const request = allRequests.find(r => r.id === requestId);
      if (!request) {
        showToast('Không tìm thấy yêu cầu thuê', 'error');
        return;
      }

      // Tìm hợp đồng ACTIVE liên quan đến yêu cầu này
      const contract = allContracts.find(c => c.rental_request === request.id && c.status === 'ACTIVE');
      if (!contract) {
        showToast('Không tìm thấy hợp đồng liên quan đến yêu cầu này', 'error');
        return;
      }

      // Lấy thông tin phòng và người thuê
      const room = await api.getRoom(contract.room);
      const tenant = await api.getTenant(contract.tenant);

      // Hiển thị hợp đồng
      showTenantContractDetailsModal(contract, room, tenant);
    } catch (error) {
      console.error('Error viewing contract for request:', error);
      showToast('Lỗi khi tải thông tin hợp đồng: ' + error.message, 'error');
    }
  };

  // Hàm hủy yêu cầu thuê
  window.cancelRequest = async function(requestId) {
    if (confirm('Bạn có chắc chắn muốn hủy yêu cầu này không?')) {
      try {
        await api.updateRentalRequest(requestId, { status: 'CANCELED' });
        showToast('Đã hủy yêu cầu thành công', 'success');
        await loadRequests(); // Tải lại danh sách yêu cầu
      } catch (error) {
        console.error('Error canceling request:', error);
        showToast('Lỗi khi hủy yêu cầu: ' + error.message, 'error');
      }
    }
  };

  // Hàm hủy hợp đồng
  window.cancelContract = async function(requestId) {
    if (confirm('Bạn có chắc chắn muốn hủy hợp đồng này không? Hành động này sẽ chuyển trạng thái hợp đồng sang SUSPENDED.')) {
      try {
        // Tìm yêu cầu thuê
        const request = allRequests.find(r => r.id === requestId);
        if (!request) {
          showToast('Không tìm thấy yêu cầu thuê', 'error');
          return;
        }

        // Tìm hợp đồng ACTIVE liên quan đến yêu cầu này
        const contract = allContracts.find(c => c.rental_request === request.id && c.status === 'ACTIVE');
        if (!contract) {
          showToast('Không tìm thấy hợp đồng liên quan đến yêu cầu này', 'error');
          return;
        }

        // Cập nhật trạng thái hợp đồng thành SUSPENDED
        await api.updateContract(contract.id, { status: 'SUSPENDED' });
        showToast('Đã hủy hợp đồng thành công', 'success');
        
        // Tải lại danh sách yêu cầu và hợp đồng
        await loadAllData();
      } catch (error) {
        console.error('Error canceling contract:', error);
        showToast('Lỗi khi hủy hợp đồng: ' + error.message, 'error');
      }
    }
  };
});
