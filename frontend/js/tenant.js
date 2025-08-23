document.addEventListener("DOMContentLoaded", async () => {
  const u = requireAuth(["TENANT"]);
  if (!u) return;

  // Show loading state
  const reqTbody = qs("#req-tbody");
  const cTbody = qs("#contract-tbody");
  
  if (reqTbody) {
    reqTbody.innerHTML = '<tr><td colspan="6" class="help">Đang tải dữ liệu yêu cầu xem nhà...</td></tr>';
  }
  
  if (cTbody) {
    cTbody.innerHTML = '<tr><td colspan="6" class="help">Đang tải dữ liệu hợp đồng...</td></tr>';
  }

  try {
    // Load rental requests and contracts separately
    console.log('Loading data for user:', u);
    
    // PHẦN 1: Tải yêu cầu xem nhà từ API rental-requests
    let rentalRequests = [];
    try {
      // Sử dụng API mới để tải yêu cầu xem nhà
      const rentalRequestsResponse = await api.getRentalRequests();
      console.log('Rental requests received:', rentalRequestsResponse);
      
      // Đảm bảo dữ liệu là một mảng
      rentalRequests = Array.isArray(rentalRequestsResponse) ? rentalRequestsResponse : 
                      (rentalRequestsResponse && Array.isArray(rentalRequestsResponse.results) ? 
                       rentalRequestsResponse.results : []);
      
      console.log('Processed rental requests array:', rentalRequests);
      
      // Lọc các yêu cầu của người dùng hiện tại
      rentalRequests = rentalRequests.filter(req => req.tenant === u.id);
      console.log('My rental requests:', rentalRequests);
    } catch (error) {
      console.error('Error loading rental requests:', error);
      rentalRequests = [];
    }
    
    // PHẦN 2: Tải hợp đồng từ API contracts
    let contracts = [];
    try {
      const contractsResponse = await api.getContracts();
      console.log('Contracts received:', contractsResponse);
      
      // Đảm bảo contracts là một mảng
      contracts = Array.isArray(contractsResponse) ? contractsResponse : 
                 (contractsResponse && Array.isArray(contractsResponse.results) ? 
                  contractsResponse.results : []);
      
      console.log('Processed contracts array:', contracts);
      
      // Lọc hợp đồng của người dùng hiện tại
      contracts = contracts.filter(c => c.tenant === u.id);
      console.log('My contracts:', contracts);
    } catch (error) {
      console.error('Error loading contracts:', error);
      contracts = [];
    }
    
    // Render yêu cầu xem nhà
    if (reqTbody) {
      if (rentalRequests.length === 0) {
        reqTbody.innerHTML =
          '<tr><td colspan="6" class="help">Chưa có yêu cầu xem nhà nào.</td></tr>';
      } else {
        const requestRows = await Promise.all(rentalRequests.map(async (r) => {
          try {
            // Validate request object
            if (!r || typeof r !== 'object') {
              console.warn('Invalid rental request object:', r);
              return '';
            }
            
            const room = await api.getRoom(r.room);
            const roomName = room ? (room.name || room.title || room.room_number || `Phòng ${r.room}`) : `Phòng ${r.room}`;
            const message = r.notes || r.message || 'Yêu cầu xem nhà';
            // Lấy thời gian tạo yêu cầu
            const createdAt = r.created_at || r.createdAt || r.created || r.date_created || r.dateCreated;
            // Lấy thời gian xem nhà
            const viewingTime = r.viewing_time || r.viewingTime;
            
            // Format trạng thái theo ngôn ngữ người dùng
            let statusBadge = '';
            switch(r.status) {
              case 'PENDING':
                statusBadge = '<span class="badge">Chờ xử lý</span>';
                break;
              case 'ACCEPTED':
                statusBadge = '<span class="badge success">Đã chấp nhận</span>';
                break;
              case 'DECLINED':
                statusBadge = '<span class="badge danger">Đã từ chối</span>';
                break;
              case 'CANCELED':
                statusBadge = '<span class="badge secondary">Đã hủy</span>';
                break;
              default:
                statusBadge = `<span class="badge">${r.status}</span>`;
            }
            
            // Chỉ hiển thị nút hủy nếu trạng thái là PENDING
            const cancelButton = r.status === 'PENDING' ? 
              `<button class="btn secondary btn-cancel" data-id="${r.id}">Hủy</button>` : 
              '';
            
            return `<tr>
              <td>${roomName}</td>
              <td>${message}</td>
              <td>${createdAt ? new Date(createdAt).toLocaleString("vi-VN") : 'Đang cập nhật...'}</td>
              <td>${viewingTime ? new Date(viewingTime).toLocaleString("vi-VN") : 'Đang cập nhật...'}</td>
              <td>${statusBadge}</td>
              <td>${cancelButton}</td>
            </tr>`;
          } catch (error) {
            console.error('Error loading room data for request:', r, error);
            return `<tr>
              <td>Phòng ${r.room || 'N/A'}</td>
              <td>${r.notes || r.message || 'Yêu cầu xem nhà'}</td>
              <td>${r.created_at ? new Date(r.created_at).toLocaleString("vi-VN") : 'Đang cập nhật...'}</td>
              <td>${r.viewing_time ? new Date(r.viewing_time).toLocaleString("vi-VN") : 'Đang cập nhật...'}</td>
              <td><span class="badge">${r.status || 'PENDING'}</span></td>
              <td>
                ${r.status === 'PENDING' ? `<button class="btn secondary btn-cancel" data-id="${r.id}">Hủy</button>` : ''}
              </td>
            </tr>`;
          }
        }));
        
        // Lọc các hàng trống
        const validRequestRows = requestRows.filter(row => row.trim() !== '');
        
        if (validRequestRows.length === 0) {
          reqTbody.innerHTML =
            '<tr><td colspan="6" class="help">Không có yêu cầu nào hiển thị được do lỗi dữ liệu.</td></tr>';
        } else {
          reqTbody.innerHTML = validRequestRows.join("");
        }
        
        // Thêm handler cho nút hủy
        qsa(".btn-cancel").forEach((btn) =>
          btn.addEventListener("click", async (e) => {
            const id = btn.getAttribute("data-id");
            if (confirm("Bạn có chắc chắn muốn hủy yêu cầu xem nhà này?")) {
              try {
                // Sử dụng API hủy yêu cầu xem nhà
                await api.cancelRentalRequest(id);
                alert("Đã hủy yêu cầu xem nhà thành công!");
                location.reload();
              } catch (error) {
                console.error('Error cancelling request:', error);
                alert("Có lỗi xảy ra khi hủy yêu cầu: " + error.message);
              }
            }
          })
        );
      }
    }

    // Render contracts table
    const cTbody = qs("#contract-tbody");
    if (cTbody) {
      if (contracts.length === 0) {
        cTbody.innerHTML =
          '<tr><td colspan="6" class="help">Chưa có hợp đồng nào.</td></tr>';
      } else {
        const contractRows = await Promise.all(contracts.map(async (c) => {
          try {
            // Validate contract object
            if (!c || typeof c !== 'object') {
              console.warn('Invalid contract object:', c);
              return '';
            }
            
            const room = await api.getRoom(c.room);
            const roomName = room ? (room.name || room.title || room.room_number || `Phòng ${c.room}`) : `Phòng ${c.room}`;
            const monthlyRent = c.monthly_rent || c.monthlyRent || 0;
            const startDate = c.start_date || c.startDate || '-';
            const endDate = c.end_date || c.endDate || '-';
            const status = c.status || 'ACTIVE';
            
            return `<tr>
              <td>${roomName}</td>
              <td>${fmtVND(monthlyRent)}</td>
              <td>${startDate} → ${endDate}</td>
              <td><span class="badge">${status}</span></td>
              <td><a class="btn secondary" href="room.html?id=${c.room}">Xem phòng</a></td>
              <td></td>
            </tr>`;
          } catch (error) {
            console.error('Error loading room data for contract:', c, error);
            return `<tr>
              <td>Phòng ${c.room || 'N/A'}</td>
              <td>${fmtVND(c.monthly_rent || c.monthlyRent || 0)}</td>
              <td>${c.start_date || c.startDate || '-'} → ${c.end_date || c.endDate || '-'}</td>
              <td><span class="badge">${c.status || 'ACTIVE'}</span></td>
              <td><a class="btn secondary" href="room.html?id=${c.room || '#'}">Xem phòng</a></td>
              <td></td>
            </tr>`;
          }
        }));
        
        // Filter out empty rows
        const validContractRows = contractRows.filter(row => row.trim() !== '');
        
        if (validContractRows.length === 0) {
          cTbody.innerHTML =
            '<tr><td colspan="6" class="help">Không có hợp đồng nào hiển thị được do lỗi dữ liệu.</td></tr>';
        } else {
          cTbody.innerHTML = validContractRows.join("");
        }
      }
    }

  } catch (error) {
    console.error('Error loading tenant data:', error);
    console.error('Error details:', error.message, error.stack);
    
    // Show more detailed error in tables
    const reqTbody = qs("#req-tbody");
    const cTbody = qs("#contract-tbody");
    
    let errorMessage = "Có lỗi xảy ra khi tải dữ liệu";
    if (error.message) {
      // Check if it's a network error
      if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.";
      } else if (error.message.includes('filter is not a function')) {
        errorMessage = "Dữ liệu trả về từ server không đúng định dạng. Vui lòng liên hệ quản trị viên.";
      } else {
        errorMessage += `: ${error.message}`;
      }
    }
    
    if (reqTbody) {
      reqTbody.innerHTML =
        `<tr><td colspan="6" class="help" style="color: var(--error);">${errorMessage}</td></tr>`;
    }
    
    if (cTbody) {
      cTbody.innerHTML =
        `<tr><td colspan="6" class="help" style="color: var(--error);">${errorMessage}</td></tr>`;
    }
    
    // Show user-friendly notification instead of alert
    if (typeof showNotification === 'function') {
      showNotification(`Lỗi tải dữ liệu: ${error.message || 'Không xác định'}`, 'error');
    } else {
      alert(`Lỗi tải dữ liệu: ${error.message || 'Không xác định'}`);
    }
  }
});
