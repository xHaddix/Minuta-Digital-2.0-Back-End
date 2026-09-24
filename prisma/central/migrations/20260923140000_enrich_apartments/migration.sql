ALTER TABLE "apartments"
  ADD COLUMN "tower" TEXT,
  ADD COLUMN "apartment_number" TEXT,
  ADD COLUMN "unit_type" TEXT NOT NULL DEFAULT 'APARTMENT';

-- Preserve the current catalog values while introducing structured fields.
UPDATE "apartments"
SET "apartment_number" = "unit_number"
WHERE "apartment_number" IS NULL;

-- Create catalog entries for units already assigned to residents.
INSERT INTO "apartments" (
  "id",
  "residential_complex_id",
  "unit_number",
  "apartment_number",
  "unit_type",
  "status",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  resident_units."residential_complex_id",
  resident_units."unit_number",
  resident_units."unit_number",
  'APARTMENT',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "residential_complex_id", "unit_number"
  FROM "residents"
) AS resident_units
WHERE NOT EXISTS (
  SELECT 1
  FROM "apartments" AS apartment
  WHERE apartment."residential_complex_id" = resident_units."residential_complex_id"
    AND apartment."unit_number" = resident_units."unit_number"
);
