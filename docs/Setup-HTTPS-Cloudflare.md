# Hướng dẫn thiết lập HTTPS & Domain qua Cloudflare cho dự án TouchLove

Tài liệu này hướng dẫn chi tiết cách trỏ tên miền (Domain) về máy chủ AWS EC2 và cấu hình bảo mật HTTPS miễn phí thông qua Cloudflare. Giải pháp này dành riêng cho hệ thống chạy Docker với Frontend ở cổng `80` và Backend API ở cổng `5000`.

---

## Bước 1: Chuẩn bị máy chủ EC2
1. Đăng nhập vào AWS Console.
2. Cấp phát một **Elastic IP** và gắn (Associate) nó vào máy chủ EC2 đang chạy TouchLove.
   - *Lưu ý:* Điều này đảm bảo IP của máy chủ không bao giờ bị đổi khi khởi động lại.
3. Ghi lại địa chỉ Elastic IP (Ví dụ: `52.62.186.197`).
4. Mở port trên Security Group của EC2:
   - Port 80 (HTTP) - Source: `0.0.0.0/0`
   - Port 443 (HTTPS) - Source: `0.0.0.0/0`
   - Port 5000 (Custom TCP) - Source: `0.0.0.0/0`

---

## Bước 2: Khởi tạo trên Cloudflare
1. Đăng nhập vào [Cloudflare](https://dash.cloudflare.com/) và tạo tài khoản nếu chưa có.
2. Bấm **Add a Site** và nhập tên miền của bạn (VD: `touchlove.id.vn`). Chọn gói Free ($0).
3. Cloudflare sẽ quét các bản ghi DNS hiện tại. Bạn cứ bấm **Continue**.
4. Cloudflare sẽ cung cấp cho bạn 2 địa chỉ **Nameservers** (VD: `cartman.ns.cloudflare.com` và `joan.ns.cloudflare.com`).

---

## Bước 3: Đổi Nameservers tại nhà cung cấp tên miền (TenTen, iNet, v.v...)
1. Đăng nhập vào trang quản lý của nhà cung cấp tên miền.
2. Tìm đến mục **Cập nhật NS / Đổi Nameservers**.
3. Xóa các Nameservers mặc định cũ đi (VD: `ns-b1.tenten.vn`).
4. Dán 2 Nameservers mà Cloudflare vừa cấp vào và bấm **Cập nhật**.
5. Quay lại giao diện Cloudflare, bấm **Done, check nameservers**. Chờ khoảng 10-30 phút để quá trình chuyển đổi hoàn tất. Khi nào có chữ "Active" là thành công.

---

## Bước 4: Thiết lập các bản ghi DNS trên Cloudflare
Truy cập menu **DNS > Records** trên Cloudflare. Đảm bảo bạn có các bản ghi sau:

| Type | Name | IPv4 address (Value) | Proxy status | Ý nghĩa |
|---|---|---|---|---|
| A | `@` | IP của EC2 (VD: `52.62.186.197`) | ☁️ Proxied (Cam) | Trỏ tên miền chính về EC2 |
| CNAME | `www` | `touchlove.id.vn` | ☁️ Proxied (Cam) | Trỏ www về tên miền chính |
| A | `api` | IP của EC2 (VD: `52.62.186.197`) | ☁️ Proxied (Cam) | Dùng cho Backend API |
| A | `mail` | IP của EC2 (VD: `52.62.186.197`) | ☁️ DNS only (Xám)| Dùng cho Mail Server |
| MX | `@` | `mail.touchlove.id.vn` | DNS only | Cấu hình nhận mail |
| TXT | `@` | `v=spf1 mx a ip4:... ~all` | DNS only | Chống mail bị vào Spam |

---

## Bước 5: Tùy chỉnh chế độ mã hóa SSL/TLS (Rất Quan Trọng)
Do máy chủ EC2 của bạn đang hứng các request ở dạng HTTP thông thường, bạn bắt buộc phải cấu hình SSL ở chế độ Flexible.

1. Ở menu bên trái của Cloudflare, chọn **SSL/TLS > Overview**.
2. Chọn chế độ mã hóa là **Flexible**.
   - *Lưu ý:* Tuyệt đối không chọn Full hoặc Full (Strict) vì sẽ gây lỗi 522/520 do EC2 không có sẵn chứng chỉ SSL cục bộ.
3. Vào **SSL/TLS > Edge Certificates**:
   - Bật **Always Use HTTPS** sang ON.

---

## Bước 6: Xử lý lỗi sai cổng API bằng Origin Rules
Khi Frontend gọi lên `https://api.touchlove.id.vn`, Cloudflare mặc định sẽ điều hướng request đó vào cổng `80` của EC2 thay vì cổng `5000` của Backend. Để ép Cloudflare chuyển hướng đúng cổng:

1. Vào **Rules > Origin Rules**.
2. Bấm **Create rule**.
3. **Rule name**: Đặt tên bất kỳ (VD: `Route_API_to_Port_5000`).
4. **If incoming requests match...**:
   - Field: `Hostname`
   - Operator: `equals`
   - Value: `api.touchlove.id.vn`
5. **Destination Port**:
   - Chọn **Rewrite to...**
   - Nhập: `5000`
6. Bấm **Deploy**.

---

## Bước 7: Cập nhật URL trong mã nguồn và Triển khai
1. Mở file `docker-compose.yml` trên hệ thống.
2. Đảm bảo thay thế tất cả các cấu hình IP cũ thành Domain HTTPS mới:
   - `VITE_API_URL: "https://api.touchlove.id.vn/api"` (Frontend)
   - `Frontend__Url: "https://touchlove.id.vn"` (Backend)
3. Chạy lệnh tái khởi động trên EC2:
```bash
git pull
docker-compose down
docker-compose up -d --build
```

Website của bạn hiện đã được bảo mật HTTPS với ổ khóa xanh, tích hợp chống DDoS và nén dữ liệu hoàn toàn tự động!
