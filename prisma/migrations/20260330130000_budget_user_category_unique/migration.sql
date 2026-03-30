-- Unique (userId, category) was added in schema but missing from initial Budget migration.
-- IF NOT EXISTS keeps local DBs that already have this index (e.g. after db push) from failing.
CREATE UNIQUE INDEX IF NOT EXISTS "Budget_userId_category_key" ON "Budget"("userId", "category");
