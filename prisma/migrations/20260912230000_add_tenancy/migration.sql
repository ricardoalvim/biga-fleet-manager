-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

INSERT INTO "tenants" ("id", "slug", "name")
VALUES ('00000000-0000-4000-8000-000000000001', 'default', 'Default Tenant');

ALTER TABLE "companies" ADD COLUMN "tenant_id" UUID;
UPDATE "companies" SET "tenant_id" = '00000000-0000-4000-8000-000000000001';
ALTER TABLE "companies" ALTER COLUMN "tenant_id" SET NOT NULL;

ALTER TABLE "vehicles" ADD COLUMN "tenant_id" UUID;
UPDATE "vehicles" SET "tenant_id" = '00000000-0000-4000-8000-000000000001';
ALTER TABLE "vehicles" ALTER COLUMN "tenant_id" SET NOT NULL;

ALTER TABLE "trips" ADD COLUMN "tenant_id" UUID;
UPDATE "trips" SET "tenant_id" = '00000000-0000-4000-8000-000000000001';
ALTER TABLE "trips" ALTER COLUMN "tenant_id" SET NOT NULL;

ALTER TABLE "trips" RENAME COLUMN "is_hitched" TO "ignition";

DROP INDEX "companies_tax_id_key";
DROP INDEX "vehicles_plate_key";

CREATE UNIQUE INDEX "companies_tenant_id_tax_id_key" ON "companies"("tenant_id", "tax_id");
CREATE UNIQUE INDEX "vehicles_tenant_id_plate_key" ON "vehicles"("tenant_id", "plate");

ALTER TABLE "companies" ADD CONSTRAINT "companies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trips" ADD CONSTRAINT "trips_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
