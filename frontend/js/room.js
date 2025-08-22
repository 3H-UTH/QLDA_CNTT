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
  
  // Handle images - support multiple images
  let images = [];
  if (r.images && Array.isArray(r.images)) {
    images = r.images;
  } else if (r.image) {
    images = [r.image];
  } else {
    images = ["assets/placeholder.svg"];
  }
  
  // Ensure all images have proper URLs
  images = images.map(img => {
    if (!img) return "assets/placeholder.svg";
    return img;
  });
  
  // Handle different field names from API
  const title = r.title || r.name || r.room_number || 'Phòng không tên';
  const location = r.location || r.address || 'Chưa có địa chỉ';
  const status = r.status || r.is_available ? 'Còn trống' : 'Đã thuê';
  const price = r.price || r.base_price || 0;
  const description = r.description || r.detail || 'Chưa có mô tả';
  
  // Generate image gallery HTML
  const galleryHTML = images.length > 1 ? `
    <div class="image-gallery">
      <div class="gallery-main">
        ${images.map((img, index) => `
          <img src="${img}" alt="${title} - Ảnh ${index + 1}" class="${index === 0 ? 'active' : ''}" data-index="${index}">
        `).join('')}
        ${images.length > 1 ? `
          <button class="gallery-nav prev" onclick="changeImage(-1)">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="gallery-nav next" onclick="changeImage(1)">
            <i class="fas fa-chevron-right"></i>
          </button>
          <div class="gallery-counter">
            <span id="current-image">1</span> / ${images.length}
          </div>
        ` : ''}
      </div>
      ${images.length > 1 ? `
        <div class="gallery-indicators">
          ${images.map((img, index) => `
            <div class="gallery-indicator ${index === 0 ? 'active' : ''}" onclick="showImage(${index})">
              <img src="${img}" alt="Thumbnail ${index + 1}">
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  ` : `
    <img src="${images[0]}" alt="${title}" style="width: 100%; height: 300px; object-fit: cover;">
  `;
  
  wrap.innerHTML = `
  <div class="card">
    ${galleryHTML}
    <div class="body">
      <h2 style="margin:.3rem 0">${title}</h2>
      <div class="badge">${location}</div>
      <div class="badge">${status}</div>
      <div style="font-weight:700;margin-top:.25rem">${fmtVND(price)}/tháng</div>
      <div style="margin: 1rem 0;">
        <h3 style="margin-bottom: 0.5rem; color: var(--text-primary);">Mô tả chi tiết</h3>
        <p style="color:var(--muted); line-height: 1.6; white-space: pre-wrap;">${description}</p>
      </div>
      <div id="request-area"></div>
    </div>
  </div>`;
  
  // Initialize gallery if multiple images
  if (images.length > 1) {
    window.currentImageIndex = 0;
    window.totalImages = images.length;
  }
  
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

// Gallery functions for slideshow
function changeImage(direction) {
  if (!window.totalImages || window.totalImages <= 1) return;
  
  const currentImages = document.querySelectorAll('.gallery-main img');
  const currentIndicators = document.querySelectorAll('.gallery-indicator');
  
  // Hide current image
  currentImages[window.currentImageIndex].classList.remove('active');
  currentIndicators[window.currentImageIndex].classList.remove('active');
  
  // Calculate new index
  window.currentImageIndex += direction;
  if (window.currentImageIndex >= window.totalImages) {
    window.currentImageIndex = 0;
  } else if (window.currentImageIndex < 0) {
    window.currentImageIndex = window.totalImages - 1;
  }
  
  // Show new image
  currentImages[window.currentImageIndex].classList.add('active');
  currentIndicators[window.currentImageIndex].classList.add('active');
  
  // Update counter
  document.getElementById('current-image').textContent = window.currentImageIndex + 1;
}

function showImage(index) {
  if (!window.totalImages || window.totalImages <= 1) return;
  
  const currentImages = document.querySelectorAll('.gallery-main img');
  const currentIndicators = document.querySelectorAll('.gallery-indicator');
  
  // Hide current image
  currentImages[window.currentImageIndex].classList.remove('active');
  currentIndicators[window.currentImageIndex].classList.remove('active');
  
  // Show selected image
  window.currentImageIndex = index;
  currentImages[window.currentImageIndex].classList.add('active');
  currentIndicators[window.currentImageIndex].classList.add('active');
  
  // Update counter
  document.getElementById('current-image').textContent = window.currentImageIndex + 1;
}

// Keyboard navigation
document.addEventListener('keydown', function(event) {
  if (window.totalImages && window.totalImages > 1) {
    if (event.key === 'ArrowLeft') {
      changeImage(-1);
    } else if (event.key === 'ArrowRight') {
      changeImage(1);
    }
  }
});
