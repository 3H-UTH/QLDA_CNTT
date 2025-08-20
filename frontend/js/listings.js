// Function to get rooms from API (using the new api client)
async function fetchRoomsFromAPI() {
  try {
    const rooms = await api.getRooms();
    console.log('Successfully fetched rooms from database:', rooms.length, 'rooms');
    return rooms;
  } catch (error) {
    console.error('Error fetching rooms from API:', error);
    // Show error message instead of fallback to localStorage
    return [];
  }
}

function renderRooms(rooms) {
  const wrap = document.getElementById("room-list");
  wrap.innerHTML = "";
  if (rooms.length === 0) {
    wrap.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <i class="fas fa-home" style="font-size: 4rem; color: var(--text-light); margin-bottom: 1rem;"></i>
        <h3 style="color: var(--text-muted); margin-bottom: 0.5rem;">Chưa có phòng nào được đăng</h3>
        <p style="color: var(--text-light);">Owner chưa thêm phòng nào vào hệ thống hoặc không có phòng phù hợp với tiêu chí tìm kiếm</p>
      </div>
    `;
    return;
  }
  
  rooms.forEach((r) => {
    const div = document.createElement("div");
    div.className = "property-card";
    
    // Handle image - check if it's from API (image_url field) or localStorage
    let img = "assets/placeholder.svg";
    if (r.image_url) {
      img = r.image_url; // From API
    } else if (r.room_image) {
      img = r.room_image; // From API legacy field
    } else if (r.images && r.images[0]) {
      img = r.images[0]; // From localStorage fallback
    }
    
    // Determine status badge - map Django model status to display text
    let statusBadge = '';
    let statusClass = '';
    switch(r.status?.toLowerCase()) {
      case 'empty':
        statusBadge = 'Còn trống';
        statusClass = 'status-available';
        break;
      case 'rented':
        statusBadge = 'Đã thuê';
        statusClass = 'status-rented';
        break;
      case 'maint':
        statusBadge = 'Bảo trì';
        statusClass = 'status-maintenance';
        break;
      case 'available': // localStorage fallback
        statusBadge = 'Còn trống';
        statusClass = 'status-available';
        break;
      default:
        statusBadge = 'Đang xử lý';
        statusClass = 'status-pending';
    }
    
    // Map API fields to display fields
    const title = r.name || r.title || 'Phòng không tên';
    const location = r.address || r.location || 'Chưa có địa chỉ';
    const price = r.base_price || r.price || 0;
    const description = r.detail || r.description || 'Chưa có mô tả';
    const bedrooms = r.bedrooms || 1;
    const bathrooms = r.bathrooms || 1;
    const area = r.area_m2 || '45';
    
    div.innerHTML = `
      <div class="image-container">
        <img src="${img}" alt="${title}" loading="lazy">
        <div class="badge ${statusClass}">${statusBadge}</div>
      </div>
      <div class="content">
        <div class="price">${fmtVND(price)}<span style="font-size: 0.875rem; font-weight: 400; color: var(--text-muted);">/tháng</span></div>
        <h3 class="title">${title}</h3>
        <div class="location">
          <i class="fas fa-map-marker-alt"></i>
          <span>${location}</span>
        </div>
        <div class="property-features">
          <div class="feature">
            <i class="fas fa-bed"></i>
            <span>${bedrooms} PN</span>
          </div>
          <div class="feature">
            <i class="fas fa-bath"></i>
            <span>${bathrooms} WC</span>
          </div>
          <div class="feature">
            <i class="fas fa-ruler-combined"></i>
            <span>${area}m²</span>
          </div>
        </div>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem; line-height: 1.5;">${description.substring(0, 100)}...</p>
        <a class="btn btn-primary" href="room.html?id=${r.id}" style="width: 100%;">
          <i class="fas fa-eye"></i>
          Xem chi tiết
        </a>
      </div>
    `;
    wrap.appendChild(div);
  });
}
async function applySearch() {
  const kw = qs("#kw").value.trim().toLowerCase();
  const loc = qs("#location").value.trim().toLowerCase();
  const min = parseInt(qs("#priceMin").value || "0", 10);
  const max = parseInt(qs("#priceMax").value || "0", 10);
  
  // Get rooms from API
  let rooms = await fetchRoomsFromAPI();
  
  // Apply client-side filtering
  rooms = rooms.filter((r) => {
    // Map API fields for search
    const title = r.name || r.title || '';
    const description = r.detail || r.description || '';
    const location = r.address || r.location || '';
    const price = r.base_price || r.price || 0;
    
    const okKw =
      !kw ||
      title.toLowerCase().includes(kw) ||
      description.toLowerCase().includes(kw);
    const okLoc = !loc || location.toLowerCase().includes(loc);
    const okMin = !min || price >= min;
    const okMax = !max || price <= max;
    return okKw && okLoc && okMin && okMax;
  });
  renderRooms(rooms);
}

document.addEventListener("DOMContentLoaded", async () => {
  // Show loading state
  const roomList = document.getElementById("room-list");
  roomList.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
      <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
      <h3 style="color: var(--text-muted);">Đang tải dữ liệu phòng...</h3>
    </div>
  `;
  
  // Load rooms from API
  const rooms = await fetchRoomsFromAPI();
  renderRooms(rooms);
  
  // Setup search form
  qs("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    applySearch();
  });
});
