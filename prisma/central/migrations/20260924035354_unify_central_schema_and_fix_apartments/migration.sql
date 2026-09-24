/*
  Warnings:

  - You are about to drop the column `apartment_number` on the `apartments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[residential_complex_id,tower,unit_number]` on the table `apartments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "amenities_residential_complex_id_idx";

-- DropIndex
DROP INDEX "amenity_bookings_amenity_id_booking_date_idx";

-- DropIndex
DROP INDEX "apartments_residential_complex_id_unit_number_key";

-- DropIndex
DROP INDEX "visitors_residential_complex_id_idx";

-- AlterTable
ALTER TABLE "apartments" DROP COLUMN "apartment_number";

-- CreateIndex
CREATE INDEX "amenities_residential_complex_id_status_idx" ON "amenities"("residential_complex_id", "status");

-- CreateIndex
CREATE INDEX "amenity_bookings_amenity_id_booking_date_status_idx" ON "amenity_bookings"("amenity_id", "booking_date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "apartments_residential_complex_id_tower_unit_number_key" ON "apartments"("residential_complex_id", "tower", "unit_number");

-- CreateIndex
CREATE INDEX "correspondence_residential_complex_id_unit_number_idx" ON "correspondence"("residential_complex_id", "unit_number");
