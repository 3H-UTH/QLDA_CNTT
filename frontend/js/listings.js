// Function to get rooms from API (using the API client)
async function fetchRoomsFromAPI() {
  try {
    console.log('fetchRoomsFromAPI: Starting API call...');
    const rooms = await api.getRooms();
    console.log('fetchRoomsFromAPI: Successfully fetched rooms from API:', rooms.length, 'rooms');
    return rooms;
  } catch (error) {
    console.error('fetchRoomsFromAPI: Error fetching rooms from API:', error);
    // Return empty array on error, API client handles fallback
    return [];
  }
}

function renderRooms(rooms) {
  console.log('renderRooms: Starting with rooms:', rooms);
  const wrap = document.getElementById("room-list");
  if (!wrap) {
    console.error('renderRooms: room-list element not found!');
    return;
  }
  
  wrap.innerHTML = "";
  
  if (rooms.length === 0) {
    console.log('renderRooms: No rooms to display');
    wrap.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fas fa-home"></i>
        <h3>Chưa có phòng nào được đăng</h3>
        <p>Owner chưa thêm phòng nào vào hệ thống hoặc không có phòng phù hợp với tiêu chí tìm kiếm của bạn.</p>
      </div>
    `;
    return;
  }
  
  console.log('renderRooms: Rendering', rooms.length, 'rooms');
  
  rooms.forEach((r) => {
    const div = document.createElement("div");
    div.className = "property-card fade-in";
    
    // Handle image - check if it's from API (image field) or localStorage
    let img = "assets/placeholder.svg";
    if (r.image) {
      img = r.image; // From API
    } else if (r.image_url) {
      img = r.image_url; // From API alternative field
    } else if (r.room_image) {
      img = r.room_image; // From API legacy field
    } else if (r.images && r.images[0]) {
      img = r.images[0]; // From localStorage fallback
    }
    
    // Determine status badge - map Django model status to display text
    let statusBadge = '';
    let statusClass = '';
    switch(r.status?.toUpperCase()) {
      case 'EMPTY':
        statusBadge = 'Còn trống';
        statusClass = 'status-available';
        break;
      case 'RENTED':
        statusBadge = 'Đã thuê';
        statusClass = 'status-rented';
        break;
      case 'MAINT':
        statusBadge = 'Bảo trì';
        statusClass = 'status-maintenance';
        break;
      default:
        statusBadge = 'Đang xử lý';
        statusClass = 'status-pending';
    }
    
    // Map API fields to display fields
    const title = r.name || r.title || 'Phòng không tên';
    const location = r.building?.address || r.address || r.location || 'Chưa có địa chỉ';
    const price = parseFloat(r.base_price || r.price || 0);
    const description = r.detail || r.description || 'Phòng hiện đại, đầy đủ tiện nghi';
    const bedrooms = r.bedrooms || 1;
    const bathrooms = r.bathrooms || 1;
    const area = r.area_m2 || '45';
    
    div.innerHTML = `
      <div style="position: relative; overflow: hidden;">
        <img src="${img}" alt="${title}" loading="lazy">
        <div class="badge ${statusClass}" style="position: absolute; top: 1rem; right: 1rem;">
          ${statusBadge}
        </div>
      </div>
      <div class="body">
        <div class="price" style="display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.75rem;">
          <span style="font-size: 1.75rem; font-weight: 700; color: var(--accent-gold);">
            ${fmtVND(price)}
          </span>
          <span style="font-size: 0.875rem; font-weight: 500; color: var(--text-muted);">
            /tháng
          </span>
        </div>
        
        <h3 class="title" style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">
          ${title}
        </h3>
        
        <div class="location" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: var(--text-muted); font-size: 0.875rem;">
          <i class="fas fa-map-marker-alt" style="color: var(--accent-blue);"></i>
          <span>${location}</span>
        </div>
        
        <div class="features" style="display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap;">
          <div class="badge feature-badge" style="display: flex; align-items: center; gap: 0.25rem;">
            <i class="fas fa-bed" style="color: var(--accent-blue);"></i>
            <span>${bedrooms} PN</span>
          </div>
          <div class="badge feature-badge" style="display: flex; align-items: center; gap: 0.25rem;">
            <i class="fas fa-bath" style="color: var(--accent-blue);"></i>
            <span>${bathrooms} WC</span>
          </div>
          <div class="badge feature-badge" style="display: flex; align-items: center; gap: 0.25rem;">
            <i class="fas fa-ruler-combined" style="color: var(--accent-blue);"></i>
            <span>${area}m²</span>
          </div>
        </div>
        
        <p style="color: var(--text-muted); margin-bottom: 1.5rem; line-height: 1.5; font-size: 0.875rem;">
          ${description.length > 80 ? description.substring(0, 80) + '...' : description}
        </p>
        
        <div class="actions" style="display: flex; gap: 0.75rem;">
          <a class="btn btn-primary" href="room.html?id=${r.id}" style="flex: 1; justify-content: center;">
            <i class="fas fa-eye"></i>
            Xem chi tiết
          </a>
          ${r.status?.toUpperCase() === 'EMPTY' ? `
            <button class="btn btn-accent" onclick="handleRentNow(${r.id})" style="flex: 1; justify-content: center;">
              <i class="fas fa-key"></i>
              Thuê ngay
            </button>
          ` : ''}
        </div>
      </div>
    `;
    wrap.appendChild(div);
  });
}

// Add rent now handler
function handleRentNow(roomId) {
  console.log('handleRentNow called for room:', roomId);
  
  // Simple check - just check if currentUser exists in localStorage
  const localStorageUser = localStorage.getItem('currentUser');
  console.log('localStorage currentUser:', localStorageUser);
  
  if (!localStorageUser) {
    console.log('No user found in localStorage, showing login alert');
    alert('Vui lòng đăng nhập để thuê phòng');
    window.location.href = 'login.html';
    return;
  }
  
  try {
    const user = JSON.parse(localStorageUser);
    console.log('Parsed user:', user);
    
    if (!user || !user.id) {
      console.log('Invalid user data, showing login alert');
      alert('Vui lòng đăng nhập để thuê phòng');
      window.location.href = 'login.html';
      return;
    }
    
    console.log('User found, redirecting to room details');
    // Redirect to room details for booking
    window.location.href = `room.html?id=${roomId}&action=rent`;
  } catch (error) {
    console.error('Error parsing user data:', error);
    alert('Vui lòng đăng nhập để thuê phòng');
    window.location.href = 'login.html';
  }
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
    const price = parseFloat(r.base_price || r.price || 0);
    
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
  console.log('listings.js: DOM loaded, starting initialization...');
  
  // Show loading state with modern spinner
  const roomList = document.getElementById("room-list");
  if (!roomList) {
    console.error('listings.js: room-list element not found!');
    return;
  }
  
  roomList.innerHTML = `
    <div class="loading" style="grid-column: 1 / -1;">
      <div style="text-align: center;">
        <div class="spinner" style="margin: 0 auto 1rem;"></div>
        <h3 style="color: var(--text-secondary); margin-bottom: 0.5rem;">Đang tải dữ liệu phòng...</h3>
        <p style="color: var(--text-muted);">Vui lòng đợi trong giây lát</p>
      </div>
    </div>
  `;
  
  // Load rooms from API
  console.log('listings.js: Calling fetchRoomsFromAPI...');
  const rooms = await fetchRoomsFromAPI();
  console.log('listings.js: Got rooms:', rooms);
  renderRooms(rooms);
  
  // Setup search form
  const searchForm = qs("#searchForm");
  if (searchForm) {
    console.log('listings.js: Setting up search form');
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      applySearch();
    });
  } else {
    console.warn('listings.js: Search form not found');
  }
  
  // Add real-time search
  const searchInputs = ['#kw', '#location', '#priceMin', '#priceMax'];
  searchInputs.forEach(selector => {
    const input = qs(selector);
    if (input) {
      input.addEventListener('input', debounce(() => {
        applySearch();
      }, 300));
    }
  });
});

// Debounce function for real-time search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
