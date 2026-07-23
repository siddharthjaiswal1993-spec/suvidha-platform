-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProfileConflict" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citizenProfileId" TEXT NOT NULL,
    "profileFieldId" TEXT NOT NULL,
    "primaryValueId" TEXT NOT NULL,
    "alternateValueId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "ProfileConflict_citizenProfileId_fkey" FOREIGN KEY ("citizenProfileId") REFERENCES "CitizenProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfileConflict_profileFieldId_fkey" FOREIGN KEY ("profileFieldId") REFERENCES "ProfileField" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfileConflict_primaryValueId_fkey" FOREIGN KEY ("primaryValueId") REFERENCES "ProfileFieldValue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfileConflict_alternateValueId_fkey" FOREIGN KEY ("alternateValueId") REFERENCES "ProfileFieldValue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProfileConflict" ("alternateValueId", "citizenProfileId", "detectedAt", "id", "primaryValueId", "profileFieldId", "resolvedAt", "status") SELECT "alternateValueId", "citizenProfileId", "detectedAt", "id", "primaryValueId", "profileFieldId", "resolvedAt", "status" FROM "ProfileConflict";
DROP TABLE "ProfileConflict";
ALTER TABLE "new_ProfileConflict" RENAME TO "ProfileConflict";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
