# JEBus Ticket

Đây là source code hệ thống đặt vé trực tuyến JEBus gồm hai phần:
- `backend/`: API server Node.js + Express + MySQL
- `frontend/`: ứng dụng React + Vite

## Yêu cầu môi trường

- Node.js 18 hoặc cao hơn
- npm 10 hoặc cao hơn
- MySQL / MariaDB 8.x hoặc tương thích
- Windows / macOS / Linux

## Cài đặt

### 1. Clone repository

```bash
git clone <repo-url>
cd jebus-ticket
```

### 2. Cài dependencies backend

```bash
cd backend
npm install
```

### 3. Cài dependencies frontend

```bash
cd ../frontend
npm install
```

## Cấu hình backend

### 1. Tạo file `.env`

Sao chép file mẫu `backend/.env.example` thành `backend/.env` và chỉnh thông tin như sau:

```text
ENV=local
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=jebus_ticket
PORT=5000
```

Hoặc nếu dùng `DB_URI`:

```text
ENV=production
DB_URI=mysql://user:password@host:port/database
PORT=5000
```

### 2. Tạo cơ sở dữ liệu

Sử dụng file `backend/db.sql` để tạo schema và `backend/seed.sql` để nạp dữ liệu mẫu khi cần.

Ví dụ với MySQL:

```bash
mysql -u root -p < backend/db.sql
mysql -u root -p < backend/seed.sql
```

## Chạy chương trình

### 1. Khởi động backend

```bash
cd backend
npm run dev
```

Server sẽ chạy mặc định tại `http://localhost:5000` và API tại `http://localhost:5000/api`.

### 2. Khởi động frontend

```bash
cd ../frontend
npm run dev
```

Mở trình duyệt đến địa chỉ được hiển thị ( là `http://localhost:5173`).

## Kiểm tra chức năng

- Đăng ký / đăng nhập
- Tìm kiếm chuyến đi
- Đặt vé và xác nhận
- Hiển thị chi tiết chuyến đi
- Quản lý người dùng / operator nếu có trong báo cáo

## Build production

```bash
cd frontend
npm run build
```

## Lưu ý khi nộp bài

- Không đưa `node_modules` vào bài nộp.
- Không đưa file `.env` chứa mật khẩu vào repo.
- Giữ lại các file mã nguồn, schema SQL, script và tài liệu hướng dẫn.
- Nếu có dữ liệu hoặc tập tin thừa, loại bỏ trước khi nộp.
- Phù hợp với báo cáo/video: demo phần sử dụng, mã nguồn phải chạy đúng các chức năng đã mô tả.
