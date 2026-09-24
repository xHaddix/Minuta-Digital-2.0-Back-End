CREATE TABLE "apartments" (
    "id" TEXT NOT NULL,
    "residential_complex_id" TEXT NOT NULL,
    "unit_number" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apartments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "apartments_residential_complex_id_unit_number_key"
  ON "apartments"("residential_complex_id", "unit_number");

CREATE INDEX "apartments_residential_complex_id_status_idx"
  ON "apartments"("residential_complex_id", "status");

ALTER TABLE "apartments"
  ADD CONSTRAINT "apartments_residential_complex_id_fkey"
  FOREIGN KEY ("residential_complex_id")
  REFERENCES "residential_complexes"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
