-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Grievance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raisedByPersonId" TEXT,
    "institutionId" TEXT,
    "claimId" TEXT,
    "serviceRequestId" TEXT,
    "sourceInboxThreadId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolutionCategory" TEXT,
    "resolutionNote" TEXT,
    "citizenCommunicationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "Grievance_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Grievance_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Grievance_sourceInboxThreadId_fkey" FOREIGN KEY ("sourceInboxThreadId") REFERENCES "InboxThread" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Grievance" ("citizenCommunicationSent", "claimId", "createdAt", "description", "id", "institutionId", "raisedByPersonId", "resolutionCategory", "resolutionNote", "resolvedAt", "serviceRequestId", "status", "subject") SELECT "citizenCommunicationSent", "claimId", "createdAt", "description", "id", "institutionId", "raisedByPersonId", "resolutionCategory", "resolutionNote", "resolvedAt", "serviceRequestId", "status", "subject" FROM "Grievance";
DROP TABLE "Grievance";
ALTER TABLE "new_Grievance" RENAME TO "Grievance";
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inboxThreadId" TEXT NOT NULL,
    "senderLabel" TEXT NOT NULL,
    "senderVerified" BOOLEAN NOT NULL DEFAULT true,
    "importance" TEXT NOT NULL DEFAULT 'normal',
    "originalBody" TEXT NOT NULL,
    "plainLanguageSummary" TEXT,
    "suggestedNextAction" TEXT,
    "fraudWarning" BOOLEAN NOT NULL DEFAULT false,
    "direction" TEXT NOT NULL DEFAULT 'institution_to_citizen',
    "reportedSuspiciousAt" DATETIME,
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    CONSTRAINT "Message_inboxThreadId_fkey" FOREIGN KEY ("inboxThreadId") REFERENCES "InboxThread" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("channel", "createdAt", "fraudWarning", "id", "importance", "inboxThreadId", "originalBody", "plainLanguageSummary", "readAt", "senderLabel", "senderVerified", "suggestedNextAction") SELECT "channel", "createdAt", "fraudWarning", "id", "importance", "inboxThreadId", "originalBody", "plainLanguageSummary", "readAt", "senderLabel", "senderVerified", "suggestedNextAction" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
