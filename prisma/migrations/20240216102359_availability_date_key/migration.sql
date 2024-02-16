/*
  Warnings:

  - You are about to drop the column `date` on the `AvailabilityDate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[householdId,month,day]` on the table `AvailabilityDate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `day` to the `AvailabilityDate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `month` to the `AvailabilityDate` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AvailabilityDate_householdId_date_key";

-- AlterTable
ALTER TABLE "AvailabilityDate" DROP COLUMN "date",
ADD COLUMN     "day" INTEGER NOT NULL,
ADD COLUMN     "month" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityDate_householdId_month_day_key" ON "AvailabilityDate"("householdId", "month", "day");
