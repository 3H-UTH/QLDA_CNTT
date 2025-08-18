function currentUser() {
  return db.getSession();
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
    console.log('Attempting login with:', { email, password });
    
    // Gọi API đăng nhập backend
    const res = await fetch("http://localhost:8000/api/auth/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: email,
        password: password,
      }),
    });

    console.log('API Response status:', res.status);
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error('Login error:', errorData);
      throw new Error(errorData.detail || "Email hoặc mật khẩu không đúng");
    }

    const data = await res.json();
    console.log('Login successful:', data);

    // Lưu token vào localStorage
    localStorage.setItem('accessToken', data.access);
    localStorage.setItem('refreshToken', data.refresh);

    // Lưu thông tin session
    db.setSession({
      access: data.access,
      refresh: data.refresh,
      email: email,
    });

    return data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
function logout() {
  db.clearSession();
  window.location.href = "index.html";
}
async function register({ fullName, email, password, passwordConfirm }) {
  try {
    console.log('Attempting register with:', { email, fullName });

    // Gọi API đăng ký backend
    const res = await fetch("http://localhost:8000/api/auth/register/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        full_name: fullName,
        role: "OWNER",
        password: password,
        password_confirm: passwordConfirm
      }),
    });

    console.log('API Response status:', res.status);
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error('Register error:', errorData);
      
      // Kiểm tra lỗi email đã tồn tại
      if (errorData.email && errorData.email.includes('already exists')) {
        throw new Error("Email này đã được đăng ký! Vui lòng sử dụng email khác.");
      }
      if (errorData.email) {
        throw new Error(errorData.email[0]);
      }
      throw new Error(errorData.detail || "Đăng ký không thành công");
    }

    console.log('Registration successful');
    
    // Sau khi đăng ký thành công, tự động đăng nhập
    return await login(email, password);
    
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}
