-- Make visitor identity and destination fields optional.
ALTER TABLE "visitors"
  ALTER COLUMN "document_number" DROP NOT NULL,
  ALTER COLUMN "unit_target" DROP NOT NULL;

-- Add the document type and the authenticated creator of each visit.
ALTER TABLE "visitors"
  ADD COLUMN "document_type" TEXT,
  ADD COLUMN "created_by_id" TEXT;

-- Preserve existing records before enforcing the new ownership relation.
UPDATE "visitors" AS visitor
SET "created_by_id" = COALESCE(
  visitor."authorizer_user_id",
  (
    SELECT account."id"
    FROM "users" AS account
    WHERE account."residential_complex_id" = visitor."residential_complex_id"
    ORDER BY account."created_at" ASC
    LIMIT 1
  )
)
WHERE visitor."created_by_id" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "visitors" WHERE "created_by_id" IS NULL) THEN
    RAISE EXCEPTION 'No se pudo asignar created_by_id a todos los visitantes existentes';
  END IF;
END $$;

ALTER TABLE "visitors"
  ALTER COLUMN "created_by_id" SET NOT NULL;

ALTER TABLE "visitors"
  ADD CONSTRAINT "visitors_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "visitors_residential_complex_id_entry_time_idx";
CREATE INDEX "visitors_residential_complex_id_idx"
  ON "visitors"("residential_complex_id");
CREATE INDEX "visitors_residential_complex_id_exit_time_idx"
  ON "visitors"("residential_complex_id", "exit_time");
