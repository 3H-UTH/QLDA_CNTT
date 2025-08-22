function currentUser() {
  try {
    // First try to get from API session
    if (window.api && api.getSession) {
      const apiUser = api.getSession();
      if (apiUser) {
        console.log('Got user from API:', apiUser);
        return apiUser;
      }
    }
    
    // Fallback to localStorage
    const userData = localStorage.getItem('currentUser');
    console.log('Raw currentUser from localStorage:', userData);
    
    if (userData) {
      const parsed = JSON.parse(userData);
      console.log('Parsed currentUser:', parsed);
      return parsed;
    }
    
    console.log('No currentUser found');
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

function requireAuth(roles = null) {
  console.log('requireAuth called with roles:', roles);
  const u = currentUser();
  console.log('Current user in requireAuth:', u);
  
  if (!u) {
    console.log('No user found, redirecting to login');
    window.location.href =
      "login.html?next=" + encodeURIComponent(location.pathname);
    return null;
  }
  
  if (roles && Array.isArray(roles)) {
    console.log('Checking if user role', u.role, 'is in allowed roles:', roles);
    console.log('includes result:', roles.includes(u.role));
    
    if (!roles.includes(u.role)) {
      console.log('User role not authorized:', u.role, 'Required:', roles);
      alert(`Bạn không có quyền truy cập. Role hiện tại: ${u.role}, Cần: ${roles.join(', ')}`);
      window.location.href = "index.html";
      return null;
    }
  }
  
  console.log('Auth successful for user:', u);
  return u;
}
async function login(username, password) {
  try {
    console.log('Attempting login with:', { username });
    
    // Use the API client for login
    const data = await api.login(username, password);
    
    console.log('Login successful:', data);
    
    // Trigger custom event to update navbar
    window.dispatchEvent(new CustomEvent('userLogin'));
    
    return data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

function logout() {
  api.clearSession();
  window.location.href = "index.html";
}

async function register({ fullName, username, email, password, passwordConfirm }) {
  try {
    console.log('Attempting register with:', { email, username, fullName });

    // Use the API client for registration
    const data = await api.register({
      email: email,
      username: username,
      fullName: fullName,           // Keep as fullName for API function
      role: "TENANT",
      password: password,
      passwordConfirm: passwordConfirm  // Keep as passwordConfirm for API function
    });

    console.log('Registration successful:', data);
    
    // Trigger custom event to update navbar
    window.dispatchEvent(new CustomEvent('userLogin'));
    
    return data;
    
  } catch (error) {
    console.error('Registration failed:', error);
    
    // Handle specific error messages
    if (error.message.includes('already exists') || error.message.includes('đã được đăng ký')) {
      throw new Error("Email này đã được đăng ký! Vui lòng sử dụng email khác.");
    }
    
    throw error;
  }
}
