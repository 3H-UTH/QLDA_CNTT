# Rental Management API

## Tổng quan

Dự án này là một hệ thống quản lý phòng trọ sử dụng Django, Django REST Framework và JWT cho xác thực. API tuân thủ chuẩn OpenAPI và hỗ trợ các chức năng quản lý người dùng, phòng trọ, đăng nhập/đăng ký, và tài liệu API tự động.

## Tiến độ hiện tại

- Đã tạo cấu trúc dự án Django với các app: `core` (quản lý phòng, tòa nhà), `accounts` (người dùng).
- Đã xây dựng mô hình dữ liệu cho User, Building, Room.
- Đã cấu hình xác thực JWT (login, refresh token).
- Đã tạo endpoint đăng ký, đăng nhập, refresh token cho người dùng.
- Đã tạo endpoint quản lý phòng trọ (CRUD, filter theo tên, trạng thái).
- Đã tích hợp drf-spectacular để sinh tài liệu API tự động (Swagger, Redoc).
- Đã có lệnh seed dữ liệu mẫu cho user, building, room.
- Đã cấu hình kết nối MySQL.
- Đã có file openapi.yaml mô tả các endpoint chính.

## Hướng dẫn chạy dự án

1. **Cài đặt package**
    ```sh
    pip install -r requirements.txt
    ```

2. **Tạo database và migrate**
    ```sh
    python manage.py migrate
    ```

3. **Seed dữ liệu mẫu**
    ```sh
    python manage.py seed_data --fresh
    ```

4. **Chạy server**
    ```sh
    python manage.py runserver
    ```

5. **Truy cập tài liệu API**
    - Swagger: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
    - Redoc: [http://localhost:8000/api/redoc/](http://localhost:8000/api/redoc/)

## Các endpoint chính

- Đăng ký: `POST /api/auth/register/`
- Đăng nhập: `POST /api/auth/login/`
- Refresh token: `POST /api/auth/refresh/`
- Danh sách phòng: `GET /api/rooms/`
- Tạo phòng: `POST /api/rooms/`

## Liên hệ

- Admin mặc định: `admin@example.com` / `Admin12345!`