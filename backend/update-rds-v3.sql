START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260606052304_AddCoupleStorageTracking') THEN
    ALTER TABLE "Couples" ADD "UsedStorageBytes" bigint NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260606052304_AddCoupleStorageTracking') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260606052304_AddCoupleStorageTracking', '10.0.7');
    END IF;
END $EF$;
COMMIT;

