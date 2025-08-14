## Rental Management API

Dự án này là một hệ thống quản lý phòng trọ xây trên Django + Django REST Framework. API cung cấp chức năng quản lý người dùng, tòa nhà, phòng, đăng ký/đăng nhập (JWT), và tài liệu OpenAPI.

## Tiến độ hiện tại

- Cấu trúc dự án đã thiết lập với các app chính: `core` (business logic: Building, Room, v.v.) và `accounts` (User, authentication).
- Mô hình dữ liệu cơ bản (User, Building, Room) và migration đã tạo (xem `core/migrations`, `accounts/migrations`).
- Xác thực JWT đã triển khai (endpoints login/refresh/registration có trong `accounts`).
- Endpoints quản lý Room (CRUD) cùng một số filter cơ bản đã có trong `core.views` / `core.api`.
- Tích hợp drf-spectacular để sinh tài liệu OpenAPI; file `openapi.yaml` có sẵn và các route docs (Swagger/Redoc) được cấu hình.
- Có command seed dữ liệu mẫu: `management/commands/seed_data.py` (hỗ trợ --fresh).
- Kết nối cơ sở dữ liệu đã cấu hình (MySQL settings present in project settings).
- Có một số test skeletons trong `core/tests.py` và `accounts/tests.py`.

## Cần hoàn thiện (TODO)

- Viết unit/integration tests đầy đủ cho các endpoint chính (register/login, rooms CRUD, permission flows).
- Hoàn thiện validation và xử lý lỗi (nhiều trường hợp biên chưa đầy đủ).
- Thêm hướng dẫn cấu hình environment (mẫu `.env`) và script khởi tạo DB bằng Docker nếu cần.
- CI (GitHub Actions) và pipeline deploy chưa được thiết lập.

## Hướng dẫn chạy dự án (nhanh)

1. Cài dependencies:
```powershell
pip install -r requirements.txt
```

2. Thiết lập biến môi trường (ví dụ):
```powershell
# Sử dụng tên biến phổ biến; project sẽ đọc từ settings
$env:DJANGO_SECRET_KEY = "your-secret-key"
$env:DB_NAME = "your_db"
$env:DB_USER = "your_user"
$env:DB_PASSWORD = "your_password"
$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
```

3. Migrate database:
```powershell
python manage.py migrate
```

4. Seed dữ liệu (tùy chọn):
```powershell
python manage.py seed_data --fresh
```

5. Chạy server:
```powershell
python manage.py runserver
```

6. Truy cập tài liệu API:
- Swagger: http://localhost:8000/api/docs/
- Redoc: http://localhost:8000/api/redoc/

## Kiểm tra

Chạy test suite nhanh:
```powershell
python manage.py test
```

## Các endpoint chính (tổng quan)

- Đăng ký: POST /api/auth/register/
- Đăng nhập: POST /api/auth/login/
- Refresh token: POST /api/auth/refresh/
- Danh sách phòng: GET /api/rooms/
- Tạo phòng: POST /api/rooms/

## Số lượng API & chức năng

- Tổng endpoints chính (hiện tại, ước tính): 25 (bao gồm docs/schema)

- Auth (3):
	- POST /api/auth/register/  (register)
	- POST /api/auth/login/     (token obtain)
	- POST /api/auth/refresh/   (token refresh)

- Resources (ModelViewSet):
	- Rooms (`/api/rooms/`): 6 hành động chuẩn (list, retrieve, create, update, partial_update, destroy)
	- Contracts (`/api/contracts/`): 6 hành động chuẩn + 1 action tuỳ chỉnh `POST /api/contracts/{id}/end/` (kết thúc hợp đồng) => 7
	- MeterReadings (`/api/meter-readings/`): 6 hành động chuẩn

- Docs / Schema (3): `/api/schema/`, `/api/docs/`, `/api/redoc/`

- Tổng (tính tắt): 3 (auth) + 6 (rooms) + 7 (contracts) + 6 (meter-readings) + 3 (docs) = 25 endpoints

### Chức năng chính (tóm tắt)

- Quản lý phòng: CRUD, filter theo `status`, `building`; search theo `name`; ordering theo `id`, `area_m2`, `base_price`, `name`.
- Quản lý hợp đồng: CRUD, filter `status`, `room`, `tenant`, `billing_cycle`; search theo `room__name`, `tenant__user__full_name`, `tenant__user__email`; action kết thúc hợp đồng.
- Meter readings: CRUD, filter `contract`, `period`.
- Authentication: đăng ký, đăng nhập bằng email (JWT), refresh token.
- Tài liệu API tự động: drf-spectacular (OpenAPI), file `openapi.yaml` có sẵn.
- Seed dữ liệu mẫu: `python manage.py seed_data --fresh`.

### Bảo mật & permission

- `RoomViewSet`, `ContractViewSet`: permission_classes = `IsOwnerRole` (custom permission).
- `MeterReadingViewSet`: permission_classes = `IsAuthenticated`.
- JWT sử dụng `rest_framework_simplejwt`.

### Ghi chú nhanh

- Một số route đăng nhập/refresh được khai báo ở cả `accounts.urls` và `core.api` (ví dụ: `/api/auth/login/`), nên cân nhắc hợp nhất nếu cần tránh trùng lặp.
- Tests: có skeleton tests trong `core/tests.py` và `accounts/tests.py` — cần bổ sung test cho flows chính (auth, room CRUD, contract end-flow, meter readings).


## Góp ý & đóng góp

- Nếu muốn đóng góp: fork repo, tạo branch feature, viết test cho feature, rồi tạo PR.
- Liên hệ maintainer trong repo để xin thông tin cấu hình môi trường chi tiết.

## Trạng thái yêu cầu (tóm tắt)

- Sprint hiện tại: core API + auth — phần backend đã hoạt động ở mức cơ bản. Việc hoàn thiện test, validation, CI/CD và hướng dẫn triển khai còn đang tiến hành.