/**
 * Seed script for the Suvidha prototype. Populates:
 *  - The institution/connector catalog shared by every domain
 *  - A living Estate Planner persona demonstrating the full pre-death + lifelong-admin experience
 *  - Three Legacy & Succession estates covering the "smooth claim", "no will / multiple heirs",
 *    and "false-death correction" golden flows
 *  - A family-assisted-access example (Domain H)
 *  - Life-event, service-request, inbox, and consent examples across the lifelong domain
 *
 * All data is synthetic. No real Aadhaar, PAN, passport, bank, or policy numbers appear anywhere —
 * see docs/PRIVACY.md. Institution names for private banks/insurers/AMCs are invented; government
 * bodies (UIDAI, Income Tax Department, Parivahan, EPFO, Registrar General) are referenced by their
 * real generic names because the product is about how citizens interact with those real functions
 * conceptually — no real API of theirs is called anywhere in this prototype.
 *
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { toJsonColumn } from "../src/lib/json";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

const DEMO = true; // every record this script creates is synthetic demo data

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
function maskAadhaar(last4: string) {
  return `XXXX XXXX ${last4}`;
}
function maskAccount(last4: string) {
  return `••••${last4}`;
}
function hash(value: string) {
  // Not cryptographic — a stable, obviously-synthetic stand-in for a salted match hash.
  return `demo_hash_${Buffer.from(value).toString("base64url").slice(0, 24)}`;
}

async function main() {
  console.log("Seeding Suvidha demo data...");

  // ---------------------------------------------------------------------------------------------
  // REGULATORS & INSTITUTIONS
  // ---------------------------------------------------------------------------------------------
  const [rbi, sebi, irdai, , epfoRegulator, rgi] = await Promise.all([
    prisma.regulator.create({ data: { name: "Reserve Bank of India", shortCode: "RBI" } }),
    prisma.regulator.create({ data: { name: "Securities and Exchange Board of India", shortCode: "SEBI" } }),
    prisma.regulator.create({ data: { name: "Insurance Regulatory and Development Authority of India", shortCode: "IRDAI" } }),
    prisma.regulator.create({ data: { name: "Pension Fund Regulatory and Development Authority", shortCode: "PFRDA" } }),
    prisma.regulator.create({ data: { name: "Employees' Provident Fund Organisation", shortCode: "EPFO" } }),
    prisma.regulator.create({ data: { name: "Registrar General of India", shortCode: "RGI" } }),
  ]);

  const uidai = await prisma.institution.create({ data: { name: "UIDAI (Aadhaar)", category: "government_identity" } });
  const incomeTax = await prisma.institution.create({ data: { name: "Income Tax Department", category: "tax_authority" } });
  const parivahan = await prisma.institution.create({ data: { name: "Parivahan (State Transport Department)", category: "licence_authority" } });
  const registrar = await prisma.institution.create({
    data: { name: "State Civil Registration Department", category: "government_registry", isRegistrarAuthority: true, regulatorId: rgi.id },
  });
  const ashokaBank = await prisma.institution.create({ data: { name: "Ashoka National Bank", category: "bank", regulatorId: rbi.id } });
  const konkanBank = await prisma.institution.create({ data: { name: "Konkan Cooperative Bank", category: "bank", regulatorId: rbi.id } });
  const surakshaInsurance = await prisma.institution.create({ data: { name: "Suraksha Life Insurance", category: "insurer", regulatorId: irdai.id } });
  const himalayaMF = await prisma.institution.create({ data: { name: "Himalaya Mutual Fund", category: "investment_provider", regulatorId: sebi.id } });
  const depository = await prisma.institution.create({ data: { name: "Central Securities Depository (simulated)", category: "depository", regulatorId: sebi.id } });
  const epfo = await prisma.institution.create({ data: { name: "EPFO", category: "pension_body", regulatorId: epfoRegulator.id } });
  const subRegistrar = await prisma.institution.create({ data: { name: "State Sub-Registrar Office", category: "property_registry" } });
  const employer = await prisma.institution.create({ data: { name: "Acme Innovations Pvt Ltd", category: "employer" } });
  const telecom = await prisma.institution.create({ data: { name: "Sanchar Mobile Networks", category: "telecom" } });
  void telecom; // deliberately left unconnected to every persona — the "connect a new institution" demo target
  const electricityBoard = await prisma.institution.create({ data: { name: "City Electricity Board", category: "utility" } });

  // ---------------------------------------------------------------------------------------------
  // CONNECTOR CATALOG
  // ---------------------------------------------------------------------------------------------
  const connectorDefs: Array<{ key: string; displayName: string; integrationLabel: string; description: string }> = [
    { key: "death_registry", displayName: "Death Registry", integrationLabel: "policy_dependency_future", description: "Simulated CRS death-event feed." },
    { key: "digilocker", displayName: "DigiLocker", integrationLabel: "regulated_partner_integration_required", description: "Simulated issued-document fetch." },
    { key: "pan_verification", displayName: "PAN Verification", integrationLabel: "regulated_partner_integration_required", description: "Simulated PAN identity check." },
    { key: "account_aggregator", displayName: "Account Aggregator", integrationLabel: "regulated_partner_integration_required", description: "Simulated consent-based financial data pull." },
    { key: "ckyc", displayName: "CKYC", integrationLabel: "regulated_partner_integration_required", description: "Simulated central KYC lookup." },
    { key: "bank", displayName: "Bank Connector", integrationLabel: "institution_specific_integration_required", description: "Simulated bank account sync." },
    { key: "depository", displayName: "Depository Connector", integrationLabel: "institution_specific_integration_required", description: "Simulated demat holdings sync." },
    { key: "mutual_fund", displayName: "Mutual Fund Connector", integrationLabel: "institution_specific_integration_required", description: "Simulated MF folio sync." },
    { key: "insurance", displayName: "Insurance Connector", integrationLabel: "institution_specific_integration_required", description: "Simulated policy sync." },
    { key: "epfo", displayName: "EPFO Connector", integrationLabel: "regulated_partner_integration_required", description: "Simulated EPF/EPS/EDLI sync." },
    { key: "nps", displayName: "NPS Connector", integrationLabel: "regulated_partner_integration_required", description: "Simulated NPS account sync." },
    { key: "iepf", displayName: "IEPF Connector", integrationLabel: "manual_assisted_workflow", description: "Simulated unclaimed-asset lookup." },
    { key: "land_records", displayName: "Land Records Connector", integrationLabel: "institution_specific_integration_required", description: "Simulated state land-record lookup." },
    { key: "property_registration", displayName: "Property Registration Connector", integrationLabel: "manual_assisted_workflow", description: "Simulated mutation application." },
    { key: "vehicle_records", displayName: "Vehicle Records Connector", integrationLabel: "regulated_partner_integration_required", description: "Simulated Parivahan vehicle lookup." },
    { key: "employer_benefits", displayName: "Employer Benefits Connector", integrationLabel: "institution_specific_integration_required", description: "Simulated gratuity/salary-dues lookup." },
    { key: "postal_savings", displayName: "Postal Savings Connector", integrationLabel: "manual_assisted_workflow", description: "Simulated PPF/NSC/KVP lookup." },
    { key: "court_legal_document", displayName: "Court / Legal Document Connector", integrationLabel: "manual_assisted_workflow", description: "Simulated e-courts document lookup." },
    { key: "notification", displayName: "Notification Connector", integrationLabel: "prototype_simulation", description: "In-app/email/SMS simulated delivery." },
  ];
  const connectors: Record<string, Awaited<ReturnType<typeof prisma.connector.create>>> = {};
  for (const c of connectorDefs) {
    connectors[c.key] = await prisma.connector.create({ data: c });
  }

  // ---------------------------------------------------------------------------------------------
  // LIVING ESTATE PLANNER PERSONA — Meera Krishnan (Golden Flow A: unified onboarding + planning)
  // ---------------------------------------------------------------------------------------------
  const meera = await prisma.person.create({
    data: {
      fullName: "Meera Krishnan",
      preferredName: "Meera",
      dateOfBirth: new Date("1978-04-12"),
      gender: "female",
      scenarioTag: "living-planner",
      identifiers: {
        create: [
          { idType: "aadhaar_last4", maskedValue: maskAadhaar("4821"), valueHash: hash("meera-aadhaar"), verified: true, verificationSource: "DigiLocker (simulated)" },
          { idType: "pan", maskedValue: "AAXXX9821X", valueHash: hash("meera-pan"), verified: true, verificationSource: "PAN Verification (simulated)" },
        ],
      },
      contactMethods: {
        create: [
          { type: "mobile", value: "+91 98XXX XX210", isPrimary: true, verified: true },
          { type: "email", value: "meera.krishnan@example.com", isPrimary: true, verified: true },
        ],
      },
      addresses: {
        create: [{ label: "home", line1: "14 Lotus Enclave", city: "Pune", state: "Maharashtra", pincode: "411001" }],
      },
    },
  });
  const meeraUser = await prisma.user.create({
    data: { email: "meera.krishnan@demo.suvidha.app", displayName: "Meera Krishnan", primaryRole: "estate_planner", personId: meera.id },
  });

  const meeraSpouse = await prisma.person.create({ data: { fullName: "Arvind Krishnan", scenarioTag: "living-planner" } });
  const meeraDaughter = await prisma.person.create({ data: { fullName: "Divya Krishnan", scenarioTag: "living-planner" } });
  await prisma.relationship.createMany({
    data: [
      { personId: meera.id, relatedPersonId: meeraSpouse.id, relationType: "spouse", verified: true },
      { personId: meeraSpouse.id, relatedPersonId: meera.id, relationType: "spouse", verified: true },
      { personId: meera.id, relatedPersonId: meeraDaughter.id, relationType: "child", verified: true },
      { personId: meeraDaughter.id, relatedPersonId: meera.id, relationType: "parent", verified: true },
    ],
  });

  // --- Legacy & Succession domain: Meera's living estate plan ---
  const meeraPlan = await prisma.estatePlan.create({
    data: {
      personId: meera.id,
      readinessScore: 62,
      lastReviewedAt: daysAgo(20),
      nextReviewDueAt: daysFromNow(160),
      emergencyInstructions: "Contact Arvind (spouse) first. Family locker key is with Divya. GP: Dr. Furtado, Pune.",
      reminders: { create: [{ title: "Review nominee details after Divya turns 18", dueAt: daysFromNow(200) }] },
    },
  });

  const meeraBankAsset = await prisma.asset.create({
    data: {
      category: "bank_deposit", productType: "Savings Account", institutionId: ashokaBank.id,
      label: "Ashoka National Bank Savings", maskedAccountNumber: maskAccount("2210"), provenance: "connector_verified", scenarioTag: "living-planner",
      holdings: { create: [{ personId: meera.id, holdingType: "sole" }] },
      nominations: { create: [{ nomineeNameOnRecord: "Arvind Krishnan", nomineeRelationOnRecord: "Spouse", nomineePersonId: meeraSpouse.id, sharePercentage: 100, registeredAt: daysAgo(900), status: "active" }] },
    },
  });
  const meeraFD = await prisma.asset.create({
    data: { category: "fixed_deposit", productType: "5-Year FD", institutionId: konkanBank.id, label: "Konkan Cooperative Bank FD", maskedAccountNumber: maskAccount("7745"), provenance: "self_reported", scenarioTag: "living-planner",
      holdings: { create: [{ personId: meera.id, holdingType: "sole" }] } },
    // deliberately no nomination — this is the "nomination gap" the readiness report surfaces
  });
  const meeraMF = await prisma.asset.create({
    data: { category: "mutual_fund", productType: "Equity Growth Fund", institutionId: himalayaMF.id, label: "Himalaya Mutual Fund — Growth Plan", maskedAccountNumber: maskAccount("3390"), provenance: "connector_verified", scenarioTag: "living-planner",
      holdings: { create: [{ personId: meera.id, holdingType: "sole" }] },
      nominations: { create: [{ nomineeNameOnRecord: "Divya Krishnan", nomineeRelationOnRecord: "Daughter", nomineePersonId: meeraDaughter.id, isMinor: true, guardianNameOnRecord: "Arvind Krishnan", sharePercentage: 100, registeredAt: daysAgo(400), status: "active" }] } },
  });
  const meeraDemat = await prisma.asset.create({
    data: { category: "demat_securities", productType: "Demat Account", institutionId: depository.id, label: "Demat Holding — Central Securities Depository", maskedAccountNumber: maskAccount("1102"), provenance: "connector_verified", scenarioTag: "living-planner",
      holdings: { create: [{ personId: meera.id, holdingType: "sole" }] } },
  });
  const meeraInsurance = await prisma.asset.create({
    data: { category: "life_insurance", productType: "Term Plan", institutionId: surakshaInsurance.id, label: "Suraksha Life — Term Plan", maskedAccountNumber: maskAccount("5567"), provenance: "connector_verified", scenarioTag: "living-planner",
      holdings: { create: [{ personId: meera.id, holdingType: "sole" }] },
      nominations: { create: [{ nomineeNameOnRecord: "Arvind Krishnan", nomineeRelationOnRecord: "Spouse", nomineePersonId: meeraSpouse.id, sharePercentage: 100, registeredAt: daysAgo(700), status: "active" }] } },
  });
  const meeraEPF = await prisma.asset.create({
    data: { category: "epf", productType: "EPF Account", institutionId: epfo.id, label: "EPF Account", maskedAccountNumber: maskAccount("8834"), provenance: "connector_verified", scenarioTag: "living-planner",
      holdings: { create: [{ personId: meera.id, holdingType: "sole" }] } },
    // no nomination on file — another gap
  });
  const meeraProperty = await prisma.asset.create({
    data: { category: "property", productType: "Residential Apartment", institutionId: subRegistrar.id, label: "14 Lotus Enclave, Pune", provenance: "self_reported", scenarioTag: "living-planner",
      holdings: { create: [{ personId: meera.id, holdingType: "sole" }] } },
  });
  const meeraVehicle = await prisma.asset.create({
    data: { category: "vehicle", productType: "Sedan Car", institutionId: parivahan.id, label: "Maruti-class Sedan — MH12 series", provenance: "self_reported", scenarioTag: "living-planner",
      holdings: { create: [{ personId: meera.id, holdingType: "sole" }] } },
  });
  await prisma.liability.create({
    data: { personId: meera.id, category: "home_loan", label: "Home Loan — Ashoka National Bank", outstandingAmountBand: "₹15,00,000 – ₹25,00,000", institutionName: "Ashoka National Bank" },
  });

  const meeraWillDoc = await prisma.legalDocument.create({ data: { ownerPersonId: meera.id, documentType: "will", fileLabel: "Meera_Krishnan_Will_2024.pdf", isDemoDocument: DEMO } });
  const meeraWill = await prisma.willRecord.create({
    data: { testatorPersonId: meera.id, documentId: meeraWillDoc.id, storageStatus: "uploaded", executionDate: new Date("2024-03-01"), registrationStatus: "unregistered",
      executorAppointments: { create: [{ executorPersonId: meeraSpouse.id, executorNameOnRecord: "Arvind Krishnan", isPrimary: true }] } },
  });

  // Trusted Contacts for Meera
  const permImmediate = await prisma.accessPolicy.create({ data: { name: "Confirmation only (immediate)", visibilityLevel: "plan_exists_confirmation", timingRule: "immediate" } });
  const permAfterDeath = await prisma.accessPolicy.create({ data: { name: "Full inventory, no balances (after verified death)", visibilityLevel: "full_inventory_no_balances", timingRule: "after_verified_death" } });
  const permWaiting = await prisma.accessPolicy.create({ data: { name: "Selected documents (7-day wait after verified death)", visibilityLevel: "selected_documents", timingRule: "after_waiting_period", waitingPeriodDays: 7 } });

  const tcSpouse = await prisma.trustedContact.create({
    data: { grantorPersonId: meera.id, holderPersonId: meeraSpouse.id, label: "Spouse", status: "active", activatedAt: daysAgo(300),
      accessGrants: { create: [{ accessPolicyId: permAfterDeath.id, purposeTags: toJsonColumn(["bereavement_support"]) }] } },
  });
  const tcDaughter = await prisma.trustedContact.create({
    data: { grantorPersonId: meera.id, holderPersonId: meeraDaughter.id, label: "Daughter", status: "active", activatedAt: daysAgo(180),
      accessGrants: { create: [{ accessPolicyId: permWaiting.id, purposeTags: toJsonColumn(["document_access"]) }] } },
  });
  void tcSpouse; void tcDaughter; void permImmediate;
  void meeraUser; void meeraPlan; void meeraMF; void meeraDemat; void meeraEPF; void meeraProperty; void meeraVehicle; void meeraWill;

  // ---------------------------------------------------------------------------------------------
  // LIFELONG ADMINISTRATION DOMAIN — Meera's Citizen Profile, institutions, requests, life event
  // ---------------------------------------------------------------------------------------------
  const meeraProfile = await prisma.citizenProfile.create({
    data: { personId: meera.id, preferredLanguage: "en", residencyStatus: "resident", citizenship: "India" },
  });

  const fieldDefs = [
    { fieldKey: "legal_name", label: "Legal name", category: "identity" },
    { fieldKey: "present_address", label: "Present address", category: "address" },
    { fieldKey: "mobile_primary", label: "Primary mobile number", category: "contact" },
  ];
  const fields: Record<string, Awaited<ReturnType<typeof prisma.profileField.create>>> = {};
  for (const f of fieldDefs) fields[f.fieldKey] = await prisma.profileField.create({ data: f });

  const nameAadhaar = await prisma.profileFieldValue.create({
    data: { citizenProfileId: meeraProfile.id, profileFieldId: fields.legal_name.id, value: "Meera Krishnan", provenance: "verified_by_source", sourceLabel: "Aadhaar (simulated)", sourceInstitutionId: uidai.id, lastVerifiedAt: daysAgo(400) },
  });
  const namePAN = await prisma.profileFieldValue.create({
    data: { citizenProfileId: meeraProfile.id, profileFieldId: fields.legal_name.id, value: "Meera A Krishnan", provenance: "verified_by_source", sourceLabel: "PAN (simulated)", sourceInstitutionId: incomeTax.id, lastVerifiedAt: daysAgo(1200) },
  });
  await prisma.profileConflict.create({
    data: { citizenProfileId: meeraProfile.id, profileFieldId: fields.legal_name.id, primaryValueId: nameAadhaar.id, alternateValueId: namePAN.id, status: "open" },
  });

  const addrAadhaar = await prisma.profileFieldValue.create({
    data: { citizenProfileId: meeraProfile.id, profileFieldId: fields.present_address.id, value: "14 Lotus Enclave, Pune, MH 411001", provenance: "verified_by_source", sourceLabel: "Aadhaar (simulated)", sourceInstitutionId: uidai.id, lastVerifiedAt: daysAgo(400) },
  });
  const addrBank = await prisma.profileFieldValue.create({
    data: { citizenProfileId: meeraProfile.id, profileFieldId: fields.present_address.id, value: "22 Ganesh Society, Pune, MH 411004 (old)", provenance: "verified_by_source", sourceLabel: "Ashoka National Bank KYC (simulated)", sourceInstitutionId: ashokaBank.id, lastVerifiedAt: daysAgo(1500) },
  });
  await prisma.profileConflict.create({
    data: { citizenProfileId: meeraProfile.id, profileFieldId: fields.present_address.id, primaryValueId: addrAadhaar.id, alternateValueId: addrBank.id, status: "open" },
  });

  // Institutional Relationship graph for Meera (reusing the estate-domain Asset rows where financial)
  const irAadhaar = await prisma.institutionRelationship.create({
    data: { personId: meera.id, institutionId: uidai.id, relationshipType: "government_identity", label: "Aadhaar", referenceNumberMasked: maskAadhaar("4821"), identifierUsed: "aadhaar_last4", status: "active", verificationStatus: "verified", lastSyncedAt: daysAgo(2), connectorId: connectors.digilocker.id },
  });
  const irPAN = await prisma.institutionRelationship.create({
    data: { personId: meera.id, institutionId: incomeTax.id, relationshipType: "government_identity", label: "PAN & Income Tax Profile", referenceNumberMasked: "AAXXX9821X", identifierUsed: "pan", status: "active", verificationStatus: "verified", lastSyncedAt: daysAgo(30), connectorId: connectors.pan_verification.id },
  });
  const irDL = await prisma.institutionRelationship.create({
    data: { personId: meera.id, institutionId: parivahan.id, relationshipType: "government_licence", label: "Driving Licence", referenceNumberMasked: "MH•••••••210", identifierUsed: "driving_licence", status: "active", renewalDueAt: daysFromNow(45), verificationStatus: "verified", lastSyncedAt: daysAgo(60), connectorId: connectors.vehicle_records.id },
  });
  const irBank = await prisma.institutionRelationship.create({
    data: { personId: meera.id, institutionId: ashokaBank.id, relationshipType: "financial_account", label: "Ashoka National Bank Savings Account", referenceNumberMasked: maskAccount("2210"), linkedAssetId: meeraBankAsset.id, status: "active", registeredNomineeSummary: "Spouse — 100%", verificationStatus: "verified", lastSyncedAt: daysAgo(1), connectorId: connectors.bank.id },
  });
  const irFD = await prisma.institutionRelationship.create({
    data: { personId: meera.id, institutionId: konkanBank.id, relationshipType: "financial_account", label: "Konkan Cooperative Bank Fixed Deposit", referenceNumberMasked: maskAccount("7745"), linkedAssetId: meeraFD.id, status: "active", registeredNomineeSummary: "No nominee on record", verificationStatus: "verified", lastSyncedAt: daysAgo(5), connectorId: connectors.bank.id },
  });
  const irInsurance = await prisma.institutionRelationship.create({
    data: { personId: meera.id, institutionId: surakshaInsurance.id, relationshipType: "financial_account", label: "Suraksha Life — Term Plan", referenceNumberMasked: maskAccount("5567"), linkedAssetId: meeraInsurance.id, status: "active", registeredNomineeSummary: "Spouse — 100%", verificationStatus: "verified", lastSyncedAt: daysAgo(10), connectorId: connectors.insurance.id },
  });
  const irEmployer = await prisma.institutionRelationship.create({
    data: { personId: meera.id, institutionId: employer.id, relationshipType: "employer", label: "Acme Innovations Pvt Ltd", status: "active", verificationStatus: "verified", lastSyncedAt: daysAgo(15) },
  });
  const irElectricity = await prisma.institutionRelationship.create({
    data: { personId: meera.id, institutionId: electricityBoard.id, relationshipType: "utility", label: "City Electricity Board Connection", referenceNumberMasked: "CEB••••4471", status: "active", verificationStatus: "verified", lastSyncedAt: daysAgo(3) },
  });
  // The remaining financial Assets (mutual fund, demat, EPF) previously had no matching
  // InstitutionRelationship row, so they never appeared on /institutions and the EPF nomination
  // gap had no working "Add nominee" deep-link target — found during a design review and fixed.
  const irMF = await prisma.institutionRelationship.create({
    data: { personId: meera.id, institutionId: himalayaMF.id, relationshipType: "financial_account", label: "Himalaya Mutual Fund — Growth Plan", referenceNumberMasked: maskAccount("3390"), linkedAssetId: meeraMF.id, status: "active", registeredNomineeSummary: "Daughter — 100%", verificationStatus: "verified", lastSyncedAt: daysAgo(7), connectorId: connectors.mutual_fund.id },
  });
  const irDemat = await prisma.institutionRelationship.create({
    data: { personId: meera.id, institutionId: depository.id, relationshipType: "financial_account", label: "Demat Holding — Central Securities Depository", referenceNumberMasked: maskAccount("1102"), linkedAssetId: meeraDemat.id, status: "active", registeredNomineeSummary: "No nominee on record", verificationStatus: "verified", lastSyncedAt: daysAgo(12), connectorId: connectors.depository.id },
  });
  const irEPF = await prisma.institutionRelationship.create({
    data: { personId: meera.id, institutionId: epfo.id, relationshipType: "financial_account", label: "EPF Account", referenceNumberMasked: maskAccount("8834"), linkedAssetId: meeraEPF.id, status: "active", registeredNomineeSummary: "No nominee on record", verificationStatus: "verified", lastSyncedAt: daysAgo(20), connectorId: connectors.epfo.id },
  });
  void irMF; void irDemat; void irEPF;
  await prisma.sourceSync.createMany({
    data: [
      { institutionRelationshipId: irBank.id, status: "success", startedAt: daysAgo(1), completedAt: daysAgo(1), recordsSynced: 4 },
      { institutionRelationshipId: irFD.id, status: "partial_failure", startedAt: daysAgo(5), completedAt: daysAgo(5), recordsSynced: 1, failureReason: "Nominee detail feed timed out — balance and holder data synced." },
    ],
  });

  // Document hub
  const aadhaarDoc = await prisma.legalDocument.create({
    data: { ownerPersonId: meera.id, documentType: "aadhaar_card", fileLabel: "Aadhaar_Card.pdf", isDemoDocument: DEMO, verifications: { create: [{ outcome: "verified", notes: "Matched against UIDAI demographic response (simulated).", verifiedAt: daysAgo(300) }] } },
  });
  await prisma.documentProfile.create({
    data: { legalDocumentId: aadhaarDoc.id, issuer: "UIDAI", documentCategory: "identity", digitalSignatureStatus: "not_applicable", permittedUses: toJsonColumn(["identity_verification", "address_proof"]) },
  });
  const panDoc = await prisma.legalDocument.create({
    data: { ownerPersonId: meera.id, documentType: "other", fileLabel: "PAN_Card.pdf", isDemoDocument: DEMO, verifications: { create: [{ outcome: "verified", verifiedAt: daysAgo(300) }] } },
  });
  await prisma.documentProfile.create({ data: { legalDocumentId: panDoc.id, issuer: "Income Tax Department", documentCategory: "tax", permittedUses: toJsonColumn(["tax_filing", "identity_verification"]) } });
  const dlDoc = await prisma.legalDocument.create({
    data: { ownerPersonId: meera.id, documentType: "other", fileLabel: "Driving_Licence.pdf", isDemoDocument: DEMO, verifications: { create: [{ outcome: "verified", verifiedAt: daysAgo(200) }] } },
  });
  const dlDocProfile = await prisma.documentProfile.create({
    data: { legalDocumentId: dlDoc.id, issuer: "Parivahan", documentCategory: "identity", expiryDate: daysFromNow(45), permittedUses: toJsonColumn(["identity_verification", "address_proof"]) },
  });
  await prisma.renewal.create({ data: { documentProfileId: dlDocProfile.id, dueDate: daysFromNow(45), status: "upcoming" } });

  const insurancePolicyDoc = await prisma.legalDocument.create({
    data: { ownerPersonId: meera.id, documentType: "other", fileLabel: "Suraksha_Life_Policy_Document.pdf", isDemoDocument: DEMO, verifications: { create: [{ outcome: "verified", verifiedAt: daysAgo(600) }] } },
  });
  const insurancePolicyProfile = await prisma.documentProfile.create({
    data: { legalDocumentId: insurancePolicyDoc.id, issuer: "Suraksha Life Insurance", documentCategory: "insurance", issueDate: daysAgo(700), expiryDate: daysFromNow(20), permittedUses: toJsonColumn(["claims_processing"]) },
  });
  await prisma.renewal.create({ data: { documentProfileId: insurancePolicyProfile.id, dueDate: daysFromNow(20), status: "upcoming" } });
  await prisma.documentShare.create({ data: { documentProfileId: insurancePolicyProfile.id, sharedWithLabel: "Suraksha Life Insurance", purpose: "Policy renewal confirmation", sharedAt: daysAgo(30) } });

  const oldElectricityBillDoc = await prisma.legalDocument.create({
    data: { ownerPersonId: meera.id, documentType: "other", fileLabel: "Electricity_Bill_Mar_2026.pdf", isDemoDocument: DEMO, verifications: { create: [{ outcome: "needs_original", notes: "One corner of the scan is illegible — the same document flagged on the Ashoka Bank address request.", verifiedAt: daysAgo(1) }] } },
  });
  await prisma.documentProfile.create({ data: { legalDocumentId: oldElectricityBillDoc.id, issuer: "City Electricity Board", documentCategory: "address", issueDate: daysAgo(20) } });

  // Service catalogue: every institution that participates in the address-change life event gets
  // its own address_update ServiceDefinition, so requests are attributed to the right institution
  // (see src/app/(citizen)/life-events/[id]/actions.ts, which looks these up by institution).
  async function seedAddressUpdateService(institutionId: string, institutionName: string, requiresInPerson = false) {
    const catalogue = await prisma.serviceCatalogue.create({ data: { institutionId, name: `${institutionName} — Citizen Services` } });
    return prisma.serviceDefinition.create({
      data: {
        serviceCatalogueId: catalogue.id, serviceCategory: "address_update", title: "Update registered address",
        description: `Update the address linked to your record at ${institutionName}.`, feeBand: "Free", publishedSlaDays: 5, requiresInPerson,
        requiredDocumentRules: { create: [{ documentCategory: "address", isMandatory: true, reusePolicy: "reusable_if_verified_and_current" }] },
        requiredFields: { create: [{ fieldKey: "present_address", label: "New present address", isMandatory: true }] },
        channels: { create: [{ channelKey: requiresInPerson ? "in_person" : "online_portal", label: requiresInPerson ? "Branch/office visit" : "Online portal", isPrimary: true }] },
        statusMappings: { create: [
          { rawStatusLabel: "Request Received", normalizedStatus: "submitted" },
          { rawStatusLabel: "KYC Team Reviewing", normalizedStatus: "under_review" },
          { rawStatusLabel: "Updated", normalizedStatus: "completed" },
        ] },
      },
    });
  }

  const ashokaAddressService = await seedAddressUpdateService(ashokaBank.id, "Ashoka National Bank");
  const konkanAddressService = await seedAddressUpdateService(konkanBank.id, "Konkan Cooperative Bank");
  const surakshaAddressService = await seedAddressUpdateService(surakshaInsurance.id, "Suraksha Life Insurance");
  const parivahanAddressService = await seedAddressUpdateService(parivahan.id, "Parivahan (State Transport Department)", true);
  const employerAddressService = await seedAddressUpdateService(employer.id, "Acme Innovations Pvt Ltd");
  const electricityAddressService = await seedAddressUpdateService(electricityBoard.id, "City Electricity Board");
  void konkanAddressService; void surakshaAddressService; void parivahanAddressService; void employerAddressService; void electricityAddressService;

  // Generic per-institution service seeding for categories the general request engine (not just
  // the address-change life event) needs a correctly-attributed ServiceDefinition for — same fix
  // as seedAddressUpdateService above: one ServiceDefinition per institution, never a single
  // definition reused (and mis-attributed) across every institution's requests.
  async function seedServiceDefinition(institutionId: string, institutionName: string, opts: { category: string; title: string; description: string; fieldKey?: string; label?: string }) {
    const catalogue = await prisma.serviceCatalogue.findFirst({ where: { institutionId } }) ?? await prisma.serviceCatalogue.create({ data: { institutionId, name: `${institutionName} — Citizen Services` } });
    return prisma.serviceDefinition.create({
      data: {
        serviceCatalogueId: catalogue.id, serviceCategory: opts.category, title: opts.title, description: opts.description,
        feeBand: "Free", publishedSlaDays: 5, requiresInPerson: false,
        ...(opts.fieldKey ? { requiredFields: { create: [{ fieldKey: opts.fieldKey, label: opts.label ?? opts.title, isMandatory: true }] } } : {}),
      },
    });
  }

  const nomineeUpdateService = await seedServiceDefinition(ashokaBank.id, "Ashoka National Bank", { category: "nominee_update", title: "Add or update nominee", description: "Register or change the nominee for this account." });
  const konkanNomineeService = await seedServiceDefinition(konkanBank.id, "Konkan Cooperative Bank", { category: "nominee_update", title: "Add or update nominee", description: "Register or change the nominee for this fixed deposit." });
  const epfoNomineeService = await seedServiceDefinition(epfo.id, "EPFO", { category: "nominee_update", title: "Add or update EPF nominee", description: "Register or change the nominee for this EPF account." });
  const depositoryNomineeService = await seedServiceDefinition(depository.id, "Central Securities Depository (simulated)", { category: "nominee_update", title: "Add or update nominee", description: "Register or change the nominee for this demat holding." });
  void epfoNomineeService; void depositoryNomineeService;
  const ashokaMobileService = await seedServiceDefinition(ashokaBank.id, "Ashoka National Bank", { category: "mobile_update", title: "Update registered mobile number", description: "Update the mobile number linked to this account for OTP and alerts.", fieldKey: "mobile_primary", label: "New mobile number" });
  const incomeTaxNameCorrectionService = await seedServiceDefinition(incomeTax.id, "Income Tax Department", { category: "name_correction", title: "PAN name correction", description: "Correct the legal name recorded against your PAN.", fieldKey: "legal_name", label: "Corrected legal name" });
  void ashokaMobileService; void incomeTaxNameCorrectionService; void nomineeUpdateService;

  // The Ashoka Bank address request — pre-staged mid-review with an open deficiency, so the
  // Claims Officer → citizen-response → maker/checker → completion loop is fully demoable live.
  const addressRequest = await prisma.serviceRequest.create({
    data: {
      personId: meera.id, institutionRelationshipId: irBank.id, serviceDefinitionId: ashokaAddressService.id,
      title: "Update address at Ashoka National Bank", normalizedStatus: "additional_information_required", executionMethod: "requires_institution_approval",
      requestedValueSummary: "New address: 22 Ganga Vihar Layout, Pune, MH 411045",
      userDeadlineAt: daysFromNow(20), scenarioTag: "living-planner",
      application: { create: { applicationNumber: "ANB-ADDR-88213", officialStatusRaw: "KYC Team Reviewing", channelUsed: "online_portal" } },
      statusEvents: { create: [
        { normalizedStatus: "submitted", officialStatusRaw: "Request Received", occurredAt: daysAgo(4) },
        { normalizedStatus: "under_review", officialStatusRaw: "KYC Team Reviewing", occurredAt: daysAgo(2) },
        { normalizedStatus: "additional_information_required", note: "A clearer address-proof document is required — the uploaded copy is illegible in one corner.", occurredAt: daysAgo(1) },
      ] },
      submissions: { create: [{ channelUsed: "online_portal", outcome: "simulated_success", submittedAt: daysAgo(4) }] },
      deficiencyRequests: { create: [{ title: "Clearer address-proof document required", description: "The uploaded address-proof document is partially illegible. Please submit a clearer copy or an alternative document (e.g. a recent utility bill) showing the new address in full.", status: "open" }] },
    },
  });

  const fdNomineeRequest = await prisma.serviceRequest.create({
    data: {
      personId: meera.id, institutionRelationshipId: irFD.id, serviceDefinitionId: konkanNomineeService.id,
      title: "Add nominee to Konkan Cooperative Bank FD", normalizedStatus: "draft", executionMethod: "generated_form_packet",
      scenarioTag: "living-planner",
    },
  });
  void fdNomineeRequest;

  // Life event: address change (fully sequenced example)
  const lifeEventTemplates = [
    "address_change","mobile_number_change","name_correction","marriage","divorce","birth_or_adoption","turning_18","first_job","job_change","job_loss",
    "business_start","business_close","property_purchase","property_sale","vehicle_purchase","interstate_move","move_abroad","return_to_india",
    "retirement","incapacity","hospitalisation","lost_documents","identity_theft","family_bereavement","account_owner_death",
  ];
  const templates: Record<string, Awaited<ReturnType<typeof prisma.lifeEventTemplate.create>>> = {};
  const templateTitles: Record<string, string> = {
    address_change: "Moving to a new address", mobile_number_change: "Changing my mobile number", name_correction: "Correcting my name",
    marriage: "Marriage", divorce: "Divorce", birth_or_adoption: "Birth or adoption of a child", turning_18: "Turning 18",
    first_job: "Starting my first job", job_change: "Changing employment", job_loss: "Losing employment", business_start: "Starting a business",
    business_close: "Closing a business", property_purchase: "Purchasing property", property_sale: "Selling property",
    vehicle_purchase: "Buying a vehicle", interstate_move: "Moving to another state", move_abroad: "Moving outside India",
    return_to_india: "Returning to India", retirement: "Retirement", incapacity: "Disability or incapacity", hospitalisation: "Hospitalisation",
    lost_documents: "Loss of documents", identity_theft: "Identity theft", family_bereavement: "Death of a family member",
    account_owner_death: "Death of the account owner",
  };
  for (const key of lifeEventTemplates) {
    templates[key] = await prisma.lifeEventTemplate.create({ data: { eventKey: key, title: templateTitles[key], description: `Guided plan for: ${templateTitles[key]}` } });
  }

  // Execution-method mix deliberately covers every honesty label the golden flow needs to
  // demonstrate: one direct API completion, one simulated integration, one deep-link, one
  // generated-form-packet, one in-person-required, one assisted workflow, and one that's already
  // mid-review at an institution (with an open deficiency) so the maker-checker loop is live-demoable.
  const addressLifeEvent = await prisma.lifeEvent.create({
    data: { personId: meera.id, lifeEventTemplateId: templates.address_change.id, status: "in_progress", progressPercent: 14, scenarioTag: "living-planner",
      actions: { create: [
        { title: "Update address on Aadhaar", institutionRelationshipId: irAadhaar.id, priority: "mandatory", sequenceOrder: 1, executionMethod: "deep_link_redirect", status: "completed" },
        { title: "Update address at Ashoka National Bank", institutionRelationshipId: irBank.id, priority: "mandatory", sequenceOrder: 2, executionMethod: "requires_institution_approval", status: "in_progress", serviceRequestId: addressRequest.id },
        { title: "Update address at Konkan Cooperative Bank", institutionRelationshipId: irFD.id, priority: "mandatory", sequenceOrder: 3, executionMethod: "generated_form_packet", status: "pending" },
        { title: "Update address with Suraksha Life Insurance", institutionRelationshipId: irInsurance.id, priority: "mandatory", sequenceOrder: 4, executionMethod: "initiable_via_integration", status: "pending" },
        { title: "Update address on driving licence", institutionRelationshipId: irDL.id, priority: "recommended", sequenceOrder: 5, executionMethod: "in_person_required", status: "pending" },
        { title: "Update address with employer HR", institutionRelationshipId: irEmployer.id, priority: "recommended", sequenceOrder: 6, executionMethod: "assisted_digital_workflow", status: "pending" },
        { title: "Update address for electricity connection", institutionRelationshipId: irElectricity.id, priority: "optional", sequenceOrder: 7, executionMethod: "executable_via_api", status: "pending" },
      ] },
    },
  });
  await prisma.deadline.create({ data: { title: "Complete address update at all banks", dueAt: daysFromNow(20), status: "due_soon" } });
  void addressLifeEvent; void irPAN;

  // Inbox: a tax notice, a reminder, a security alert
  const taxThread = await prisma.inboxThread.create({ data: { personId: meera.id, institutionId: incomeTax.id, subject: "Income Tax — Rectification opportunity for AY 2025-26", threadType: "notice" } });
  const taxMessage = await prisma.message.create({
    data: { inboxThreadId: taxThread.id, senderLabel: "Income Tax Department (simulated)", senderVerified: true, importance: "high",
      originalBody: "A mismatch was found between your reported TDS and Form 26AS for AY 2025-26. Please review and respond within 30 days.",
      plainLanguageSummary: "The tax department found a small mismatch between the tax deducted at source (TDS) your employer reported and what you filed. This is common and usually just needs a rectification request.",
      suggestedNextAction: "Start a Tax Rectification request from Financial Administration.", channel: "in_app" },
  });
  await prisma.notice.create({ data: { messageId: taxMessage.id, noticeNumber: "ITD-2026-RECT-88213", noticeType: "income_tax", responseDeadline: daysFromNow(30), checklistGenerated: true } });
  await prisma.message.create({
    data: { inboxThreadId: taxThread.id, senderLabel: "Meera Krishnan", senderVerified: true, direction: "citizen_to_institution", importance: "normal",
      originalBody: "Acknowledged — I'll review Form 26AS and file a rectification request this week.", channel: "in_app", createdAt: daysAgo(3) },
  });

  const securityThread = await prisma.inboxThread.create({ data: { personId: meera.id, subject: "New sign-in on a recognised device", threadType: "security_alert" } });
  await prisma.message.create({
    data: { inboxThreadId: securityThread.id, senderLabel: "Suvidha Security", senderVerified: true, importance: "normal",
      originalBody: "We noticed a sign-in from a new browser in Pune, Maharashtra.", plainLanguageSummary: "This looks like your usual device and city.", channel: "in_app" },
  });

  // An unverified-sender / suspected-phishing example — the "fraud warning" and "report as
  // suspicious" UI treatment otherwise has no seeded case to demonstrate against.
  const phishingThread = await prisma.inboxThread.create({ data: { personId: meera.id, subject: "URGENT: Your KYC will be suspended", threadType: "consent_request" } });
  await prisma.message.create({
    data: { inboxThreadId: phishingThread.id, senderLabel: "\"Bank Support Team\"", senderVerified: false, importance: "urgent", fraudWarning: true,
      originalBody: "Your KYC verification is incomplete and your account will be suspended in 24 hours. Click here immediately to update your details and avoid suspension.",
      plainLanguageSummary: "This message uses urgency and an unverified sender identity — classic phishing patterns. No genuine institution communicates KYC suspension this way through Suvidha.",
      channel: "sms_simulated", createdAt: daysAgo(2) },
  });

  // Consent examples
  const purposeAssetDiscovery = await prisma.consentPurpose.create({ data: { purposeKey: "asset_discovery", label: "Asset discovery", description: "Find financial relationships across connected institutions." } });
  const purposeAddressSync = await prisma.consentPurpose.create({ data: { purposeKey: "address_verification", label: "Address verification", description: "Compare your address across connected sources." } });
  const meeraConsent = await prisma.consentRecord.create({ data: { personId: meera.id, purpose: "asset_discovery", connectorId: connectors.account_aggregator.id, status: "granted",
    artefacts: { create: [{ receiptNumber: "CR-2026-004471", scopeSummary: "Bank and mutual fund holdings, read-only, 12 months" }] } } });
  await prisma.consentScope.create({ data: { consentRecordId: meeraConsent.id, consentPurposeId: purposeAssetDiscovery.id, institutionId: ashokaBank.id, scopedEntityLabel: "Ashoka National Bank Savings" } });
  await prisma.consentScope.create({ data: { consentRecordId: meeraConsent.id, consentPurposeId: purposeAddressSync.id, institutionId: uidai.id, scopedEntityLabel: "Aadhaar" } });

  // Grievances — a fully resolved one (with an appeal filed against it) and a fresh open one, so
  // the citizen-side escalate/appeal UI and the institution-side resolution-with-category UI both
  // have real data to demonstrate against, not just the create form.
  const resolvedGrievance = await prisma.grievance.create({
    data: {
      raisedByPersonId: meera.id, institutionId: konkanBank.id,
      subject: "Fixed deposit renewal SMS never arrived", description: "I didn't receive the SMS reminder before my FD auto-renewed at a lower rate than expected.",
      status: "resolved", resolutionCategory: "service_delay",
      resolutionNote: "Confirmed our SMS gateway had a delivery delay for your registered number that week. The FD has been re-priced at the rate advertised on the renewal date, and your alert preferences have been re-confirmed.",
      citizenCommunicationSent: true, createdAt: daysAgo(60), resolvedAt: daysAgo(45),
    },
  });
  await prisma.appeal.create({ data: { grievanceId: resolvedGrievance.id, groundsForAppeal: "The re-priced rate is still 0.25% below the original offer I was quoted verbally.", status: "under_review", filedAt: daysAgo(40) } });

  await prisma.grievance.create({
    data: {
      raisedByPersonId: meera.id, institutionId: ashokaBank.id,
      subject: "Address update taking longer than the published SLA", description: "The published SLA for an address update is 5 days, and mine has been pending for over a week.",
      status: "open", createdAt: daysAgo(2),
    },
  });

  // ---------------------------------------------------------------------------------------------
  // FAMILY-ASSISTED ACCESS — Golden Flow: Family Assisted Access (Domain H)
  // ---------------------------------------------------------------------------------------------
  const divyaUser = await prisma.user.create({ data: { email: "divya.krishnan@demo.suvidha.app", displayName: "Divya Krishnan", primaryRole: "family_administrator", personId: meeraDaughter.id } });
  void divyaUser;
  const delegatedTask = await prisma.delegatedTask.create({
    data: { assistantPersonId: meeraDaughter.id, serviceRequestId: fdNomineeRequest.id, permissionTier: "permission_to_prepare", status: "pending_owner_approval" },
  });
  void delegatedTask;

  // ---------------------------------------------------------------------------------------------
  // ESTATE A — "Smooth prepared claim" — Vikram Shah (deceased) / Deepa Shah (claimant)
  // ---------------------------------------------------------------------------------------------
  const vikram = await prisma.person.create({
    data: { fullName: "Vikram Shah", dateOfBirth: new Date("1960-01-15"), dateOfDeath: daysAgo(40), lifeStatus: "deceased_verified", scenarioTag: "estate-a-smooth",
      identifiers: { create: [{ idType: "aadhaar_last4", maskedValue: maskAadhaar("6612"), valueHash: hash("vikram-aadhaar"), verified: true }] } },
  });
  const deepa = await prisma.person.create({ data: { fullName: "Deepa Shah", scenarioTag: "estate-a-smooth" } });
  await prisma.relationship.createMany({
    data: [
      { personId: vikram.id, relatedPersonId: deepa.id, relationType: "spouse", verified: true },
      { personId: deepa.id, relatedPersonId: vikram.id, relationType: "spouse", verified: true },
    ],
  });
  const deepaUser = await prisma.user.create({ data: { email: "deepa.shah@demo.suvidha.app", displayName: "Deepa Shah", primaryRole: "claimant", personId: deepa.id } });
  void deepaUser;

  const vikramBank = await prisma.asset.create({
    data: { category: "bank_deposit", productType: "Savings Account", institutionId: ashokaBank.id, label: "Ashoka National Bank Savings (Vikram)", maskedAccountNumber: maskAccount("4410"), scenarioTag: "estate-a-smooth",
      holdings: { create: [{ personId: vikram.id, holdingType: "sole" }] },
      nominations: { create: [{ nomineeNameOnRecord: "Deepa Shah", nomineeRelationOnRecord: "Spouse", nomineePersonId: deepa.id, sharePercentage: 100, registeredAt: daysAgo(1200), status: "active" }] } },
  });
  const vikramJoint = await prisma.asset.create({
    data: { category: "bank_deposit", productType: "Joint Savings Account", institutionId: konkanBank.id, label: "Konkan Cooperative Bank Joint Account", maskedAccountNumber: maskAccount("9012"), scenarioTag: "estate-a-smooth",
      holdings: { create: [{ personId: vikram.id, holdingType: "joint_either_or_survivor" }, { personId: deepa.id, holdingType: "joint_either_or_survivor" }] },
      jointHolders: { create: [{ personId: deepa.id, mandate: "either_or_survivor" }] } },
  });
  const vikramInsurance = await prisma.asset.create({
    data: { category: "life_insurance", productType: "Whole Life Plan", institutionId: surakshaInsurance.id, label: "Suraksha Life — Whole Life Plan", maskedAccountNumber: maskAccount("2201"), scenarioTag: "estate-a-smooth",
      holdings: { create: [{ personId: vikram.id, holdingType: "sole" }] },
      nominations: { create: [{ nomineeNameOnRecord: "Deepa Shah", nomineeRelationOnRecord: "Spouse", nomineePersonId: deepa.id, sharePercentage: 100, registeredAt: daysAgo(1500), status: "active" }] } },
  });

  const vikramWillDoc = await prisma.legalDocument.create({ data: { ownerPersonId: vikram.id, documentType: "will", fileLabel: "Vikram_Shah_Will.pdf", isDemoDocument: DEMO } });
  await prisma.willRecord.create({
    data: { testatorPersonId: vikram.id, documentId: vikramWillDoc.id, storageStatus: "uploaded", executionDate: new Date("2020-06-01"), registrationStatus: "registered",
      executorAppointments: { create: [{ executorPersonId: deepa.id, executorNameOnRecord: "Deepa Shah", isPrimary: true }] } },
  });

  const vikramDeathDoc = await prisma.legalDocument.create({ data: { ownerPersonId: vikram.id, documentType: "death_certificate", fileLabel: "Vikram_Shah_Death_Certificate.pdf", isDemoDocument: DEMO } });
  const vikramDeath = await prisma.deathEvent.create({
    data: { personId: vikram.id, status: "matched", dateOfDeath: vikram.dateOfDeath!, placeOfDeath: "Pune, Maharashtra", registrarJurisdictionId: undefined,
      registrationNumber: "MH-PUN-2026-004471", informantName: "Deepa Shah", informantRelation: "Spouse", scenarioTag: "estate-a-smooth",
      evidence: { create: [{ evidenceType: "death_certificate", documentId: vikramDeathDoc.id, verificationStatus: "verified" }] } },
  });
  await prisma.deathEventMatch.createMany({
    data: [
      { deathEventId: vikramDeath.id, institutionId: ashokaBank.id, confidenceScore: 0.97, matchFactors: toJsonColumn(["name_exact", "dob_exact", "aadhaar_last4_exact"]), status: "confirmed", riskActionApplied: "flagged_for_review" },
      { deathEventId: vikramDeath.id, institutionId: konkanBank.id, confidenceScore: 0.95, matchFactors: toJsonColumn(["name_exact", "dob_exact"]), status: "confirmed", riskActionApplied: "flagged_for_review" },
      { deathEventId: vikramDeath.id, institutionId: surakshaInsurance.id, confidenceScore: 0.96, matchFactors: toJsonColumn(["name_exact", "dob_exact", "policy_holder_match"]), status: "confirmed", riskActionApplied: "flagged_for_review" },
    ],
  });

  const vikramEstate = await prisma.estate.create({ data: { personId: vikram.id, deathEventId: vikramDeath.id, status: "in_administration", succession: "testamentary" } });
  const deepaClaimant = await prisma.claimant.create({
    data: { estateId: vikramEstate.id, personId: deepa.id, claimedRole: "executor", relationToDeceased: "Spouse", identityVerified: true, wasPreAuthorised: true },
  });

  async function makeClaim(opts: {
    institutionId: string; assetId: string; claimNumber: string; status: string;
    templateKey: string; stepTitles: string[]; currentStep: number;
  }) {
    const claim = await prisma.claim.create({
      data: { estateId: vikramEstate.id, claimantId: deepaClaimant.id, institutionId: opts.institutionId, status: opts.status, claimNumber: opts.claimNumber, submittedAt: daysAgo(25), scenarioTag: "estate-a-smooth",
        claimAssets: { create: [{ assetId: opts.assetId, recommendedPathway: "process_through_executor" }] } },
    });
    const workflow = await prisma.claimWorkflow.create({ data: { claimId: claim.id, templateKey: opts.templateKey, currentStepKey: `step-${opts.currentStep}` } });
    for (let i = 0; i < opts.stepTitles.length; i++) {
      await prisma.workflowStep.create({
        data: { claimWorkflowId: workflow.id, stepKey: `step-${i + 1}`, title: opts.stepTitles[i], order: i + 1,
          status: i < opts.currentStep ? "completed" : i === opts.currentStep ? "in_progress" : "pending",
          completedAt: i < opts.currentStep ? daysAgo(25 - i * 5) : undefined },
      });
    }
    return claim;
  }

  const vikramBankClaim = await makeClaim({
    institutionId: ashokaBank.id, assetId: vikramBank.id, claimNumber: "ANB-CLM-771001", status: "approved", templateKey: "nominee_bank_deposit",
    stepTitles: ["Claim received", "Identity & nomination verified", "Maker-checker approval", "Payout processed"], currentStep: 4,
  });
  const vikramJointClaim = await makeClaim({
    institutionId: konkanBank.id, assetId: vikramJoint.id, claimNumber: "KCB-CLM-441202", status: "settled", templateKey: "surviving_joint_holder",
    stepTitles: ["Death intimation received", "Survivor verified", "Account converted to sole name"], currentStep: 3,
  });
  const vikramInsuranceClaim = await makeClaim({
    institutionId: surakshaInsurance.id, assetId: vikramInsurance.id, claimNumber: "SLI-CLM-990331", status: "under_review", templateKey: "nominee_insurance",
    stepTitles: ["Claim intake", "Document verification", "Maker-checker approval", "Payout"], currentStep: 1,
  });

  await prisma.decision.create({ data: { claimId: vikramBankClaim.id, makerCheckerRole: "maker", outcome: "recommend_approve", rationale: "Valid nomination, undisputed, documents verified.", createdAt: daysAgo(6) } });
  await prisma.decision.create({ data: { claimId: vikramBankClaim.id, makerCheckerRole: "checker", outcome: "approve", rationale: "Confirmed maker's assessment; releasing payout.", createdAt: daysAgo(3) } });
  await prisma.payment.create({ data: { claimId: vikramBankClaim.id, purpose: "claim_settlement", amountBand: "₹5,00,000 – ₹10,00,000", payeePersonId: deepa.id, method: "bank_transfer_simulated", status: "processed", processedAt: daysAgo(2) } });
  await prisma.transfer.create({ data: { claimId: vikramJointClaim.id, transferType: "account_ownership_transfer", toPersonId: deepa.id, status: "completed", completedAt: daysAgo(10) } });
  await prisma.recordUpdate.create({ data: { claimId: vikramJointClaim.id, updateType: "ownership_update", summary: "Account converted from joint to sole name (Deepa Shah)." } });

  await prisma.submittedEvidence.createMany({
    data: [
      { claimId: vikramBankClaim.id, legalDocumentId: vikramDeathDoc.id, evidenceLabel: "Death certificate" },
      { claimId: vikramInsuranceClaim.id, legalDocumentId: vikramDeathDoc.id, evidenceLabel: "Death certificate (reused)", reusedFromClaimId: vikramBankClaim.id },
    ],
  });
  void vikramWillDoc;

  // ---------------------------------------------------------------------------------------------
  // ESTATE B — "No will, multiple legal heirs" — Prakash Reddy (deceased) / Lakshmi Reddy (claimant)
  // ---------------------------------------------------------------------------------------------
  const prakash = await prisma.person.create({
    data: { fullName: "Prakash Reddy", dateOfBirth: new Date("1955-09-20"), dateOfDeath: daysAgo(60), lifeStatus: "deceased_verified", scenarioTag: "estate-b-no-will" },
  });
  const lakshmi = await prisma.person.create({ data: { fullName: "Lakshmi Reddy", scenarioTag: "estate-b-no-will" } });
  const kiran = await prisma.person.create({ data: { fullName: "Kiran Reddy", scenarioTag: "estate-b-no-will" } });
  const sunil = await prisma.person.create({ data: { fullName: "Sunil Reddy", scenarioTag: "estate-b-no-will" } });
  await prisma.relationship.createMany({
    data: [
      { personId: prakash.id, relatedPersonId: lakshmi.id, relationType: "child", verified: true },
      { personId: prakash.id, relatedPersonId: kiran.id, relationType: "child", verified: false },
      { personId: prakash.id, relatedPersonId: sunil.id, relationType: "child", verified: false },
      { personId: lakshmi.id, relatedPersonId: kiran.id, relationType: "sibling", verified: false },
      { personId: lakshmi.id, relatedPersonId: sunil.id, relationType: "sibling", verified: false },
    ],
  });
  const lakshmiUser = await prisma.user.create({ data: { email: "lakshmi.reddy@demo.suvidha.app", displayName: "Lakshmi Reddy", primaryRole: "claimant", personId: lakshmi.id } });
  void lakshmiUser;

  const prakashProperty = await prisma.asset.create({
    data: { category: "property", productType: "Agricultural Land", institutionId: subRegistrar.id, label: "6.2 acres, Ranga Reddy District", scenarioTag: "estate-b-no-will",
      holdings: { create: [{ personId: prakash.id, holdingType: "sole" }] } },
  });
  const prakashEPF = await prisma.asset.create({
    data: { category: "epf", productType: "EPF Account", institutionId: epfo.id, label: "EPF Account (Prakash)", maskedAccountNumber: maskAccount("2288"), scenarioTag: "estate-b-no-will",
      holdings: { create: [{ personId: prakash.id, holdingType: "sole" }] } },
    // no nomination — matches "incomplete nominations" scenario
  });
  const prakashInsurance = await prisma.asset.create({
    data: { category: "life_insurance", productType: "Endowment Plan", institutionId: surakshaInsurance.id, label: "Suraksha Life — Endowment Plan", maskedAccountNumber: maskAccount("6690"), scenarioTag: "estate-b-no-will",
      holdings: { create: [{ personId: prakash.id, holdingType: "sole" }] } },
  });
  await prisma.liability.create({ data: { personId: prakash.id, category: "home_loan", label: "Home Loan — Ashoka National Bank", outstandingAmountBand: "₹2,00,000 – ₹5,00,000", institutionName: "Ashoka National Bank" } });

  const prakashDeathDoc = await prisma.legalDocument.create({ data: { ownerPersonId: prakash.id, documentType: "death_certificate", fileLabel: "Prakash_Reddy_Death_Certificate.pdf", isDemoDocument: DEMO } });
  const prakashDeath = await prisma.deathEvent.create({
    data: { personId: prakash.id, status: "matched", dateOfDeath: prakash.dateOfDeath!, placeOfDeath: "Hyderabad, Telangana", registrationNumber: "TG-HYD-2026-002210",
      informantName: "Lakshmi Reddy", informantRelation: "Daughter", scenarioTag: "estate-b-no-will",
      evidence: { create: [{ evidenceType: "death_certificate", documentId: prakashDeathDoc.id, verificationStatus: "verified" }] } },
  });
  await prisma.deathEventMatch.createMany({
    data: [
      { deathEventId: prakashDeath.id, institutionId: epfo.id, confidenceScore: 0.9, matchFactors: toJsonColumn(["name_exact", "dob_exact"]), status: "confirmed" },
      { deathEventId: prakashDeath.id, institutionId: surakshaInsurance.id, confidenceScore: 0.88, matchFactors: toJsonColumn(["name_exact", "dob_close_match"]), status: "needs_human_review" },
    ],
  });

  const prakashEstate = await prisma.estate.create({ data: { personId: prakash.id, deathEventId: prakashDeath.id, status: "open", succession: "intestate" } });
  const lakshmiClaimant = await prisma.claimant.create({
    data: { estateId: prakashEstate.id, personId: lakshmi.id, claimedRole: "legal_heir", relationToDeceased: "Daughter", identityVerified: true, wasPreAuthorised: false },
  });
  await prisma.claimant.create({ data: { estateId: prakashEstate.id, personId: kiran.id, claimedRole: "legal_heir", relationToDeceased: "Son", identityVerified: false, wasPreAuthorised: false } });
  await prisma.claimant.create({ data: { estateId: prakashEstate.id, personId: sunil.id, claimedRole: "legal_heir", relationToDeceased: "Son", identityVerified: false, wasPreAuthorised: false } });

  const prakashInsuranceClaim = await prisma.claim.create({
    data: { estateId: prakashEstate.id, claimantId: lakshmiClaimant.id, institutionId: surakshaInsurance.id, status: "deficiency_pending", claimNumber: "SLI-CLM-114420", submittedAt: daysAgo(15), scenarioTag: "estate-b-no-will",
      claimAssets: { create: [{ assetId: prakashInsurance.id, recommendedPathway: "require_succession_certificate" }] } },
  });
  await prisma.deficiencyRequest.create({
    data: { claimId: prakashInsuranceClaim.id, title: "Succession certificate required", description: "Three legal heirs have been identified with no will or nomination on file. Please submit a succession certificate naming all heirs and their shares, or NOCs from the other two heirs.", status: "open", raisedAt: daysAgo(8) },
  });
  const prakashMutation = await prisma.mutation.create({
    data: { claimId: prakashInsuranceClaim.id, assetId: prakashProperty.id, authorityName: "State Sub-Registrar Office", status: "field_verification_pending", applicationNumber: "MUT-2026-33021" },
  });
  void prakashMutation; void prakashEPF;

  await prisma.grievance.create({
    data: { raisedByPersonId: lakshmi.id, institutionId: surakshaInsurance.id, claimId: prakashInsuranceClaim.id, subject: "Delay beyond published SLA", description: "No update for 10 days beyond the published 30-day SLA.", status: "in_progress" },
  });

  // A light dispute/fraud thread on this estate (folds in original Scenario 4 without a full separate build)
  await prisma.dispute.create({
    data: { estateId: prakashEstate.id, raisedByPersonId: kiran.id, disputeType: "competing_claimants", description: "Kiran disputes the property share Lakshmi has proposed.", status: "under_review" },
  });
  await prisma.fraudSignal.create({
    data: { claimId: prakashInsuranceClaim.id, subjectPersonId: lakshmi.id, signalType: "payout_account_change", severity: "medium", status: "investigating", details: "Payout bank account changed 2 days before submission — flagged for manual review, not yet confirmed as fraudulent." },
  });

  // ---------------------------------------------------------------------------------------------
  // ESTATE C — False-death correction (Golden Flow E) — Fathima Begum
  // ---------------------------------------------------------------------------------------------
  const fathima = await prisma.person.create({
    data: { fullName: "Fathima Begum", dateOfBirth: new Date("1970-11-02"), lifeStatus: "deceased_disputed", scenarioTag: "estate-c-false-match",
      identifiers: { create: [{ idType: "aadhaar_last4", maskedValue: maskAadhaar("3390"), valueHash: hash("fathima-aadhaar"), verified: true }] } },
  });
  const fathimaUser = await prisma.user.create({ data: { email: "fathima.begum@demo.suvidha.app", displayName: "Fathima Begum", primaryRole: "independent_citizen", personId: fathima.id } });
  void fathimaUser;
  await prisma.asset.create({
    data: { category: "bank_deposit", productType: "Savings Account", institutionId: ashokaBank.id, label: "Ashoka National Bank Savings (Fathima)", maskedAccountNumber: maskAccount("5541"), scenarioTag: "estate-c-false-match",
      holdings: { create: [{ personId: fathima.id, holdingType: "sole" }] } },
  });
  const fathimaDeath = await prisma.deathEvent.create({
    data: { personId: fathima.id, status: "contested", dateOfDeath: daysAgo(5), placeOfDeath: "Lucknow, Uttar Pradesh", registrationNumber: "UP-LKO-2026-009981",
      informantName: "Unrelated third party (clerical mismatch)", informantRelation: "other", scenarioTag: "estate-c-false-match" },
  });
  await prisma.deathEventMatch.create({
    data: { deathEventId: fathimaDeath.id, institutionId: ashokaBank.id, confidenceScore: 0.61, matchFactors: toJsonColumn(["name_similar", "dob_close_match", "different_address"]), status: "needs_human_review", riskActionApplied: "flagged_for_review" },
  });
  await prisma.deathEventCorrection.create({
    data: { deathEventId: fathimaDeath.id, reason: "misidentification", challengedByPersonId: fathima.id, status: "reverification_in_progress" },
  });

  // ---------------------------------------------------------------------------------------------
  // INSTITUTION / GOVERNMENT OPS USERS
  // ---------------------------------------------------------------------------------------------
  await prisma.user.create({ data: { email: "registrar.officer@demo.suvidha.app", displayName: "R. Subramaniam (Registrar Officer)", primaryRole: "registrar_officer", institutionId: registrar.id } });
  const claimsOfficer = await prisma.user.create({ data: { email: "claims.officer@demo.suvidha.app", displayName: "Neha Kulkarni (Claims Officer, Suraksha Life Insurance)", primaryRole: "institution_officer", institutionId: surakshaInsurance.id } });
  const verificationOfficer = await prisma.user.create({ data: { email: "verification.officer@demo.suvidha.app", displayName: "Rohan Das (Verification Officer, Suraksha Life Insurance)", primaryRole: "verification_officer", institutionId: surakshaInsurance.id } });
  const maker = await prisma.user.create({ data: { email: "maker@demo.suvidha.app", displayName: "Anita Rao (Maker, Ashoka National Bank)", primaryRole: "maker", institutionId: ashokaBank.id } });
  const checker = await prisma.user.create({ data: { email: "checker@demo.suvidha.app", displayName: "Suresh Menon (Checker, Ashoka National Bank)", primaryRole: "checker", institutionId: ashokaBank.id } });
  // Income Tax Department had no ops persona at all — meaning the PAN name-correction
  // ServiceDefinition (seeded above) could never actually be processed end to end. Found and fixed
  // alongside the address/mobile maker-checker pair, following the same pattern.
  const panMaker = await prisma.user.create({ data: { email: "pan.maker@demo.suvidha.app", displayName: "Ramesh Iyer (Maker, Income Tax Department)", primaryRole: "maker", institutionId: incomeTax.id } });
  const panChecker = await prisma.user.create({ data: { email: "pan.checker@demo.suvidha.app", displayName: "Sunita Pillai (Checker, Income Tax Department)", primaryRole: "checker", institutionId: incomeTax.id } });
  void panMaker; void panChecker;
  await prisma.user.create({ data: { email: "adjudicator@demo.suvidha.app", displayName: "Justice (Retd.) K. Iyer — Adjudicator", primaryRole: "adjudicator", institutionId: surakshaInsurance.id } });
  await prisma.user.create({ data: { email: "grievance.officer@demo.suvidha.app", displayName: "Priya Nambiar (Grievance Officer)", primaryRole: "grievance_officer", institutionId: surakshaInsurance.id } });
  await prisma.user.create({ data: { email: "auditor@demo.suvidha.app", displayName: "V. Chandran (Auditor)", primaryRole: "auditor", institutionId: ashokaBank.id } });
  await prisma.user.create({ data: { email: "integration.admin@demo.suvidha.app", displayName: "Kabir Sheikh (Integration Administrator)", primaryRole: "integration_admin", institutionId: ashokaBank.id } });

  await prisma.caseAssignment.createMany({
    data: [
      { claimId: vikramInsuranceClaim.id, institutionId: surakshaInsurance.id, assignedUserId: claimsOfficer.id, role: "verification_officer" },
      { claimId: prakashInsuranceClaim.id, institutionId: surakshaInsurance.id, assignedUserId: verificationOfficer.id, role: "verification_officer" },
    ],
  });
  void maker; void checker;

  await prisma.sLA.createMany({
    data: [
      { institutionId: ashokaBank.id, processType: "death_event_acknowledgement", targetDays: 2 },
      { institutionId: ashokaBank.id, processType: "claim_first_response", targetDays: 5 },
      { institutionId: surakshaInsurance.id, processType: "claim_settlement", targetDays: 30 },
    ],
  });

  // ---------------------------------------------------------------------------------------------
  // AUTHORITY RULES (mirrors src/lib/engines/authority-engine.ts — see docs/AUTHORITY_RULES.md)
  // ---------------------------------------------------------------------------------------------
  const ruleDefs = [
    { key: "nominee_no_dispute", title: "Undisputed nominee", description: "Pay to nominee subject to legal rights when a valid, undisputed nomination exists." },
    { key: "surviving_joint_holder_either_or_survivor", title: "Surviving joint holder", description: "Transfer to the surviving holder under an Either-or-Survivor mandate." },
    { key: "will_with_executor", title: "Will with named executor", description: "Administer through the named executor." },
    { key: "no_will_multiple_heirs", title: "Intestate, multiple heirs", description: "Require a succession certificate naming all heirs and shares." },
  ];
  for (const r of ruleDefs) {
    await prisma.rule.create({
      data: { ruleKey: r.key, title: r.title, description: r.description,
        versions: { create: [{ version: 1, definition: toJsonColumn({ key: r.key }), isActive: true }] } },
    });
  }

  console.log("Seed complete.");
  console.log("Demo users:");
  const allUsers = await prisma.user.findMany({ select: { email: true, primaryRole: true } });
  for (const u of allUsers) console.log(`  ${u.email}  (${u.primaryRole})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
