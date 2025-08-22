function getParam(name) {
  const url = new URL(location.href);
  return url.searchParams.get(name);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function renderRoom(r) {
  const wrap = qs("#room-detail");
  if (!r) {
    wrap.innerHTML = "<p>Không tìm thấy phòng.</p>";
    return;
  }
  
  // Handle image display - check multiple possible fields
  let img = "assets/placeholder.svg";
  if (r.image) {
    img = r.image.startsWith('http') ? r.image : `http://127.0.0.1:8000${r.image}`;
  } else if (r.images && r.images[0]) {
    img = r.images[0];
  }
  
  // Handle different field names from API
  const title = r.title || r.name || r.room_number || 'Phòng không tên';
  const location = r.location || r.address || 'Chưa có địa chỉ';
  const status = r.status || r.is_available ? 'Còn trống' : 'Đã thuê';
  const price = r.price || r.base_price || 0;
  const description = r.description || 'Chưa có mô tả';
  
  wrap.innerHTML = `
  <div class="card">
    <img src="${img}" alt="${title}" style="width: 100%; height: 300px; object-fit: cover;">
    <div class="body">
      <h2 style="margin:.3rem 0">${title}</h2>
      <div class="badge">${location}</div>
      <div class="badge">${status}</div>
      <div style="font-weight:700;margin-top:.25rem">${fmtVND(price)}/tháng</div>
      <p style="color:var(--muted);margin:.5rem 0 1rem">${description}</p>
      <div id="request-area"></div>
    </div>
  </div>`;
  
  const u = currentUser();
  const area = qs("#request-area");
  if (!u) {
    area.innerHTML = `<a class="btn" href="login.html?next=${encodeURIComponent(
      location.pathname + location.search
    )}">Đăng nhập để gửi yêu cầu thuê</a>`;
  } else if (u.role !== "TENANT") {
    area.innerHTML = `<p class="help">Bạn đang đăng nhập là <b>${u.role}</b>. Chỉ người thuê mới gửi yêu cầu.</p>`;
  } else {
    area.innerHTML = `
    <form id="reqForm">
      <label>Lời nhắn cho chủ nhà</label>
      <textarea class="input" id="message" rows="3" placeholder="Mình muốn xem phòng vào cuối tuần..."></textarea>
      <button class="btn" type="submit">Gửi yêu cầu thuê</button>
    </form>
    <p class="help">Yêu cầu sẽ được gửi đến hệ thống quản lý.</p>`;
    qs("#reqForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = qs("#message").value.trim();
      try {
        // Create contract request via API
        const contractData = {
          room: r.id,
          tenant: u.id,
          notes: msg,
          status: 'PENDING'
        };
        
        await api.createContract(contractData);
        alert("Đã gửi yêu cầu thuê phòng!");
        window.location.href = "dashboard.html";
      } catch (error) {
        console.error('Error creating contract request:', error);
        alert("Có lỗi xảy ra khi gửi yêu cầu: " + error.message);
      }
    });
  }
}
document.addEventListener("DOMContentLoaded", async () => {
  const id = getParam("id");
  
  if (!id) {
    qs("#room-detail").innerHTML = "<p>Không tìm thấy ID phòng.</p>";
    return;
  }
  
  try {
    // Show loading
    qs("#room-detail").innerHTML = "<p>Đang tải thông tin phòng...</p>";
    
    // Get room data from API
    const r = await api.getRoom(id);
    renderRoom(r);
  } catch (error) {
    console.error('Error loading room:', error);
    qs("#room-detail").innerHTML = `<p>Có lỗi xảy ra khi tải thông tin phòng: ${error.message}</p>`;
  }
});
