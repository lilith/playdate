/*
  Warnings:

  - A unique constraint covering the columns `[householdId,friendHouseholdId]` on the table `HouseholdConnection` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Household" DROP CONSTRAINT "Household_id_fkey";

-- DropIndex
DROP INDEX "HouseholdConnection_friendHouseholdId_key";

-- DropIndex
DROP INDEX "HouseholdConnection_householdId_key";

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdConnection_householdId_friendHouseholdId_key" ON "HouseholdConnection"("householdId", "friendHouseholdId");
