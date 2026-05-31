UPDATE "AppPolicies" 
SET "Content" = pg_read_file('/tmp/priv_en.md')
WHERE "Code" = 'PRIVACY' AND "Language" = 'en';

UPDATE "AppPolicies" 
SET "Content" = pg_read_file('/tmp/terms_en.md')
WHERE "Code" = 'TERMS' AND "Language" = 'en';
