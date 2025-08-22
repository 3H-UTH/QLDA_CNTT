document.addEventListener("DOMContentLoaded", async () => {
  const u = requireAuth(["TENANT"]);
  if (!u) return;

  try {
    // Load contracts from API
    const contracts = await api.getContracts();
    const myContracts = contracts.filter((c) => c.tenant === u.id);
    
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
            const room = await api.getRoom(r.room);
            const roomName = room ? (room.name || room.title || room.room_number) : r.room;
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
              <td>Phòng ${r.room}</td>
              <td>${r.notes || r.message || 'Yêu cầu thuê phòng'}</td>
              <td>${new Date(r.created_at || r.createdAt || new Date()).toLocaleString("vi-VN")}</td>
              <td><span class="badge">pending</span></td>
              <td>
                <button class="btn secondary btn-cancel" data-id="${r.id}">Hủy</button>
              </td>
            </tr>`;
          }
        }));
        
        reqTbody.innerHTML = requestRows.join("");
        
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
            const room = await api.getRoom(c.room);
            const roomName = room ? (room.name || room.title || room.room_number) : c.room;
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
              <td>Phòng ${c.room}</td>
              <td>${fmtVND(c.monthly_rent || c.monthlyRent || 0)}</td>
              <td>${c.start_date || c.startDate || '-'} → ${c.end_date || c.endDate || '-'}</td>
              <td><span class="badge">${c.status || 'ACTIVE'}</span></td>
              <td><a class="btn secondary" href="room.html?id=${c.room}">Xem phòng</a></td>
              <td></td>
            </tr>`;
          }
        }));
        
        cTbody.innerHTML = contractRows.join("");
      }
    }

  } catch (error) {
    console.error('Error loading tenant data:', error);
    
    // Show error in tables
    const reqTbody = qs("#req-tbody");
    const cTbody = qs("#contract-tbody");
    
    if (reqTbody) {
      reqTbody.innerHTML =
        '<tr><td colspan="5" class="help">Có lỗi xảy ra khi tải dữ liệu yêu cầu.</td></tr>';
    }
    
    if (cTbody) {
      cTbody.innerHTML =
        '<tr><td colspan="6" class="help">Có lỗi xảy ra khi tải dữ liệu hợp đồng.</td></tr>';
    }
  }
});
