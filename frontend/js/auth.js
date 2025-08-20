function currentUser() {
  try {
    // Try API session first, fallback to localStorage
    if (window.api && api.getSession) {
      return api.getSession();
    }
    
    // Fallback to localStorage
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
function requireAuth(roles = null) {
  const u = currentUser();
  if (!u) {
    window.location.href =
      "login.html?next=" + encodeURIComponent(location.pathname);
    return null;
  }
  if (roles && !roles.includes(u.role)) {
    window.location.href = "index.html";
    return null;
  }
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
