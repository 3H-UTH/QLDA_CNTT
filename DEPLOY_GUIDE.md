# Hướng dẫn Deploy Backend Django lên Render

## 1. Chuẩn bị Repository

### Push code lên GitHub:
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

## 2. Tạo tài khoản Render

1. Truy cập [https://render.com](https://render.com)
2. Đăng ký tài khoản mới hoặc đăng nhập
3. Kết nối với GitHub account của bạn

## 3. Tạo PostgreSQL Database

1. Trong Render Dashboard, click "New +"
2. Chọn "PostgreSQL"
3. Điền thông tin:
   - Name: `rental-db` (hoặc tên bạn muốn)
   - Database: `rental`
   - User: `rental_user`
   - Region: Oregon (US West) - miễn phí
   - Plan: Free
4. Click "Create Database"
5. **Lưu lại Database URL** từ tab "Connect"

## 4. Tạo Web Service

1. Trong Render Dashboard, click "New +"
2. Chọn "Web Service"
3. Kết nối với GitHub repository của bạn
4. Điền thông tin:

### Build & Deploy Settings:
- **Environment**: Python 3
- **Build Command**: `bash build.sh` hoặc `chmod +x build.sh && ./build.sh`
- **Start Command**: `gunicorn rental.wsgi:application --bind 0.0.0.0:$PORT`

### Environment Variables:
Thêm các biến môi trường sau:

```
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=.onrender.com
DATABASE_URL=<your-postgres-database-url>
DJANGO_SETTINGS_MODULE=rental.settings_production
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Advanced Settings:
- **Auto-Deploy**: Yes
- **Branch**: main

## 5. Environment Variables cần thiết

| Variable | Value | Mô tả |
|----------|-------|-------|
| `SECRET_KEY` | Django secret key | Tạo tại https://djecrety.ir/ |
| `DEBUG` | `False` | Tắt debug mode |
| `ALLOWED_HOSTS` | `.onrender.com` | Domain được phép |
| `DATABASE_URL` | Postgres URL | Từ database đã tạo |
| `DJANGO_SETTINGS_MODULE` | `rental.settings_production` | Settings cho production |
| `CORS_ALLOWED_ORIGINS` | Frontend domain | Domain frontend |

## 6. Deploy

1. Click "Create Web Service"
2. Render sẽ tự động build và deploy
3. Kiểm tra logs để đảm bảo không có lỗi
4. Access app qua URL được cung cấp

## 7. Kiểm tra sau khi deploy

### Test API endpoints:
```
GET https://your-app.onrender.com/api/schema/
GET https://your-app.onrender.com/api/auth/
```

### Tạo superuser (nếu cần):
1. Vào Render Dashboard
2. Chọn web service
3. Mở Shell tab
4. Chạy: `python manage.py createsuperuser`

## 8. Cập nhật Frontend

Cập nhật API base URL trong frontend để trỏ đến Render URL:
```javascript
const API_BASE_URL = 'https://your-app.onrender.com/api';
```

## 9. Custom Domain (Optional)

1. Trong Render Dashboard, chọn web service
2. Vào Settings > Custom Domains
3. Thêm domain của bạn
4. Cập nhật DNS records theo hướng dẫn

## 10. Monitoring

- Kiểm tra logs thường xuyên trong Render Dashboard
- Setup alerts nếu cần
- Monitor database usage (Free tier có giới hạn)

## Troubleshooting

### Lỗi phổ biến:

1. **Build failed - "build.sh: command not found"**: 
   - Đổi Build Command thành: `bash build.sh`
   - Hoặc: `chmod +x build.sh && ./build.sh`

2. **Build failed**: Kiểm tra `requirements.txt` và `build.sh`
3. **Database connection**: Kiểm tra `DATABASE_URL`
4. **Static files**: Đảm bảo `whitenoise` được cấu hình đúng
5. **CORS errors**: Kiểm tra `CORS_ALLOWED_ORIGINS`

### Debug commands:
```bash
# Trong Render Shell
python manage.py check --deploy
python manage.py collectstatic --dry-run
python manage.py migrate --dry-run
```
