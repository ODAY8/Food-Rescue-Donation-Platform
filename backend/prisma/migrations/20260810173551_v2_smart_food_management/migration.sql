-- CreateEnum
CREATE TYPE "StorageCondition" AS ENUM ('ROOM_TEMP', 'REFRIGERATED', 'FROZEN');

-- CreateEnum
CREATE TYPE "PackagingType" AS ENUM ('OPEN', 'SEALED', 'VACUUM_SEALED', 'CANNED');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('IN_STOCK', 'PARTIAL', 'DONATED', 'EXPIRED', 'REMOVED');

-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('ADD', 'ADJUST', 'DONATE', 'EXPIRE', 'REMOVE');

-- CreateEnum
CREATE TYPE "ScheduledDonationStatus" AS ENUM ('SCHEDULED', 'CLAIMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlatformEventType" AS ENUM ('SEARCH', 'RECOGNITION', 'LANGUAGE_CHANGE');

-- AlterTable
ALTER TABLE "foods" ADD COLUMN     "packaging" "PackagingType",
ADD COLUMN     "preparation_date" TIMESTAMP(3),
ADD COLUMN     "storageCondition" "StorageCondition",
ADD COLUMN     "temperature" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "expiry_predictions" (
    "id" UUID NOT NULL,
    "food_id" UUID NOT NULL,
    "features_hash" VARCHAR(64) NOT NULL,
    "urgency" "UrgencyLevel" NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "recommendation" VARCHAR(255) NOT NULL,
    "explanation" JSONB NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expiry_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_codes" (
    "id" UUID NOT NULL,
    "donation_id" UUID NOT NULL,
    "code" VARCHAR(48) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "scans_count" INTEGER NOT NULL DEFAULT 0,
    "last_scanned_at" TIMESTAMP(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donation_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "donor_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "category" "FoodCategory" NOT NULL DEFAULT 'Other',
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" VARCHAR(30) NOT NULL DEFAULT 'kg',
    "preparation_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "storage_condition" "StorageCondition",
    "location" VARCHAR(100) NOT NULL DEFAULT '',
    "status" "InventoryStatus" NOT NULL DEFAULT 'IN_STOCK',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "type" "InventoryTransactionType" NOT NULL,
    "quantity_change" DOUBLE PRECISION NOT NULL,
    "quantity_before" DOUBLE PRECISION NOT NULL,
    "quantity_after" DOUBLE PRECISION NOT NULL,
    "note" VARCHAR(255),
    "food_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_donations" (
    "id" UUID NOT NULL,
    "donor_id" UUID NOT NULL,
    "food_id" UUID NOT NULL,
    "donation_id" UUID,
    "ngo_id" UUID,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "status" "ScheduledDonationStatus" NOT NULL DEFAULT 'SCHEDULED',
    "reminder_sent_at" TIMESTAMP(3),
    "notes" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_events" (
    "id" UUID NOT NULL,
    "type" "PlatformEventType" NOT NULL,
    "user_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expiry_predictions_food_id_key" ON "expiry_predictions"("food_id");

-- CreateIndex
CREATE INDEX "expiry_predictions_urgency_idx" ON "expiry_predictions"("urgency");

-- CreateIndex
CREATE UNIQUE INDEX "donation_codes_code_key" ON "donation_codes"("code");

-- CreateIndex
CREATE INDEX "donation_codes_donation_id_idx" ON "donation_codes"("donation_id");

-- CreateIndex
CREATE INDEX "inventory_items_donor_id_status_idx" ON "inventory_items"("donor_id", "status");

-- CreateIndex
CREATE INDEX "inventory_items_expiry_date_idx" ON "inventory_items"("expiry_date");

-- CreateIndex
CREATE INDEX "inventory_transactions_item_id_idx" ON "inventory_transactions"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_donations_food_id_key" ON "scheduled_donations"("food_id");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_donations_donation_id_key" ON "scheduled_donations"("donation_id");

-- CreateIndex
CREATE INDEX "scheduled_donations_donor_id_status_idx" ON "scheduled_donations"("donor_id", "status");

-- CreateIndex
CREATE INDEX "scheduled_donations_scheduled_for_idx" ON "scheduled_donations"("scheduled_for");

-- CreateIndex
CREATE INDEX "scheduled_donations_status_idx" ON "scheduled_donations"("status");

-- CreateIndex
CREATE INDEX "platform_events_type_created_at_idx" ON "platform_events"("type", "created_at");

-- CreateIndex
CREATE INDEX "foods_status_expiry_date_idx" ON "foods"("status", "expiry_date");

-- AddForeignKey
ALTER TABLE "expiry_predictions" ADD CONSTRAINT "expiry_predictions_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_codes" ADD CONSTRAINT "donation_codes_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "donations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_donations" ADD CONSTRAINT "scheduled_donations_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_donations" ADD CONSTRAINT "scheduled_donations_ngo_id_fkey" FOREIGN KEY ("ngo_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_donations" ADD CONSTRAINT "scheduled_donations_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_donations" ADD CONSTRAINT "scheduled_donations_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "donations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Manual database-level guard (Prisma does not emit CHECK constraints)
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_quantity_nonnegative" CHECK ("quantity" >= 0);
