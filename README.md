# TouchLove — Hệ thống quà tặng couple NFC

TouchLove là nền tảng kết hợp móc khóa len gắn chip NFC và website cá nhân hóa cho cặp đôi.

## Tech Stack
- **Backend**: ASP.NET Core 10, EF Core, PostgreSQL, Redis, Hangfire.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS.
- **Infrastructure**: Docker Compose.

## Các tính năng chính
- **Cá nhân hóa**: Trang riêng cho cặp đôi với đếm ngược kỷ niệm.
- **Thông điệp hàng ngày**: AI gợi ý tin nhắn yêu thương mỗi sáng.
- **Admin Panel**: Quản lý người dùng và mã định danh NFC hàng loạt.
- **Lịch sử & Bookmark**: Lưu giữ và xem lại các kỷ niệm ngọt ngào.

## Chạy Local (Docker)
1. Sao chép `.env.example` thành `.env`.
2. Chạy lệnh:
   ```bash
   docker-compose up --build
   ```
3. Truy cập:
   - Frontend: `http://localhost:3000`
   - Admin Panel: `http://localhost:3000/admin`
   - Backend API: `http://localhost:5000/swagger`
   - Hangfire Dashboard: `http://localhost:5000/hangfire`

## Tài khoản thử nghiệm
- **Admin**: `admin@touchlove.local` / `Admin@123456`
- **User**: `user1@test.local` / `Test@123456`
