/*
  Warnings:

  - You are about to drop the column `institutionDeadlineAt` on the `ServiceRequest` table. All the data in the column will be lost.
  - You are about to drop the column `scenarioTag` on the `ServiceRequest` table. All the data in the column will be lost.
  - You are about to drop the column `userDeadlineAt` on the `ServiceRequest` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CaseAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT,
    "serviceRequestId" TEXT,
    "institutionId" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "role" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaseAssignment_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CaseAssignment_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CaseAssignment_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CaseAssignment_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CaseAssignment" ("assignedAt", "assignedUserId", "claimId", "id", "institutionId", "role") SELECT "assignedAt", "assignedUserId", "claimId", "id", "institutionId", "role" FROM "CaseAssignment";
DROP TABLE "CaseAssignment";
ALTER TABLE "new_CaseAssignment" RENAME TO "CaseAssignment";
CREATE TABLE "new_Decision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT,
    "serviceRequestId" TEXT,
    "decidedByUserId" TEXT,
    "makerCheckerRole" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "rationale" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Decision_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Decision_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Decision_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Decision" ("claimId", "createdAt", "decidedByUserId", "id", "makerCheckerRole", "outcome", "rationale") SELECT "claimId", "createdAt", "decidedByUserId", "id", "makerCheckerRole", "outcome", "rationale" FROM "Decision";
DROP TABLE "Decision";
ALTER TABLE "new_Decision" RENAME TO "Decision";
CREATE TABLE "new_DeficiencyRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT,
    "serviceRequestId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "raisedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    "resolvedAt" DATETIME,
    CONSTRAINT "DeficiencyRequest_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeficiencyRequest_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DeficiencyRequest" ("claimId", "description", "id", "raisedAt", "resolvedAt", "respondedAt", "status", "title") SELECT "claimId", "description", "id", "raisedAt", "resolvedAt", "respondedAt", "status", "title" FROM "DeficiencyRequest";
DROP TABLE "DeficiencyRequest";
ALTER TABLE "new_DeficiencyRequest" RENAME TO "DeficiencyRequest";
CREATE TABLE "new_Grievance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raisedByPersonId" TEXT,
    "institutionId" TEXT,
    "claimId" TEXT,
    "serviceRequestId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolutionCategory" TEXT,
    "resolutionNote" TEXT,
    "citizenCommunicationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "Grievance_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Grievance_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Grievance" ("claimId", "createdAt", "description", "id", "institutionId", "raisedByPersonId", "resolvedAt", "serviceRequestId", "status", "subject") SELECT "claimId", "createdAt", "description", "id", "institutionId", "raisedByPersonId", "resolvedAt", "serviceRequestId", "status", "subject" FROM "Grievance";
DROP TABLE "Grievance";
ALTER TABLE "new_Grievance" RENAME TO "Grievance";
CREATE TABLE "new_LifeEventAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lifeEventId" TEXT NOT NULL,
    "institutionRelationshipId" TEXT,
    "serviceRequestId" TEXT,
    "title" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "dependsOnActionId" TEXT,
    "executionMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "LifeEventAction_lifeEventId_fkey" FOREIGN KEY ("lifeEventId") REFERENCES "LifeEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LifeEventAction_institutionRelationshipId_fkey" FOREIGN KEY ("institutionRelationshipId") REFERENCES "InstitutionRelationship" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LifeEventAction_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LifeEventAction" ("dependsOnActionId", "executionMethod", "id", "institutionRelationshipId", "lifeEventId", "priority", "sequenceOrder", "status", "title") SELECT "dependsOnActionId", "executionMethod", "id", "institutionRelationshipId", "lifeEventId", "priority", "sequenceOrder", "status", "title" FROM "LifeEventAction";
DROP TABLE "LifeEventAction";
ALTER TABLE "new_LifeEventAction" RENAME TO "LifeEventAction";
CREATE UNIQUE INDEX "LifeEventAction_serviceRequestId_key" ON "LifeEventAction"("serviceRequestId");
CREATE TABLE "new_ServiceRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "institutionRelationshipId" TEXT,
    "serviceDefinitionId" TEXT NOT NULL,
    "lifeEventId" TEXT,
    "title" TEXT NOT NULL,
    "normalizedStatus" TEXT NOT NULL DEFAULT 'draft',
    "executionMethod" TEXT NOT NULL,
    "requestedValueSummary" TEXT,
    "documentIdEvidence" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceRequest_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceRequest_institutionRelationshipId_fkey" FOREIGN KEY ("institutionRelationshipId") REFERENCES "InstitutionRelationship" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ServiceRequest_serviceDefinitionId_fkey" FOREIGN KEY ("serviceDefinitionId") REFERENCES "ServiceDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceRequest_lifeEventId_fkey" FOREIGN KEY ("lifeEventId") REFERENCES "LifeEvent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ServiceRequest" ("createdAt", "executionMethod", "id", "institutionRelationshipId", "lifeEventId", "normalizedStatus", "personId", "serviceDefinitionId", "title", "updatedAt") SELECT "createdAt", "executionMethod", "id", "institutionRelationshipId", "lifeEventId", "normalizedStatus", "personId", "serviceDefinitionId", "title", "updatedAt" FROM "ServiceRequest";
DROP TABLE "ServiceRequest";
ALTER TABLE "new_ServiceRequest" RENAME TO "ServiceRequest";
CREATE INDEX "ServiceRequest_personId_normalizedStatus_idx" ON "ServiceRequest"("personId", "normalizedStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
