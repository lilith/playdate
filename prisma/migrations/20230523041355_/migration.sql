-- CreateEnum
CREATE TYPE "Pronoun" AS ENUM ('FAE_FAER_FAERS', 'EEY_EM_EIRS', 'HE_HIM_HIS', 'PER_PER_PERS', 'SHE_HER_HERS', 'THEY_THEM_THEIRS', 'VE_VER_VIS', 'XE_XEM_XYRS', 'ZEZIE_HIR_HIRS');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('UNSPECIFIED', 'BUSY', 'AVAILABLE');

-- CreateTable
CREATE TABLE "Household" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "publicNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendRequest" (
    "id" SERIAL NOT NULL,
    "expires" TIMESTAMP(3),
    "targetPhone" TEXT NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "fromHouseholdId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoinHouseholdRequest" (
    "id" SERIAL NOT NULL,
    "expires" TIMESTAMP(3),
    "targetPhone" TEXT NOT NULL,
    "householdId" INTEGER NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JoinHouseholdRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdChild" (
    "id" SERIAL NOT NULL,
    "householdId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "pronouns" "Pronoun" NOT NULL,
    "lastName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdChild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneContactPermissions" (
    "phone" TEXT NOT NULL,
    "blocked" BOOLEAN NOT NULL,
    "allowInvites" BOOLEAN NOT NULL,
    "allowReminders" BOOLEAN NOT NULL,
    "acceptedTermsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneContactPermissions_pkey" PRIMARY KEY ("phone")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "householdId" INTEGER,
    "locale" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "phone" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "pronouns" "Pronoun" NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "lockedReason" TEXT,
    "email" TEXT,
    "emailVerified" TEXT,
    "reminderDatetime" TIMESTAMP(3) NOT NULL,
    "reminderIntervalDays" INTEGER NOT NULL,
    "acceptedTermsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityDate" (
    "id" SERIAL NOT NULL,
    "householdId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "childId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'UNSPECIFIED',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "notes" TEXT,
    "emoticons" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdConnection" (
    "id" SERIAL NOT NULL,
    "householdId" INTEGER NOT NULL,
    "friendHouseholdId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HouseholdConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_token_key" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_token_idx" ON "MagicLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityDate_householdId_date_key" ON "AvailabilityDate"("householdId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdConnection_householdId_key" ON "HouseholdConnection"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdConnection_friendHouseholdId_key" ON "HouseholdConnection"("friendHouseholdId");

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_id_fkey" FOREIGN KEY ("id") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_fromHouseholdId_fkey" FOREIGN KEY ("fromHouseholdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinHouseholdRequest" ADD CONSTRAINT "JoinHouseholdRequest_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinHouseholdRequest" ADD CONSTRAINT "JoinHouseholdRequest_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdChild" ADD CONSTRAINT "HouseholdChild_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_phone_fkey" FOREIGN KEY ("phone") REFERENCES "PhoneContactPermissions"("phone") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityDate" ADD CONSTRAINT "AvailabilityDate_childId_fkey" FOREIGN KEY ("childId") REFERENCES "HouseholdChild"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityDate" ADD CONSTRAINT "AvailabilityDate_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityDate" ADD CONSTRAINT "AvailabilityDate_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdConnection" ADD CONSTRAINT "HouseholdConnection_friendHouseholdId_fkey" FOREIGN KEY ("friendHouseholdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdConnection" ADD CONSTRAINT "HouseholdConnection_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
