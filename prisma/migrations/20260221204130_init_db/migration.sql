-- CreateEnum
CREATE TYPE "company_type" AS ENUM ('CLIENT', 'RENTAL', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "tax_id" TEXT NOT NULL,
    "type" "company_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chariots" (
    "id" UUID NOT NULL,
    "plate" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "contractor_id" UUID NOT NULL,
    "custodian_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chariots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "chariot_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "distance_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_hitched" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_tax_id_key" ON "companies"("tax_id");

-- CreateIndex
CREATE UNIQUE INDEX "chariots_plate_key" ON "chariots"("plate");

-- AddForeignKey
ALTER TABLE "chariots" ADD CONSTRAINT "chariots_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chariots" ADD CONSTRAINT "chariots_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chariots" ADD CONSTRAINT "chariots_custodian_id_fkey" FOREIGN KEY ("custodian_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_chariot_id_fkey" FOREIGN KEY ("chariot_id") REFERENCES "chariots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
