-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN "institutionDeadlineAt" DATETIME;
ALTER TABLE "ServiceRequest" ADD COLUMN "scenarioTag" TEXT;
ALTER TABLE "ServiceRequest" ADD COLUMN "userDeadlineAt" DATETIME;
