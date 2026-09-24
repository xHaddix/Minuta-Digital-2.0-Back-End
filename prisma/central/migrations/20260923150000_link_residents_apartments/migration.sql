ALTER TABLE "residents"
  ADD COLUMN "apartment_id" TEXT;

UPDATE "residents" AS resident
SET "apartment_id" = apartment."id"
FROM "apartments" AS apartment
WHERE apartment."residential_complex_id" = resident."residential_complex_id"
  AND apartment."unit_number" = resident."unit_number";

CREATE INDEX "residents_apartment_id_idx"
  ON "residents"("apartment_id");

ALTER TABLE "residents"
  ADD CONSTRAINT "residents_apartment_id_fkey"
  FOREIGN KEY ("apartment_id") REFERENCES "apartments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
