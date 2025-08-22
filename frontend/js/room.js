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
  const status = r.status || (r.is_available ? 'EMPTY' : 'RENTED');
  const price = parseFloat(r.price || r.base_price || 0);
  const description = r.description || r.detail || 'Chưa có mô tả';
  
  // Enhanced status display with animations
  const getStatusBadge = (status) => {
    switch (status) {
      case 'EMPTY':
        return '<div class="status-badge status-available">Còn trống</div>';
      case 'RENTED':
        return '<div class="status-badge status-rented">Đã thuê</div>';
      case 'MAINT':
        return '<div class="status-badge status-maintenance">Bảo trì</div>';
      default:
        return '<div class="status-badge status-available">Còn trống</div>';
    }
  };
  
  // Owner contact info (from room data or default)
  const ownerInfo = r.owner_info || {
    name: r.owner_name || 'Chủ nhà',
    phone: r.owner_phone || 'Chưa cập nhật',
    email: r.owner_email || 'Chưa cập nhật'
  };
  
  // Generate image gallery HTML
  const galleryHTML = images.length > 1 ? `
    <div class="image-gallery">
      <div class="gallery-main">
        ${images.map((img, index) => `
          <img src="${img}" alt="${title} - Ảnh ${index + 1}" class="${index === 0 ? 'active' : ''}" data-index="${index}" onclick="openLightbox(${index})">
        `).join('')}
        ${images.length > 1 ? `
          <button class="gallery-nav prev" onclick="changeImage(-1)">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="gallery-nav next" onclick="changeImage(1)">
            <i class="fas fa-chevron-right"></i>
          </button>
        ` : ''}
      </div>
      ${images.length > 1 ? `
        <div class="gallery-indicators">
          ${images.map((img, index) => `
            <div class="gallery-indicator ${index === 0 ? 'active' : ''}" onclick="showImage(${index})">
              <img src="${img}" alt="Thumbnail ${index + 1}" onclick="event.stopPropagation(); openLightbox(${index})">
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  ` : `
    <img src="${images[0]}" alt="${title}" class="single-room-image" style="width: 100%; height: 300px; object-fit: cover;" onclick="openLightbox(0)">
  `;
  
  wrap.innerHTML = `
  <div class="card">
    ${galleryHTML}
    <div class="body">
      <h2 style="margin:.3rem 0">${title}</h2>
      <div class="badge">${location}</div>
      ${getStatusBadge(status)}
      <div class="price-display" style="display: flex; align-items: baseline; gap: 0.5rem; margin-top: 0.75rem; margin-bottom: 1rem;">
        <span style="font-size: 2rem; font-weight: 700; color: var(--accent-gold, #f39c12);">
          ${fmtVND(price)}
        </span>
        <span style="font-size: 1rem; font-weight: 500; color: var(--text-muted, #666);">
          /tháng
        </span>
      </div>
      
      <div style="margin: 1rem 0;">
        <h3 style="margin-bottom: 0.5rem; color: var(--text-primary);">Mô tả chi tiết</h3>
        <p style="color:var(--muted); line-height: 1.6; white-space: pre-wrap;">${description}</p>
      </div>

      <!-- Owner Contact Information -->
      <div class="owner-contact">
        <h3>
          <i class="fas fa-user-tie"></i>
          Thông tin liên hệ chủ nhà
        </h3>
        <div class="contact-info">
          <div class="contact-item">
            <div class="contact-icon">
              <i class="fas fa-user"></i>
            </div>
            <div class="contact-details">
              <div class="contact-label">Tên chủ nhà</div>
              <div class="contact-value">${ownerInfo.name}</div>
            </div>
          </div>
          
          ${ownerInfo.phone && ownerInfo.phone !== 'Chưa cập nhật' ? `
          <div class="contact-item">
            <div class="contact-icon">
              <i class="fas fa-phone"></i>
            </div>
            <div class="contact-details">
              <div class="contact-label">Số điện thoại</div>
              <div class="contact-value">${ownerInfo.phone}</div>
            </div>
            <button class="contact-action" onclick="window.open('tel:${ownerInfo.phone}')">
              <i class="fas fa-phone"></i> Gọi ngay
            </button>
          </div>
          ` : ''}
          
          ${ownerInfo.email && ownerInfo.email !== 'Chưa cập nhật' ? `
          <div class="contact-item">
            <div class="contact-icon">
              <i class="fas fa-envelope"></i>
            </div>
            <div class="contact-details">
              <div class="contact-label">Email</div>
              <div class="contact-value">${ownerInfo.email}</div>
            </div>
            <button class="contact-action" onclick="window.open('mailto:${ownerInfo.email}')">
              <i class="fas fa-envelope"></i> Gửi email
            </button>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div id="request-area"></div>
    </div>
  </div>`;
  
  // Initialize gallery if multiple images
  if (images.length > 1) {
    window.currentImageIndex = 0;
    window.totalImages = images.length;
  }
  
  // Store room images globally for lightbox
  window.roomImages = images;
  window.lightboxCurrentIndex = 0;
  
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
      
      // Validate tenant information before sending request
      await validateBeforeRental(async (profile) => {
        // User has all required info, proceed with rental request
        const msg = qs("#message").value.trim();
        try {
          const contractData = {
            room: r.id,
            notes: msg
          };
          
          await api.createContract(contractData);
          
          // Send notification to owners (simulate - in real app this would be done on backend)
          if (window.notificationSystem) {
            const user = currentUser();
            window.notificationSystem.notifyRentalRequest(
              user.full_name || user.username, 
              r.name || `Phòng ${r.id}`
            );
          }
          
          alert("Đã gửi yêu cầu thuê phòng!");
          window.location.href = "dashboard.html";
        } catch (error) {
          console.error('Error creating contract request:', error);
          alert("Có lỗi xảy ra khi gửi yêu cầu: " + error.message);
        }
      }, (validation) => {
        // Validation failed, error already shown by validateBeforeRental
        console.log('Validation failed:', validation);
      });
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

// Lightbox functions
function openLightbox(index) {
  if (!window.roomImages || window.roomImages.length === 0) return;
  
  window.lightboxCurrentIndex = index;
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxCurrent = document.getElementById('lightbox-current');
  const lightboxTotal = document.getElementById('lightbox-total');
  
  lightboxImage.src = window.roomImages[index];
  lightboxCurrent.textContent = index + 1;
  lightboxTotal.textContent = window.roomImages.length;
  
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
  
  // Hide navigation buttons if only one image
  const prevBtn = lightbox.querySelector('.lightbox-nav.prev');
  const nextBtn = lightbox.querySelector('.lightbox-nav.next');
  if (window.roomImages.length <= 1) {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
  } else {
    prevBtn.style.display = 'flex';
    nextBtn.style.display = 'flex';
  }
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.remove('active');
  document.body.style.overflow = 'auto'; // Restore scrolling
}

function lightboxChangeImage(direction) {
  if (!window.roomImages || window.roomImages.length <= 1) return;
  
  window.lightboxCurrentIndex += direction;
  
  if (window.lightboxCurrentIndex >= window.roomImages.length) {
    window.lightboxCurrentIndex = 0;
  } else if (window.lightboxCurrentIndex < 0) {
    window.lightboxCurrentIndex = window.roomImages.length - 1;
  }
  
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxCurrent = document.getElementById('lightbox-current');
  
  lightboxImage.src = window.roomImages[window.lightboxCurrentIndex];
  lightboxCurrent.textContent = window.lightboxCurrentIndex + 1;
}

// Close lightbox when clicking outside the image
document.getElementById('lightbox').addEventListener('click', function(event) {
  if (event.target === this) {
    closeLightbox();
  }
});

// Keyboard navigation for lightbox
document.addEventListener('keydown', function(event) {
  const lightbox = document.getElementById('lightbox');
  if (lightbox.classList.contains('active')) {
    if (event.key === 'Escape') {
      closeLightbox();
    } else if (event.key === 'ArrowLeft') {
      lightboxChangeImage(-1);
    } else if (event.key === 'ArrowRight') {
      lightboxChangeImage(1);
    }
  }
});
