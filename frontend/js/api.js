// API configuration for connecting to Django backend
const API_BASE_URL = 'http://localhost:8000/api';

// API utility functions
const api = {
  // Generic API call function with token refresh
  async call(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    // Add authorization token if available
    const session = this.getSession();
    if (session && session.access) {
      config.headers.Authorization = `Bearer ${session.access}`;
    }

    try {
      const response = await fetch(url, config);
      
      // If unauthorized, try to refresh token
      if (response.status === 401 && session && session.refresh) {
        console.log('Token expired, attempting refresh...');
        try {
          await this.refreshToken();
          // Retry the original request with new token
          const newSession = this.getSession();
          if (newSession && newSession.access) {
            config.headers.Authorization = `Bearer ${newSession.access}`;
            const retryResponse = await fetch(url, config);
            if (!retryResponse.ok) {
              throw new Error(`HTTP error! status: ${retryResponse.status}`);
            }
            return await retryResponse.json();
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Clear invalid session and redirect to login
          this.clearSession();
          window.location.href = 'login.html';
          throw new Error('Session expired. Please login again.');
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  },

  // Refresh token function
  async refreshToken() {
    const session = this.getSession();
    if (!session || !session.refresh) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: session.refresh
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    // Update session with new access token
    const updatedSession = {
      ...session,
      access: data.access
    };
    
    this.setSession(updatedSession);
    localStorage.setItem('accessToken', data.access);
    
    return data;
  },

  // Room-related API calls
  async getRooms() {
    try {
      const data = await this.call('/rooms/');
      return data.results || data;
    } catch (error) {
      console.error('Failed to fetch rooms from API:', error);
      return [];
    }
  },

  async getRoom(id) {
    try {
      return await this.call(`/rooms/${id}/`);
    } catch (error) {
      console.error(`Failed to fetch room ${id}:`, error);
      return null;
    }
  },

  async createRoom(roomData) {
    try {
      return await this.call('/rooms/', {
        method: 'POST',
        body: JSON.stringify(roomData),
      });
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  },

  async createRoomWithFile(formData) {
    try {
      const session = this.getSession();
      const response = await fetch(`${API_BASE_URL}/rooms/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access}`
        },
        body: formData // Don't set Content-Type for FormData - browser will set it automatically
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create room with file:', error);
      throw error;
    }
  },

  async updateRoom(id, roomData) {
    try {
      return await this.call(`/rooms/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(roomData),
      });
    } catch (error) {
      console.error(`Failed to update room ${id}:`, error);
      throw error;
    }
  },

  async updateRoomWithFile(id, formData) {
    try {
      const session = this.getSession();
      const response = await fetch(`${API_BASE_URL}/rooms/${id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access}`
        },
        body: formData // Don't set Content-Type for FormData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to update room ${id} with file:`, error);
      throw error;
    }
  },

  async deleteRoom(id) {
    try {
      return await this.call(`/rooms/${id}/`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`Failed to delete room ${id}:`, error);
      throw error;
    }
  },

  // Contract-related API calls
  async getContracts() {
    try {
      const data = await this.call('/contracts/');
      return data.results || data;
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      return [];
    }
  },

  // Authentication API calls
  async login(email, password) {
    try {
      const response = await this.call('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ 
          username: email,  // Send username field (which is email in our case)
          password: password 
        }),
      });
      
      if (response.access) {
        // Store tokens in localStorage for compatibility
        localStorage.setItem('accessToken', response.access);
        localStorage.setItem('refreshToken', response.refresh);
        
        // Store session data with user info
        this.setSession({
          access: response.access,
          refresh: response.refresh,
          email: response.user.email,
          fullName: response.user.full_name,
          role: response.user.role,
          id: response.user.id,
        });
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  async register(userData) {
    try {
      return await this.call('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  // Session management
  getSession() {
    try {
      return JSON.parse(localStorage.getItem('rf_session') || 'null');
    } catch {
      return null;
    }
  },

  setSession(sessionData) {
    localStorage.setItem('rf_session', JSON.stringify(sessionData));
  },

  clearSession() {
    localStorage.removeItem('rf_session');
  },

  // Check if user is authenticated
  isAuthenticated() {
    const session = this.getSession();
    return session && session.access;
  },

  // Format currency (Vietnamese Dong)
  formatVND(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  },
};

// Backward compatibility functions (if any old code still uses these)
function getRooms() {
  console.warn('getRooms() is deprecated. Use api.getRooms() instead.');
  return api.getRooms();
}

function getUsers() {
  console.warn('getUsers() is deprecated. Using localStorage fallback.');
  try {
    return JSON.parse(localStorage.getItem('rf_users') || '[]');
  } catch {
    return [];
  }
}

function setUsers(users) {
  console.warn('setUsers() is deprecated. Using localStorage fallback.');
  localStorage.setItem('rf_users', JSON.stringify(users));
}

function getContracts() {
  console.warn('getContracts() is deprecated. Use api.getContracts() instead.');
  return api.getContracts();
}

function setContracts(contracts) {
  console.warn('setContracts() is deprecated. Using localStorage fallback.');
  localStorage.setItem('rf_contracts', JSON.stringify(contracts));
}

function getRequests() {
  console.warn('getRequests() is deprecated. Using localStorage fallback.');
  try {
    return JSON.parse(localStorage.getItem('rf_requests') || '[]');
  } catch {
    return [];
  }
}

function setRequests(requests) {
  console.warn('setRequests() is deprecated. Using localStorage fallback.');
  localStorage.setItem('rf_requests', JSON.stringify(requests));
}

function getSession() {
  console.warn('getSession() is deprecated. Use api.getSession() instead.');
  return api.getSession();
}

function setSession(session) {
  console.warn('setSession() is deprecated. Use api.setSession() instead.');
  return api.setSession(session);
}

function clearSession() {
  console.warn('clearSession() is deprecated. Use api.clearSession() instead.');
  return api.clearSession();
}

// Export for ES6 modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}
