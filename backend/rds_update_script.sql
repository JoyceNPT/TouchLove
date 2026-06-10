START TRANSACTION;

-- 1. Đổi tên IsActive cũ thành IsSalesActive để tận dụng data hiện có
ALTER TABLE "AspNetUsers" RENAME COLUMN "IsActive" TO "IsSalesActive";

-- 2. Thêm cột IsNfcActive mới và mặc định là TRUE (Không bị khoá)
ALTER TABLE "AspNetUsers" ADD "IsNfcActive" boolean NOT NULL DEFAULT TRUE;

-- 3. Cập nhật lại toàn bộ user cũ (nếu có) để có quyền truy cập NFC mặc định
UPDATE "AspNetUsers" SET "IsNfcActive" = TRUE;

-- 4. Lưu lại lịch sử Migration cho EF Core nhận diện
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260610171420_SplitUserActiveFlags', '10.0.7');

COMMIT;