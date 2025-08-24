// API Client for 3H Rental
class RentalAPI {
  constructor() {
    // Use same origin to avoid CORS issues
    this.baseURL = 'http://127.0.0.1:8000/api';
    this.token = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  // Helper method to make API calls
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      // Handle 401 - try refresh token
      if (response.status === 401 && this.refreshToken) {
        await this.refreshAccessToken();
        // Retry with new token
        config.headers['Authorization'] = `Bearer ${this.token}`;
        const retryResponse = await fetch(url, config);
        return await this.handleResponse(retryResponse);
      }

      return await this.handleResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      console.error('API Error:', response.status, data);
      // Handle validation errors more specifically
      if (response.status === 400 && data) {
        if (typeof data === 'object') {
          // If it's a validation error object, format it nicely
          const errorMessages = [];
          Object.keys(data).forEach(field => {
            if (Array.isArray(data[field])) {
              errorMessages.push(`${field}: ${data[field].join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${data[field]}`);
            }
          });
          throw new Error(errorMessages.join('\n'));
        }
      }
      throw new Error(data.detail || data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // Auth methods
  async login(username, password) {
    const data = await this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ 
        username,
        password 
      }),
    });

    console.log('Login API response:', data);

    this.token = data.access;
    this.refreshToken = data.refresh;
    
    localStorage.setItem('access_token', this.token);
    localStorage.setItem('refresh_token', this.refreshToken);
    
    // Check if user data exists
    if (data.user) {
      console.log('Setting currentUser:', data.user);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    } else {
      console.error('No user data in login response:', data);
    }

    return data;
  }

  async refreshAccessToken() {
    try {
      const data = await this.request('/auth/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh: this.refreshToken }),
      });

      this.token = data.access;
      localStorage.setItem('access_token', this.token);
      return data;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Clear session if refresh fails
      this.clearSession();
      throw error;
    }
  }

  async register(userData) {
    const data = await this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({
        email: userData.email,
        username: userData.username,
        password: userData.password,
        password_confirm: userData.passwordConfirm,  // Map passwordConfirm -> password_confirm
        full_name: userData.fullName,                // Map fullName -> full_name
        role: 'TENANT' // Mặc định role là TENANT
      }),
    });
    
    // Store tokens if provided
    if (data.access) {
      this.token = data.access;
      this.refreshToken = data.refresh;
      localStorage.setItem('access_token', this.token);
      localStorage.setItem('refresh_token', this.refreshToken);
    }
    
    // Store user data
    if (data.user) {
      localStorage.setItem('currentUser', JSON.stringify(data.user));
    }
    
    return data;
  }

  // Session management
  getSession() {
    try {
      const userData = localStorage.getItem('currentUser');
      console.log('getSession - raw userData:', userData);
      const result = userData ? JSON.parse(userData) : null;
      console.log('getSession - parsed result:', result);
      return result;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  clearSession() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('currentUser');
  }

  // Room methods
  async getRooms() {
    return await this.request('/rooms/');
  }

  async getRoom(id) {
    return await this.request(`/rooms/${id}/`);
  }

  async createRoom(roomData) {
    return await this.request('/rooms/', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateRoom(id, roomData) {
    return await this.request(`/rooms/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  }

  async deleteRoom(id) {
    return await this.request(`/rooms/${id}/`, {
      method: 'DELETE',
    });
  }

  // Room methods with file upload support - DEPRECATED
  // These methods are kept for backward compatibility but should not be used
  // All new implementations should use createRoom/updateRoom with base64 images
  async createRoomWithFile(formData) {
    console.warn('createRoomWithFile is deprecated. Use createRoom with images_base64 instead.');
    // Convert FormData to regular object and handle images as base64
    const roomData = {};
    const imageFiles = [];
    
    for (let [key, value] of formData.entries()) {
      if (key === 'images') {
        imageFiles.push(value);
      } else {
        roomData[key] = value;
      }
    }
    
    // Convert images to base64
    if (imageFiles.length > 0) {
      const base64Images = [];
      for (const file of imageFiles) {
        const base64 = await this.convertFileToBase64(file);
        base64Images.push(base64);
      }
      roomData.images_base64 = base64Images;
    }
    
    return await this.createRoom(roomData);
  }

  async updateRoomWithFile(id, formData) {
    console.warn('updateRoomWithFile is deprecated. Use updateRoom with images_base64 instead.');
    // Convert FormData to regular object and handle images as base64
    const roomData = {};
    const imageFiles = [];
    
    for (let [key, value] of formData.entries()) {
      if (key === 'images') {
        imageFiles.push(value);
      } else {
        roomData[key] = value;
      }
    }
    
    // Convert images to base64
    if (imageFiles.length > 0) {
      const base64Images = [];
      for (const file of imageFiles) {
        const base64 = await this.convertFileToBase64(file);
        base64Images.push(base64);
      }
      roomData.images_base64 = base64Images;
    }
    
    return await this.updateRoom(id, roomData);
  }

  // Helper method to convert file to base64
  convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Contract methods
  async getContracts() {
    return await this.request('/contracts/');
  }

  async getContract(id) {
    return await this.request(`/contracts/${id}/`);
  }

  async createContract(contractData) {
    console.log('Sending contract data:', contractData);
    
    return await this.request('/contracts/', {
      method: 'POST',
      body: JSON.stringify(contractData),
    });
  }

  // Create contract with file upload support - DEPRECATED
  // This method is kept for backward compatibility but should not be used
  // All new implementations should use createContract with contract_image_base64
  async createContractWithFile(formData) {
    console.warn('createContractWithFile is deprecated. Use createContract with contract_image_base64 instead.');
    // Convert FormData to regular object and handle image as base64
    const contractData = {};
    let imageFile = null;
    
    for (let [key, value] of formData.entries()) {
      if (key === 'contract_image') {
        imageFile = value;
      } else {
        contractData[key] = value;
      }
    }
    
    // Convert image to base64 if present
    if (imageFile && imageFile.size > 0) {
      const base64Image = await this.convertFileToBase64(imageFile);
      contractData.contract_image_base64 = base64Image;
    }
    
    return await this.createContract(contractData);
  }

  async updateContract(id, contractData) {
    return await this.request(`/contracts/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(contractData),
    });
  }

  async deleteContract(id) {
    return await this.request(`/contracts/${id}/`, {
      method: 'DELETE',
    });
  }

  // Meter reading methods
  async getMeterReadings(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/meter-readings/?${queryString}` : '/meter-readings/';
    return await this.request(endpoint);
  }

  async createMeterReading(readingData) {
    return await this.request('/meter-readings/', {
      method: 'POST',
      body: JSON.stringify(readingData),
    });
  }

  async updateMeterReading(id, readingData) {
    return await this.request(`/meter-readings/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(readingData),
    });
  }

  async deleteMeterReading(id) {
    return await this.request(`/meter-readings/${id}/`, {
      method: 'DELETE',
    });
  }

  // Invoice methods
  async getInvoices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/invoices/?${queryString}` : '/invoices/';
    return await this.request(endpoint);
  }

  async getInvoice(id) {
    return await this.request(`/invoices/${id}/`);
  }

  async createInvoice(invoiceData) {
    return await this.request('/invoices/', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  async generateInvoice(generateData) {
    return await this.request('/invoices/generate/', {
      method: 'POST',
      body: JSON.stringify(generateData),
    });
  }

  async updateInvoice(id, invoiceData) {
    return await this.request(`/invoices/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(invoiceData),
    });
  }

  async sendInvoice(id) {
    return await this.request(`/invoices/${id}/send/`, {
      method: 'PATCH',
    });
  }

  async markInvoicePaid(id) {
    return await this.request(`/invoices/${id}/mark-paid/`, {
      method: 'PATCH',
    });
  }

  async markInvoiceOverdue(id) {
    return await this.request(`/invoices/${id}/mark-overdue/`, {
      method: 'PATCH',
    });
  }

  async cancelInvoice(id) {
    return await this.request(`/invoices/${id}/cancel/`, {
      method: 'PATCH',
    });
  }

  // Reports methods
  async getRevenueReport(fromPeriod, toPeriod) {
    return await this.request(`/reports/revenue/?from=${fromPeriod}&to=${toPeriod}`);
  }

  async getArrearsReport(period = null) {
    const endpoint = period ? `/reports/arrears/?period=${period}` : '/reports/arrears/';
    return await this.request(endpoint);
  }
  
  // RentalRequest methods
  async getRentalRequests(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/rental-requests/?${queryString}` : '/rental-requests/';
    return await this.request(endpoint);
  }
  
  async getRentalRequest(id) {
    return await this.request(`/rental-requests/${id}/`);
  }
  
  async createRentalRequest(requestData) {
    // Đảm bảo viewing_time được cung cấp
    if (!requestData.viewing_time) {
      throw new Error("Thời gian xem nhà là bắt buộc. Vui lòng chọn thời gian xem nhà.");
    }
    
    console.log('Sending rental request data:', requestData);
    
    return await this.request('/rental-requests/', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }
  
  async cancelRentalRequest(id) {
    return await this.request(`/rental-requests/${id}/cancel/`, {
      method: 'POST'
    });
  }

  async acceptRentalRequest(id) {
    return await this.request(`/rental-requests/${id}/accept/`, {
      method: 'POST'
    });
  }

  async declineRentalRequest(id) {
    return await this.request(`/rental-requests/${id}/decline/`, {
      method: 'POST'
    });
  }

  // Tenant methods
  async getTenants(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/tenants/?${queryString}` : '/tenants/';
    return await this.request(endpoint);
  }

  async getTenant(id) {
    return await this.request(`/tenants/${id}/`);
  }

  async createTenant(tenantData) {
    return await this.request('/tenants/', {
      method: 'POST',
      body: JSON.stringify(tenantData),
    });
  }

  async updateTenant(id, tenantData) {
    return await this.request(`/tenants/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(tenantData),
    });
  }

  async deleteTenant(id) {
    return await this.request(`/tenants/${id}/`, {
      method: 'DELETE',
    });
  }

  // User methods
  async getUser(id) {
    return await this.request(`/users/${id}/`);
  }

  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users/?${queryString}` : '/users/';
    return await this.request(endpoint);
  }
}

// Create global API instance
window.api = new RentalAPI();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RentalAPI;
}
