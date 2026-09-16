-- CreateTable
CREATE TABLE "residents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "residential_complex_id" TEXT NOT NULL,
    "unit_number" TEXT NOT NULL,
    "is_owner" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "residents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitors" (
    "id" TEXT NOT NULL,
    "residential_complex_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "document_number" TEXT NOT NULL,
    "unit_target" TEXT NOT NULL,
    "entry_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exit_time" TIMESTAMP(3),
    "authorizer_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correspondence" (
    "id" TEXT NOT NULL,
    "residential_complex_id" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "unit_number" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),
    "delivered_to_user_id" TEXT,

    CONSTRAINT "correspondence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" TEXT NOT NULL,
    "residential_complex_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenity_bookings" (
    "id" TEXT NOT NULL,
    "amenity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "booking_date" TIMESTAMP(3) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amenity_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pqrs_tickets" (
    "id" TEXT NOT NULL,
    "residential_complex_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ticket_type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pqrs_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_posts" (
    "id" TEXT NOT NULL,
    "residential_complex_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "image_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "residents_residential_complex_id_unit_number_idx" ON "residents"("residential_complex_id", "unit_number");

-- CreateIndex
CREATE INDEX "residents_user_id_idx" ON "residents"("user_id");

-- CreateIndex
CREATE INDEX "visitors_residential_complex_id_entry_time_idx" ON "visitors"("residential_complex_id", "entry_time");

-- CreateIndex
CREATE INDEX "correspondence_residential_complex_id_status_idx" ON "correspondence"("residential_complex_id", "status");

-- CreateIndex
CREATE INDEX "amenities_residential_complex_id_idx" ON "amenities"("residential_complex_id");

-- CreateIndex
CREATE INDEX "amenity_bookings_amenity_id_booking_date_idx" ON "amenity_bookings"("amenity_id", "booking_date");

-- CreateIndex
CREATE INDEX "amenity_bookings_user_id_idx" ON "amenity_bookings"("user_id");

-- CreateIndex
CREATE INDEX "pqrs_tickets_residential_complex_id_status_idx" ON "pqrs_tickets"("residential_complex_id", "status");

-- CreateIndex
CREATE INDEX "pqrs_tickets_user_id_idx" ON "pqrs_tickets"("user_id");

-- CreateIndex
CREATE INDEX "marketplace_posts_residential_complex_id_status_idx" ON "marketplace_posts"("residential_complex_id", "status");

-- CreateIndex
CREATE INDEX "marketplace_posts_user_id_idx" ON "marketplace_posts"("user_id");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_residential_complex_id_fkey" FOREIGN KEY ("residential_complex_id") REFERENCES "residential_complexes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_residential_complex_id_fkey" FOREIGN KEY ("residential_complex_id") REFERENCES "residential_complexes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_authorizer_user_id_fkey" FOREIGN KEY ("authorizer_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondence" ADD CONSTRAINT "correspondence_residential_complex_id_fkey" FOREIGN KEY ("residential_complex_id") REFERENCES "residential_complexes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondence" ADD CONSTRAINT "correspondence_delivered_to_user_id_fkey" FOREIGN KEY ("delivered_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenities" ADD CONSTRAINT "amenities_residential_complex_id_fkey" FOREIGN KEY ("residential_complex_id") REFERENCES "residential_complexes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenity_bookings" ADD CONSTRAINT "amenity_bookings_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenity_bookings" ADD CONSTRAINT "amenity_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pqrs_tickets" ADD CONSTRAINT "pqrs_tickets_residential_complex_id_fkey" FOREIGN KEY ("residential_complex_id") REFERENCES "residential_complexes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pqrs_tickets" ADD CONSTRAINT "pqrs_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_posts" ADD CONSTRAINT "marketplace_posts_residential_complex_id_fkey" FOREIGN KEY ("residential_complex_id") REFERENCES "residential_complexes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_posts" ADD CONSTRAINT "marketplace_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
