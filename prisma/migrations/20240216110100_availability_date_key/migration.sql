/*
  Warnings:

  - A unique constraint covering the columns `[householdId,month,day]` on the table `AvailabilityDate` will be added. If there are existing duplicate values, this will fail.
*/
-- DropIndex
DROP INDEX "AvailabilityDate_householdId_date_key";

-- AlterTable
ALTER TABLE "AvailabilityDate"
ADD COLUMN     "day" INTEGER NULL,
ADD COLUMN     "month" INTEGER NULL;

UPDATE "AvailabilityDate"
SET 
  "day" = EXTRACT(DAY FROM "date"),
  "month" = EXTRACT(MONTH FROM "date");

ALTER TABLE "AvailabilityDate"
ALTER COLUMN "day" SET NOT NULL,
ALTER COLUMN "month" SET NOT NULL,
DROP COLUMN "date";

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityDate_householdId_month_day_key" ON "AvailabilityDate"("householdId", "month", "day");
