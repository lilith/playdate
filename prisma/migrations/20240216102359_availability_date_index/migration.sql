-- CreateIndex
CREATE UNIQUE INDEX if not exists "AvailabilityDate_householdId_date_key" ON "AvailabilityDate"("householdId", "date");
