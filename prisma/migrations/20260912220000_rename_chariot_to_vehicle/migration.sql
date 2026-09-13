-- Rename chariots table and related constraints to vehicles
ALTER TABLE "chariots" RENAME TO "vehicles";

ALTER INDEX "chariots_plate_key" RENAME TO "vehicles_plate_key";

ALTER TABLE "vehicles" RENAME CONSTRAINT "chariots_pkey" TO "vehicles_pkey";
ALTER TABLE "vehicles" RENAME CONSTRAINT "chariots_owner_id_fkey" TO "vehicles_owner_id_fkey";
ALTER TABLE "vehicles" RENAME CONSTRAINT "chariots_contractor_id_fkey" TO "vehicles_contractor_id_fkey";
ALTER TABLE "vehicles" RENAME CONSTRAINT "chariots_custodian_id_fkey" TO "vehicles_custodian_id_fkey";

ALTER TABLE "trips" RENAME COLUMN "chariot_id" TO "vehicle_id";
ALTER TABLE "trips" RENAME CONSTRAINT "trips_chariot_id_fkey" TO "trips_vehicle_id_fkey";
