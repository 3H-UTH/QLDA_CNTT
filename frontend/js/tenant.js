document.addEventListener("DOMContentLoaded", async () => {
  const u = requireAuth(["TENANT"]);
  if (!u) return;

  // Show loading state
  const reqTbody = qs("#req-tbody");
  const cTbody = qs("#contract-tbody");
  
  if (reqTbody) {
    reqTbody.innerHTML = '<tr><td colspan="5" class="help">Đang tải dữ liệu...</td></tr>';
  }
  
  if (cTbody) {
    cTbody.innerHTML = '<tr><td colspan="6" class="help">Đang tải dữ liệu...</td></tr>';
  }

  try {
    // Load contracts from API
    console.log('Loading contracts for user:', u);
    const contractsResponse = await api.getContracts();
    console.log('Contracts received:', contractsResponse);
    
    // Ensure contracts is an array
    const contracts = Array.isArray(contractsResponse) ? contractsResponse : 
                     (contractsResponse && Array.isArray(contractsResponse.results) ? contractsResponse.results : []);
    
    console.log('Processed contracts array:', contracts);
    const myContracts = contracts.filter((c) => c.tenant === u.id);
    console.log('My contracts:', myContracts);
    
    // Separate pending requests from active contracts
    const pendingRequests = myContracts.filter(c => c.status === 'PENDING');
    const activeContracts = myContracts.filter(c => c.status !== 'PENDING');
    
    // Render requests table (pending contracts)
    const reqTbody = qs("#req-tbody");
    if (reqTbody) {
      if (pendingRequests.length === 0) {
        reqTbody.innerHTML =
          '<tr><td colspan="5" class="help">Chưa có yêu cầu nào.</td></tr>';
      } else {
        const requestRows = await Promise.all(pendingRequests.map(async (r) => {
          try {
            // Validate request object
            if (!r || typeof r !== 'object') {
              console.warn('Invalid request object:', r);
              return '';
            }
            
            const room = await api.getRoom(r.room);
            const roomName = room ? (room.name || room.title || room.room_number || `Phòng ${r.room}`) : `Phòng ${r.room}`;
            const message = r.notes || r.message || 'Yêu cầu thuê phòng';
            const createdAt = r.created_at || r.createdAt || new Date().toISOString();
            
            return `<tr>
              <td>${roomName}</td>
              <td>${message}</td>
              <td>${new Date(createdAt).toLocaleString("vi-VN")}</td>
              <td><span class="badge">pending</span></td>
              <td>
                <button class="btn secondary btn-cancel" data-id="${r.id}">Hủy</button>
              </td>
            </tr>`;
          } catch (error) {
            console.error('Error loading room data for request:', r, error);
            return `<tr>
              <td>Phòng ${r.room || 'N/A'}</td>
              <td>${r.notes || r.message || 'Yêu cầu thuê phòng'}</td>
              <td>${new Date(r.created_at || r.createdAt || new Date()).toLocaleString("vi-VN")}</td>
              <td><span class="badge">pending</span></td>
              <td>
                <button class="btn secondary btn-cancel" data-id="${r.id}">Hủy</button>
              </td>
            </tr>`;
          }
        }));
        
        // Filter out empty rows
        const validRequestRows = requestRows.filter(row => row.trim() !== '');
        
        if (validRequestRows.length === 0) {
          reqTbody.innerHTML =
            '<tr><td colspan="5" class="help">Không có yêu cầu nào hiển thị được do lỗi dữ liệu.</td></tr>';
        } else {
          reqTbody.innerHTML = validRequestRows.join("");
        }
        
        // Add cancel button handlers
        qsa(".btn-cancel").forEach((btn) =>
          btn.addEventListener("click", async (e) => {
            const id = btn.getAttribute("data-id");
            if (confirm("Bạn có chắc chắn muốn hủy yêu cầu này?")) {
              try {
                // For now, we don't have a delete contract endpoint, so just update status
                // await api.deleteContract(id);
                alert("Tính năng hủy yêu cầu sẽ được cập nhật sau");
                // location.reload();
              } catch (error) {
                console.error('Error cancelling request:', error);
                alert("Có lỗi xảy ra khi hủy yêu cầu: " + error.message);
              }
            }
          })
        );
      }
    }
    
    // Render contracts table (active contracts only)
    const cTbody = qs("#contract-tbody");
    if (cTbody) {
      if (activeContracts.length === 0) {
        cTbody.innerHTML =
          '<tr><td colspan="6" class="help">Chưa có hợp đồng nào.</td></tr>';
      } else {
        const contractRows = await Promise.all(activeContracts.map(async (c) => {
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
        `<tr><td colspan="5" class="help" style="color: var(--error);">${errorMessage}</td></tr>`;
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
