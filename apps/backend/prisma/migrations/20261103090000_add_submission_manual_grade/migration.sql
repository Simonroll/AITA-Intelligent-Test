ALTER TABLE "submissions"
  ADD COLUMN IF NOT EXISTS "manualScore" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lecturerFeedback" TEXT,
  ADD COLUMN IF NOT EXISTS "gradedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "gradedById" TEXT;

CREATE INDEX IF NOT EXISTS "submissions_gradedById_idx" ON "submissions"("gradedById");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'submissions_gradedById_fkey'
  ) THEN
    ALTER TABLE "submissions"
      ADD CONSTRAINT "submissions_gradedById_fkey"
      FOREIGN KEY ("gradedById") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
