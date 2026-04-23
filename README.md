# TouchLove — Hệ thống quà tặng couple NFC

TouchLove là nền tảng kết hợp móc khóa len gắn chip NFC và website cá nhân hóa cho cặp đôi.

## Tech Stack
- **Backend**: ASP.NET Core 8, EF Core, PostgreSQL, Redis, Hangfire.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui.
- **Infrastructure**: Docker Compose.

## Chạy Local (Docker)
1. Sao chép `.env.example` thành `.env` và điền các API Key cần thiết.
2. Chạy lệnh:
   ```bash
   docker-compose up --build
   ```
3. Truy cập:
   - Frontend: `http://localhost:3000`
   - Swagger (Backend API): `http://localhost:5000/swagger`
   - Hangfire Dashboard: `http://localhost:5000/hangfire`
   - MailHog UI (Email): `http://localhost:8025`

## Phân quyền
- **Admin**: `admin@touchlove.local` / `Admin@123456`
- **User 1**: `user1@test.local` / `Test@123456`
- **User 2**: `user2@test.local` / `Test@123456`
