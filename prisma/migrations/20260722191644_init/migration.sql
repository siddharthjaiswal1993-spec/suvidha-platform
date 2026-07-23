-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "primaryRole" TEXT NOT NULL,
    "personId" TEXT,
    "institutionId" TEXT,
    "isDemoAccount" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "preferredName" TEXT,
    "dateOfBirth" DATETIME,
    "dateOfDeath" DATETIME,
    "lifeStatus" TEXT NOT NULL DEFAULT 'living',
    "gender" TEXT,
    "scenarioTag" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "PersonIdentifier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "idType" TEXT NOT NULL,
    "maskedValue" TEXT NOT NULL,
    "valueHash" TEXT NOT NULL,
    "issuingAuthority" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationSource" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonIdentifier_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactMethod_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Address_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "relatedPersonId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "isMinorDependent" BOOLEAN NOT NULL DEFAULT false,
    "evidenceDocumentId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Relationship_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Relationship_relatedPersonId_fkey" FOREIGN KEY ("relatedPersonId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "HouseholdMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "householdId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "roleInHousehold" TEXT,
    CONSTRAINT "HouseholdMember_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HouseholdMember_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EstatePlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" DATETIME,
    "nextReviewDueAt" DATETIME,
    "emergencyInstructions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EstatePlan_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewReminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estatePlanId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewReminder_estatePlanId_fkey" FOREIGN KEY ("estatePlanId") REFERENCES "EstatePlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Estate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "deathEventId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "succession" TEXT,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    CONSTRAINT "Estate_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IdentityRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "confidence" REAL,
    "verifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "IdentityRecord_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeathEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'reported',
    "dateOfDeath" DATETIME NOT NULL,
    "placeOfDeath" TEXT NOT NULL,
    "countryOfDeath" TEXT NOT NULL DEFAULT 'India',
    "reportedByPersonId" TEXT,
    "informantName" TEXT,
    "informantRelation" TEXT,
    "registrarJurisdictionId" TEXT,
    "registrationNumber" TEXT,
    "isPubliclyVisible" BOOLEAN NOT NULL DEFAULT false,
    "scenarioTag" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeathEvent_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DeathEvent_registrarJurisdictionId_fkey" FOREIGN KEY ("registrarJurisdictionId") REFERENCES "Jurisdiction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeathEventEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deathEventId" TEXT NOT NULL,
    "submittedByPersonId" TEXT,
    "evidenceType" TEXT NOT NULL,
    "documentId" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeathEventEvidence_deathEventId_fkey" FOREIGN KEY ("deathEventId") REFERENCES "DeathEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DeathEventEvidence_submittedByPersonId_fkey" FOREIGN KEY ("submittedByPersonId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DeathEventEvidence_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LegalDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeathEventMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deathEventId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "confidenceScore" REAL NOT NULL,
    "matchFactors" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "riskActionApplied" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeathEventMatch_deathEventId_fkey" FOREIGN KEY ("deathEventId") REFERENCES "DeathEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DeathEventMatch_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeathEventCorrection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deathEventId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "challengedByPersonId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'challenge_initiated',
    "resolutionNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "DeathEventCorrection_deathEventId_fkey" FOREIGN KEY ("deathEventId") REFERENCES "DeathEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrustedContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grantorPersonId" TEXT NOT NULL,
    "holderPersonId" TEXT NOT NULL,
    "label" TEXT,
    "status" TEXT NOT NULL DEFAULT 'invited',
    "invitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" DATETIME,
    "revokedAt" DATETIME,
    CONSTRAINT "TrustedContact_grantorPersonId_fkey" FOREIGN KEY ("grantorPersonId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TrustedContact_holderPersonId_fkey" FOREIGN KEY ("holderPersonId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccessPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "visibilityLevel" TEXT NOT NULL,
    "timingRule" TEXT NOT NULL,
    "waitingPeriodDays" INTEGER,
    "requiresCoApprovalFromHolderId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AccessGrant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trustedContactId" TEXT NOT NULL,
    "accessPolicyId" TEXT NOT NULL,
    "scopeConfig" TEXT,
    "status" TEXT NOT NULL DEFAULT 'granted',
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    "purposeTags" TEXT,
    CONSTRAINT "AccessGrant_trustedContactId_fkey" FOREIGN KEY ("trustedContactId") REFERENCES "TrustedContact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccessGrant_accessPolicyId_fkey" FOREIGN KEY ("accessPolicyId") REFERENCES "AccessPolicy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "connectorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'granted',
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    "expiresAt" DATETIME,
    CONSTRAINT "ConsentRecord_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsentArtefact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "consentRecordId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "scopeSummary" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsentArtefact_consentRecordId_fkey" FOREIGN KEY ("consentRecordId") REFERENCES "ConsentRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Regulator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "regulatorId" TEXT,
    "isRegistrarAuthority" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Institution_regulatorId_fkey" FOREIGN KEY ("regulatorId") REFERENCES "Regulator" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Connector" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "integrationLabel" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sandbox',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Integration_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Integration_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExternalRecordReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "integrationId" TEXT NOT NULL,
    "personId" TEXT,
    "assetId" TEXT,
    "externalIdToken" TEXT NOT NULL,
    "matchConfidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExternalRecordReference_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExternalRecordReference_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerPersonId" TEXT,
    "category" TEXT NOT NULL,
    "productType" TEXT,
    "institutionId" TEXT,
    "label" TEXT NOT NULL,
    "maskedAccountNumber" TEXT,
    "provenance" TEXT NOT NULL DEFAULT 'self_reported',
    "scenarioTag" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Asset_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssetHolding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "holdingType" TEXT NOT NULL DEFAULT 'sole',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssetHolding_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AssetHolding_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Liability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "outstandingAmountBand" TEXT,
    "institutionName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "Liability_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Nomination" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "nomineePersonId" TEXT,
    "nomineeNameOnRecord" TEXT NOT NULL,
    "nomineeRelationOnRecord" TEXT,
    "isMinor" BOOLEAN NOT NULL DEFAULT false,
    "guardianNameOnRecord" TEXT,
    "sharePercentage" REAL DEFAULT 100,
    "registeredAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Nomination_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Nomination_nomineePersonId_fkey" FOREIGN KEY ("nomineePersonId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BeneficiaryDesignation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT,
    "willRecordId" TEXT,
    "trustRecordId" TEXT,
    "beneficiaryPersonId" TEXT,
    "beneficiaryNameOnRecord" TEXT NOT NULL,
    "sharePercentage" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BeneficiaryDesignation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BeneficiaryDesignation_willRecordId_fkey" FOREIGN KEY ("willRecordId") REFERENCES "WillRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BeneficiaryDesignation_trustRecordId_fkey" FOREIGN KEY ("trustRecordId") REFERENCES "TrustRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BeneficiaryDesignation_beneficiaryPersonId_fkey" FOREIGN KEY ("beneficiaryPersonId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JointHolder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "mandate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JointHolder_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JointHolder_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WillRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testatorPersonId" TEXT NOT NULL,
    "documentId" TEXT,
    "storageStatus" TEXT NOT NULL DEFAULT 'referenced_only',
    "executionDate" DATETIME,
    "registrationStatus" TEXT NOT NULL DEFAULT 'unregistered',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatestKnownVersion" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WillRecord_testatorPersonId_fkey" FOREIGN KEY ("testatorPersonId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WillRecord_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LegalDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrustRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "settlorPersonId" TEXT NOT NULL,
    "trustName" TEXT NOT NULL,
    "documentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrustRecord_settlorPersonId_fkey" FOREIGN KEY ("settlorPersonId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TrustRecord_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LegalDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExecutorAppointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "willRecordId" TEXT NOT NULL,
    "executorPersonId" TEXT,
    "executorNameOnRecord" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExecutorAppointment_willRecordId_fkey" FOREIGN KEY ("willRecordId") REFERENCES "WillRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExecutorAppointment_executorPersonId_fkey" FOREIGN KEY ("executorPersonId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuthorityCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "issuingAuthority" TEXT NOT NULL,
    "documentId" TEXT,
    "issuedAt" DATETIME,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthorityCredential_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuthorityCredential_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LegalDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerPersonId" TEXT,
    "documentType" TEXT NOT NULL,
    "fileLabel" TEXT NOT NULL,
    "isDemoDocument" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "LegalDocument_ownerPersonId_fkey" FOREIGN KEY ("ownerPersonId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legalDocumentId" TEXT NOT NULL,
    "verifiedByUserId" TEXT,
    "outcome" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "verifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentVerification_legalDocumentId_fkey" FOREIGN KEY ("legalDocumentId") REFERENCES "LegalDocument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Claimant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estateId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "claimedRole" TEXT NOT NULL,
    "relationToDeceased" TEXT,
    "identityVerified" BOOLEAN NOT NULL DEFAULT false,
    "wasPreAuthorised" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Claimant_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Claimant_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estateId" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "claimNumber" TEXT NOT NULL,
    "submittedAt" DATETIME,
    "scenarioTag" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Claim_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Claim_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Claim_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClaimAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "recommendedPathway" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClaimAsset_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClaimAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClaimWorkflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "currentStepKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClaimWorkflow_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimWorkflowId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" DATETIME,
    CONSTRAINT "WorkflowStep_claimWorkflowId_fkey" FOREIGN KEY ("claimWorkflowId") REFERENCES "ClaimWorkflow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowStepId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "requirementType" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "Requirement_workflowStepId_fkey" FOREIGN KEY ("workflowStepId") REFERENCES "WorkflowStep" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubmittedEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "legalDocumentId" TEXT,
    "evidenceLabel" TEXT NOT NULL,
    "reusedFromClaimId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubmittedEvidence_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SubmittedEvidence_legalDocumentId_fkey" FOREIGN KEY ("legalDocumentId") REFERENCES "LegalDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "role" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaseAssignment_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CaseAssignment_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CaseAssignment_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "decidedByUserId" TEXT,
    "makerCheckerRole" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "rationale" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Decision_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Decision_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeficiencyRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "raisedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    "resolvedAt" DATETIME,
    CONSTRAINT "DeficiencyRequest_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estateId" TEXT NOT NULL,
    "raisedByPersonId" TEXT,
    "disputeType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "Dispute_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourtOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estateId" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "issuingCourt" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "documentId" TEXT,
    "effectiveFrom" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourtOrder_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT,
    "serviceRequestId" TEXT,
    "purpose" TEXT NOT NULL DEFAULT 'claim_settlement',
    "amountBand" TEXT NOT NULL,
    "payeePersonId" TEXT,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "transferType" TEXT NOT NULL,
    "toPersonId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transfer_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mutation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "authorityName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'application_filed',
    "applicationNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "Mutation_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mutation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecordUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "updateType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecordUpdate_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "deathEventId" TEXT,
    "channel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_deathEventId_fkey" FOREIGN KEY ("deathEventId") REFERENCES "DeathEvent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Communication_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Grievance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raisedByPersonId" TEXT,
    "institutionId" TEXT,
    "claimId" TEXT,
    "serviceRequestId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "Grievance_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Grievance_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FraudSignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT,
    "subjectPersonId" TEXT,
    "signalType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "FraudSignal_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FraudSignal_subjectPersonId_fkey" FOREIGN KEY ("subjectPersonId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT,
    "actorRole" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "claimId" TEXT,
    "correlationId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditEvent_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SLA" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "processType" TEXT NOT NULL,
    "targetDays" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SLA_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Jurisdiction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateCode" TEXT
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RuleVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "definition" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RuleVersion_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CitizenProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "accessibilityNeeds" TEXT,
    "residencyStatus" TEXT NOT NULL DEFAULT 'resident',
    "citizenship" TEXT NOT NULL DEFAULT 'India',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CitizenProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileField" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ProfileFieldValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citizenProfileId" TEXT NOT NULL,
    "profileFieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "provenance" TEXT NOT NULL DEFAULT 'user_entered',
    "sourceLabel" TEXT NOT NULL,
    "sourceInstitutionId" TEXT,
    "isCurrentForSource" BOOLEAN NOT NULL DEFAULT true,
    "lastVerifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileFieldValue_citizenProfileId_fkey" FOREIGN KEY ("citizenProfileId") REFERENCES "CitizenProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfileFieldValue_profileFieldId_fkey" FOREIGN KEY ("profileFieldId") REFERENCES "ProfileField" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfileFieldValue_sourceInstitutionId_fkey" FOREIGN KEY ("sourceInstitutionId") REFERENCES "Institution" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileConflict" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citizenProfileId" TEXT NOT NULL,
    "profileFieldId" TEXT NOT NULL,
    "primaryValueId" TEXT NOT NULL,
    "alternateValueId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "ProfileConflict_citizenProfileId_fkey" FOREIGN KEY ("citizenProfileId") REFERENCES "CitizenProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfileConflict_primaryValueId_fkey" FOREIGN KEY ("primaryValueId") REFERENCES "ProfileFieldValue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfileConflict_alternateValueId_fkey" FOREIGN KEY ("alternateValueId") REFERENCES "ProfileFieldValue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstitutionRelationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "referenceNumberMasked" TEXT,
    "identifierUsed" TEXT,
    "linkedAssetId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "registeredAddressSnapshot" TEXT,
    "registeredNomineeSummary" TEXT,
    "renewalDueAt" DATETIME,
    "connectorId" TEXT,
    "consentRecordId" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "lastSyncedAt" DATETIME,
    "scenarioTag" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InstitutionRelationship_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstitutionRelationship_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstitutionRelationship_linkedAssetId_fkey" FOREIGN KEY ("linkedAssetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InstitutionRelationship_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InstitutionRelationship_consentRecordId_fkey" FOREIGN KEY ("consentRecordId") REFERENCES "ConsentRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SourceSync" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionRelationshipId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "recordsSynced" INTEGER,
    "failureReason" TEXT,
    CONSTRAINT "SourceSync_institutionRelationshipId_fkey" FOREIGN KEY ("institutionRelationshipId") REFERENCES "InstitutionRelationship" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legalDocumentId" TEXT NOT NULL,
    "issuer" TEXT,
    "issueDate" DATETIME,
    "expiryDate" DATETIME,
    "documentCategory" TEXT NOT NULL,
    "digitalSignatureStatus" TEXT,
    "permittedUses" TEXT,
    CONSTRAINT "DocumentProfile_legalDocumentId_fkey" FOREIGN KEY ("legalDocumentId") REFERENCES "LegalDocument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentProfileId" TEXT NOT NULL,
    "sharedWithLabel" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "sharedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    CONSTRAINT "DocumentShare_documentProfileId_fkey" FOREIGN KEY ("documentProfileId") REFERENCES "DocumentProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Renewal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentProfileId" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "serviceRequestId" TEXT,
    CONSTRAINT "Renewal_documentProfileId_fkey" FOREIGN KEY ("documentProfileId") REFERENCES "DocumentProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Renewal_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Signature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legalDocumentId" TEXT,
    "serviceRequestId" TEXT,
    "signedByPersonId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Signature_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceCatalogue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "ServiceCatalogue_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceCatalogueId" TEXT NOT NULL,
    "serviceCategory" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "feeBand" TEXT,
    "publishedSlaDays" INTEGER,
    "requiresInPerson" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceDefinition_serviceCatalogueId_fkey" FOREIGN KEY ("serviceCatalogueId") REFERENCES "ServiceCatalogue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceChannel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceDefinitionId" TEXT NOT NULL,
    "channelKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ServiceChannel_serviceDefinitionId_fkey" FOREIGN KEY ("serviceDefinitionId") REFERENCES "ServiceDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EligibilityRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceDefinitionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "conditionDefinition" TEXT NOT NULL,
    CONSTRAINT "EligibilityRule_serviceDefinitionId_fkey" FOREIGN KEY ("serviceDefinitionId") REFERENCES "ServiceDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RequiredField" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceDefinitionId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "RequiredField_serviceDefinitionId_fkey" FOREIGN KEY ("serviceDefinitionId") REFERENCES "ServiceDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RequiredDocumentRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceDefinitionId" TEXT NOT NULL,
    "documentCategory" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "reusePolicy" TEXT NOT NULL DEFAULT 'reusable_if_verified_and_current',
    CONSTRAINT "RequiredDocumentRule_serviceDefinitionId_fkey" FOREIGN KEY ("serviceDefinitionId") REFERENCES "ServiceDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstitutionStatusMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceDefinitionId" TEXT NOT NULL,
    "rawStatusLabel" TEXT NOT NULL,
    "normalizedStatus" TEXT NOT NULL,
    CONSTRAINT "InstitutionStatusMapping_serviceDefinitionId_fkey" FOREIGN KEY ("serviceDefinitionId") REFERENCES "ServiceDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "institutionRelationshipId" TEXT,
    "serviceDefinitionId" TEXT NOT NULL,
    "lifeEventId" TEXT,
    "title" TEXT NOT NULL,
    "normalizedStatus" TEXT NOT NULL DEFAULT 'draft',
    "executionMethod" TEXT NOT NULL,
    "userDeadlineAt" DATETIME,
    "institutionDeadlineAt" DATETIME,
    "scenarioTag" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceRequest_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceRequest_institutionRelationshipId_fkey" FOREIGN KEY ("institutionRelationshipId") REFERENCES "InstitutionRelationship" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ServiceRequest_serviceDefinitionId_fkey" FOREIGN KEY ("serviceDefinitionId") REFERENCES "ServiceDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceRequest_lifeEventId_fkey" FOREIGN KEY ("lifeEventId") REFERENCES "LifeEvent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceRequestId" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "officialStatusRaw" TEXT NOT NULL,
    "channelUsed" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RequestStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceRequestId" TEXT NOT NULL,
    "normalizedStatus" TEXT NOT NULL,
    "officialStatusRaw" TEXT,
    "note" TEXT,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RequestStatus_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceRequestId" TEXT NOT NULL,
    "channelUsed" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Submission_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceRequestId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    CONSTRAINT "Appointment_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InPersonTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceRequestId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "InPersonTask_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LifeEventTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LifeEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "lifeEventTemplateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "scenarioTag" TEXT,
    CONSTRAINT "LifeEvent_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LifeEvent_lifeEventTemplateId_fkey" FOREIGN KEY ("lifeEventTemplateId") REFERENCES "LifeEventTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LifeEventAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lifeEventId" TEXT NOT NULL,
    "institutionRelationshipId" TEXT,
    "title" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "dependsOnActionId" TEXT,
    "executionMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "LifeEventAction_lifeEventId_fkey" FOREIGN KEY ("lifeEventId") REFERENCES "LifeEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LifeEventAction_institutionRelationshipId_fkey" FOREIGN KEY ("institutionRelationshipId") REFERENCES "InstitutionRelationship" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Deadline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "dueAt" DATETIME NOT NULL,
    "institutionRelationshipId" TEXT,
    "serviceRequestId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    CONSTRAINT "Deadline_institutionRelationshipId_fkey" FOREIGN KEY ("institutionRelationshipId") REFERENCES "InstitutionRelationship" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Deadline_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InboxThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "institutionId" TEXT,
    "serviceRequestId" TEXT,
    "subject" TEXT NOT NULL,
    "threadType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InboxThread_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InboxThread_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InboxThread_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inboxThreadId" TEXT NOT NULL,
    "senderLabel" TEXT NOT NULL,
    "senderVerified" BOOLEAN NOT NULL DEFAULT true,
    "importance" TEXT NOT NULL DEFAULT 'normal',
    "originalBody" TEXT NOT NULL,
    "plainLanguageSummary" TEXT,
    "suggestedNextAction" TEXT,
    "fraudWarning" BOOLEAN NOT NULL DEFAULT false,
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    CONSTRAINT "Message_inboxThreadId_fkey" FOREIGN KEY ("inboxThreadId") REFERENCES "InboxThread" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "noticeNumber" TEXT,
    "noticeType" TEXT NOT NULL,
    "responseDeadline" DATETIME,
    "checklistGenerated" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Notice_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsentPurpose" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purposeKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ConsentScope" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "consentRecordId" TEXT NOT NULL,
    "consentPurposeId" TEXT NOT NULL,
    "institutionId" TEXT,
    "scopedEntityLabel" TEXT,
    "validFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" DATETIME,
    CONSTRAINT "ConsentScope_consentRecordId_fkey" FOREIGN KEY ("consentRecordId") REFERENCES "ConsentRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ConsentScope_consentPurposeId_fkey" FOREIGN KEY ("consentPurposeId") REFERENCES "ConsentPurpose" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "consentScopeId" TEXT NOT NULL,
    "sharedWithLabel" TEXT NOT NULL,
    "fieldsShared" TEXT NOT NULL,
    "sharedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DataShare_consentScopeId_fkey" FOREIGN KEY ("consentScopeId") REFERENCES "ConsentScope" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfessionalRepresentative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "principalPersonId" TEXT NOT NULL,
    "representativePersonId" TEXT NOT NULL,
    "professionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    CONSTRAINT "ProfessionalRepresentative_principalPersonId_fkey" FOREIGN KEY ("principalPersonId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfessionalRepresentative_representativePersonId_fkey" FOREIGN KEY ("representativePersonId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DelegatedTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assistantPersonId" TEXT NOT NULL,
    "professionalRepresentativeId" TEXT,
    "serviceRequestId" TEXT,
    "permissionTier" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_owner_approval',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" DATETIME,
    CONSTRAINT "DelegatedTask_assistantPersonId_fkey" FOREIGN KEY ("assistantPersonId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DelegatedTask_professionalRepresentativeId_fkey" FOREIGN KEY ("professionalRepresentativeId") REFERENCES "ProfessionalRepresentative" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DelegatedTask_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Escalation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grievanceId" TEXT NOT NULL,
    "escalationType" TEXT NOT NULL,
    "escalatedTo" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "Escalation_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Appeal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grievanceId" TEXT NOT NULL,
    "groundsForAppeal" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'filed',
    "filedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" DATETIME,
    CONSTRAINT "Appeal_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceFee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceDefinitionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amountBand" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ServiceFee_serviceDefinitionId_fkey" FOREIGN KEY ("serviceDefinitionId") REFERENCES "ServiceDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_personId_key" ON "User"("personId");

-- CreateIndex
CREATE INDEX "Person_lifeStatus_idx" ON "Person"("lifeStatus");

-- CreateIndex
CREATE INDEX "PersonIdentifier_personId_idType_idx" ON "PersonIdentifier"("personId", "idType");

-- CreateIndex
CREATE INDEX "PersonIdentifier_valueHash_idx" ON "PersonIdentifier"("valueHash");

-- CreateIndex
CREATE INDEX "Relationship_personId_idx" ON "Relationship"("personId");

-- CreateIndex
CREATE INDEX "Relationship_relatedPersonId_idx" ON "Relationship"("relatedPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "EstatePlan_personId_key" ON "EstatePlan"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Estate_personId_key" ON "Estate"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Estate_deathEventId_key" ON "Estate"("deathEventId");

-- CreateIndex
CREATE UNIQUE INDEX "DeathEvent_personId_key" ON "DeathEvent"("personId");

-- CreateIndex
CREATE INDEX "DeathEventMatch_deathEventId_idx" ON "DeathEventMatch"("deathEventId");

-- CreateIndex
CREATE INDEX "DeathEventMatch_institutionId_idx" ON "DeathEventMatch"("institutionId");

-- CreateIndex
CREATE INDEX "TrustedContact_grantorPersonId_idx" ON "TrustedContact"("grantorPersonId");

-- CreateIndex
CREATE INDEX "TrustedContact_holderPersonId_idx" ON "TrustedContact"("holderPersonId");

-- CreateIndex
CREATE INDEX "AccessGrant_trustedContactId_idx" ON "AccessGrant"("trustedContactId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentArtefact_receiptNumber_key" ON "ConsentArtefact"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Regulator_name_key" ON "Regulator"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Regulator_shortCode_key" ON "Regulator"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "Connector_key_key" ON "Connector"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_claimNumber_key" ON "Claim"("claimNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimWorkflow_claimId_key" ON "ClaimWorkflow"("claimId");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_claimId_idx" ON "AuditEvent"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "Rule_ruleKey_key" ON "Rule"("ruleKey");

-- CreateIndex
CREATE UNIQUE INDEX "RuleVersion_ruleId_version_key" ON "RuleVersion"("ruleId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "CitizenProfile_personId_key" ON "CitizenProfile"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileField_fieldKey_key" ON "ProfileField"("fieldKey");

-- CreateIndex
CREATE INDEX "ProfileFieldValue_citizenProfileId_profileFieldId_idx" ON "ProfileFieldValue"("citizenProfileId", "profileFieldId");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionRelationship_linkedAssetId_key" ON "InstitutionRelationship"("linkedAssetId");

-- CreateIndex
CREATE INDEX "InstitutionRelationship_personId_idx" ON "InstitutionRelationship"("personId");

-- CreateIndex
CREATE INDEX "InstitutionRelationship_institutionId_idx" ON "InstitutionRelationship"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentProfile_legalDocumentId_key" ON "DocumentProfile"("legalDocumentId");

-- CreateIndex
CREATE INDEX "ServiceRequest_personId_normalizedStatus_idx" ON "ServiceRequest"("personId", "normalizedStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Application_serviceRequestId_key" ON "Application"("serviceRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_applicationNumber_key" ON "Application"("applicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LifeEventTemplate_eventKey_key" ON "LifeEventTemplate"("eventKey");

-- CreateIndex
CREATE UNIQUE INDEX "InboxThread_serviceRequestId_key" ON "InboxThread"("serviceRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Notice_messageId_key" ON "Notice"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentPurpose_purposeKey_key" ON "ConsentPurpose"("purposeKey");
