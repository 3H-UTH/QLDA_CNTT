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

  // Room methods with file upload support
  async createRoomWithFile(formData) {
    const url = `${this.baseURL}/rooms/`;
    const config = {
      method: 'POST',
      body: formData, // Don't set Content-Type for FormData
    };

    // Add auth token if available
    if (this.token) {
      config.headers = {
        'Authorization': `Bearer ${this.token}`,
      };
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

  async updateRoomWithFile(id, formData) {
    const url = `${this.baseURL}/rooms/${id}/`;
    const config = {
      method: 'PUT',
      body: formData, // Don't set Content-Type for FormData
    };

    // Add auth token if available
    if (this.token) {
      config.headers = {
        'Authorization': `Bearer ${this.token}`,
      };
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

  // Contract methods
  async getContracts() {
    return await this.request('/contracts/');
  }

  async getContract(id) {
    return await this.request(`/contracts/${id}/`);
  }

  async createContract(contractData) {
    return await this.request('/contracts/', {
      method: 'POST',
      body: JSON.stringify(contractData),
    });
  }

  // Meter reading methods
  async getMeterReadings() {
    return await this.request('/meter-readings/');
  }

  async createMeterReading(readingData) {
    return await this.request('/meter-readings/', {
      method: 'POST',
      body: JSON.stringify(readingData),
    });
  }
}

// Create global API instance
window.api = new RentalAPI();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RentalAPI;
}
