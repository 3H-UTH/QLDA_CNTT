// Tenant validation for rental requests
class TenantValidator {
  constructor() {
    this.requiredFields = ['id_number', 'address', 'phone'];
  }

  /**
   * Check if tenant has all required information for rental
   * @param {Object} user - User object from session
   * @returns {Object} - {isValid: boolean, missingFields: string[]}
   */
  async validateTenantInfo(user) {
    if (!user || user.role !== 'TENANT') {
      return {
        isValid: false,
        missingFields: ['Bạn cần đăng nhập với tài khoản tenant'],
        error: 'INVALID_ROLE'
      };
    }

    try {
      // Get full user profile from API
      const profile = await api.request(`/tenants/${user.id}/`);
      
      const missingFields = [];
      
      // Check required fields
      if (!profile.id_number || profile.id_number.trim() === '') {
        missingFields.push('Số CCCD/CMND');
      }
      
      if (!profile.address || profile.address.trim() === '') {
        missingFields.push('Địa chỉ thường trú');
      }
      
      if (!profile.phone || profile.phone.trim() === '') {
        missingFields.push('Số điện thoại');
      }

      return {
        isValid: missingFields.length === 0,
        missingFields: missingFields,
        profile: profile
      };
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {
        isValid: false,
        missingFields: ['Không thể kiểm tra thông tin người dùng'],
        error: 'API_ERROR'
      };
    }
  }

  /**
   * Show validation error and redirect to profile page
   * @param {string[]} missingFields - List of missing field names
   */
  showValidationError(missingFields) {
    const fieldList = missingFields.join(', ');
    const message = `Để gửi yêu cầu thuê nhà, bạn cần cập nhật các thông tin sau:\n\n${fieldList}\n\nBạn có muốn chuyển đến trang cá nhân để cập nhật thông tin không?`;
    
    if (confirm(message)) {
      window.location.href = 'profile.html';
    }
  }

  /**
   * Check validation before rental action
   * @param {Function} onSuccess - Callback when validation passes
   * @param {Function} onError - Optional callback when validation fails
   */
  async validateBeforeRental(onSuccess, onError) {
    const user = currentUser();
    if (!user) {
      alert('Vui lòng đăng nhập để thuê phòng');
      window.location.href = `login.html?next=${encodeURIComponent(window.location.href)}`;
      return;
    }

    if (user.role !== 'TENANT') {
      alert('Chỉ người thuê mới có thể gửi yêu cầu thuê phòng');
      return;
    }

    // Show loading
    const loadingMessage = document.createElement('div');
    loadingMessage.innerHTML = '<p>Đang kiểm tra thông tin...</p>';
    loadingMessage.style.position = 'fixed';
    loadingMessage.style.top = '50%';
    loadingMessage.style.left = '50%';
    loadingMessage.style.transform = 'translate(-50%, -50%)';
    loadingMessage.style.background = 'white';
    loadingMessage.style.padding = '1rem';
    loadingMessage.style.border = '1px solid #ccc';
    loadingMessage.style.borderRadius = '4px';
    loadingMessage.style.zIndex = '9999';
    document.body.appendChild(loadingMessage);

    try {
      const validation = await this.validateTenantInfo(user);
      document.body.removeChild(loadingMessage);
      
      if (validation.isValid) {
        // All good, proceed with rental
        if (onSuccess) {
          onSuccess(validation.profile);
        }
      } else {
        // Show validation error
        this.showValidationError(validation.missingFields);
        if (onError) {
          onError(validation);
        }
      }
    } catch (error) {
      document.body.removeChild(loadingMessage);
      console.error('Validation error:', error);
      alert('Có lỗi xảy ra khi kiểm tra thông tin. Vui lòng thử lại.');
      if (onError) {
        onError({isValid: false, error: error});
      }
    }
  }
}

// Create global instance
window.tenantValidator = new TenantValidator();

// Helper function for easy use
window.validateBeforeRental = async function(onSuccess, onError) {
  return await window.tenantValidator.validateBeforeRental(onSuccess, onError);
};
