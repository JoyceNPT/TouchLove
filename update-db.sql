UPDATE "AppPolicies" 
SET "Content" = pg_read_file('/tmp/priv_vi.md')
WHERE "Code" = 'PRIVACY' AND "Language" = 'vi';

UPDATE "AppPolicies" 
SET "Content" = pg_read_file('/tmp/terms_vi.md')
WHERE "Code" = 'TERMS' AND "Language" = 'vi';
