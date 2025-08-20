function currentUser() {
  return api.getSession();
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
async function login(email, password) {
  try {
    console.log('Attempting login with:', { email });
    
    // Use the new API client for login
    const data = await api.login(email, password);
    
    console.log('Login successful:', data);
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
async function register({ fullName, email, password, passwordConfirm }) {
  try {
    console.log('Attempting register with:', { email, fullName });

    // Use the new API client for registration
    await api.register({
      email: email,
      full_name: fullName,
      role: "TENANT",
      password: password,
      password_confirm: passwordConfirm
    });

    console.log('Registration successful');
    
    // Sau khi đăng ký thành công, tự động đăng nhập
    return await login(email, password);
    
  } catch (error) {
    console.error('Registration failed:', error);
    
    // Handle specific error messages
    if (error.message.includes('already exists')) {
      throw new Error("Email này đã được đăng ký! Vui lòng sử dụng email khác.");
    }
    
    throw error;
  }
}
